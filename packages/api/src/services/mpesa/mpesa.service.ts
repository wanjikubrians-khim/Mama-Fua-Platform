// Mama Fua — M-Pesa Payment Service
// KhimTech | 2026
//
// Orchestrates:
//   - STK Push initiation for client bookings
//   - Payment record creation and status updates
//   - Escrow activation on success
//   - B2C payout to cleaners
//   - Retry logic via Bull queue

import { prisma } from '@mama-fua/database';
import { ERROR_CODES, maskPhone, formatKES } from '@mama-fua/shared';
import {
  initiateStkPush, queryStkStatus, initiateB2C,
  isSuccessCode, MPESA_RESULT_CODES, MpesaError,
} from './daraja.client';
import { AppError } from '../../middleware/errorHandler';
import { emitToUser } from '../../socket';
import { notifyUser } from '../notification.service';
import { sendSms } from '../sms.service';
import { scheduleEscrowRelease } from '../payment.service';
import { logger } from '../../lib/logger';
import { redis, RedisKeys, TTL } from '../../lib/redis';

// ── Initiate STK Push for a booking ──────────────────────────────────

export interface InitiatePaymentInput {
  bookingId: string;
  clientId: string;
  phone: string;
}

export interface InitiatePaymentResult {
  paymentId: string;
  checkoutRequestId: string;
  message: string;
}

export async function initiateBookingPayment(
  input: InitiatePaymentInput
): Promise<InitiatePaymentResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: { client: { select: { id: true, phone: true } } },
  });

  if (!booking) throw new AppError(ERROR_CODES.NOT_FOUND, 'Booking not found', 404);
  if (booking.clientId !== input.clientId) throw new AppError(ERROR_CODES.FORBIDDEN, 'Not your booking', 403);
  if (!['PENDING', 'ACCEPTED', 'DRAFT'].includes(booking.status)) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Cannot pay for booking in status: ${booking.status}`, 400);
  }

  // Check no existing successful payment
  const existingPayment = await prisma.payment.findFirst({
    where: { bookingId: input.bookingId, status: { in: ['SUCCEEDED', 'PROCESSING'] } },
  });
  if (existingPayment) {
    throw new AppError(ERROR_CODES.CONFLICT, 'A payment is already in progress for this booking', 409);
  }

  // Amount in KES (convert from cents)
  const amountKES = booking.totalAmount / 100;

  let stkResponse;
  try {
    stkResponse = await initiateStkPush({
      phone: input.phone,
      amountKES,
      bookingRef: booking.bookingRef,
      description: `Mama Fua ${booking.bookingRef}`,
    });
  } catch (err) {
    if (err instanceof MpesaError) {
      throw new AppError(ERROR_CODES.PAYMENT_FAILED, `M-Pesa error: ${err.message}`, 502);
    }
    throw err;
  }

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      bookingId: input.bookingId,
      payerId: input.clientId,
      method: 'MPESA',
      status: 'PROCESSING',
      amount: booking.totalAmount,
      currency: 'KES',
      mpesaPhone: input.phone,
      mpesaCheckoutId: stkResponse.checkoutRequestId,
      metadata: { merchantRequestId: stkResponse.merchantRequestId },
    },
  });

  // Store checkout ID → payment ID mapping in Redis for fast callback lookup
  await redis.setex(
    `mpesa:checkout:${stkResponse.checkoutRequestId}`,
    TTL.BOOKING_LOCK,
    payment.id
  );

  logger.info(`[M-Pesa] STK Push sent to ${maskPhone(input.phone)} for booking ${booking.bookingRef}`);

  // Schedule a status poll in case callback doesn't arrive (60s)
  scheduleStkPoll(stkResponse.checkoutRequestId, payment.id, booking.id, 60_000);

  return {
    paymentId: payment.id,
    checkoutRequestId: stkResponse.checkoutRequestId,
    message: stkResponse.customerMessage,
  };
}

// ── Handle STK Push callback (webhook) ────────────────────────────────

export interface StkCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value?: string | number }>;
      };
    };
  };
}

export async function handleStkCallback(payload: StkCallback): Promise<void> {
  const cb = payload.Body.stkCallback;
  const checkoutId = cb.CheckoutRequestID;
  const resultCode = String(cb.ResultCode);

  logger.info(`[M-Pesa] STK Callback received — CheckoutID: ${checkoutId} Code: ${resultCode}`);

  // Find payment by checkout ID
  const payment = await prisma.payment.findUnique({
    where: { mpesaCheckoutId: checkoutId },
    include: {
      booking: {
        include: {
          client: { select: { id: true, phone: true, firstName: true } },
          cleaner: { select: { id: true } },
        },
      },
    },
  });

  if (!payment) {
    logger.warn(`[M-Pesa] No payment found for CheckoutID: ${checkoutId}`);
    return;
  }

  if (isSuccessCode(resultCode)) {
    // Extract M-Pesa receipt number from callback metadata
    const items = cb.CallbackMetadata?.Item ?? [];
    const getValue = (name: string) =>
      items.find((i) => i.Name === name)?.Value as string | undefined;

    const receiptNumber = getValue('MpesaReceiptNumber');
    const transactionDate = getValue('TransactionDate');
    const phoneNumber = getValue('PhoneNumber');

    // Update payment to SUCCEEDED
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCEEDED',
        mpesaReceiptNumber: receiptNumber,
        metadata: {
          ...(payment.metadata as object),
          receiptNumber,
          transactionDate,
          phoneNumber,
          resultDesc: cb.ResultDesc,
        },
      },
    });

    // Transition booking to PAID
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'PAID' },
    });

    // Schedule escrow release timer
    await scheduleEscrowRelease(payment.bookingId);

    // Real-time notification via socket
    emitToUser(payment.booking.client.id, 'payment:confirmed', {
      bookingId: payment.bookingId,
      paymentId: payment.id,
      receiptNumber,
    });

    // Push notification
    await notifyUser(payment.booking.client.id, {
      title: 'Payment confirmed! ✅',
      body: `${formatKES(payment.amount)} received. M-Pesa ref: ${receiptNumber}`,
      data: { screen: 'BookingDetail', bookingId: payment.bookingId },
    });

    // SMS confirmation (belt-and-suspenders for payment confirmation)
    await sendSms(
      payment.booking.client.phone,
      `Mama Fua: Payment of ${formatKES(payment.amount)} confirmed. M-Pesa ref ${receiptNumber}. Booking ${payment.booking.bookingRef}. Thank you!`
    );

    // Notify cleaner their job is now paid and confirmed
    if (payment.booking.cleaner) {
      await notifyUser(payment.booking.cleaner.id, {
        title: 'Job payment received',
        body: `Payment for booking ${payment.booking.bookingRef} has been confirmed.`,
        data: { screen: 'BookingDetail', bookingId: payment.bookingId },
      });
    }

    logger.info(`[M-Pesa] Payment SUCCEEDED — Receipt: ${receiptNumber} Booking: ${payment.booking.bookingRef}`);
  } else {
    // Payment failed
    const failureReason = MPESA_RESULT_CODES[resultCode] ?? cb.ResultDesc;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        failureReason,
        metadata: { ...(payment.metadata as object), resultCode, resultDesc: cb.ResultDesc },
      },
    });

    // Notify client of failure
    emitToUser(payment.booking.client.id, 'payment:failed', {
      bookingId: payment.bookingId,
      reason: failureReason,
    });

    await notifyUser(payment.booking.client.id, {
      title: 'Payment failed',
      body: `${failureReason}. Please try again.`,
      data: { screen: 'BookingDetail', bookingId: payment.bookingId },
    });

    logger.warn(`[M-Pesa] Payment FAILED — Code: ${resultCode} Reason: ${failureReason} Booking: ${payment.booking.bookingRef}`);
  }

  // Clean up Redis mapping
  await redis.del(`mpesa:checkout:${checkoutId}`);
}

// ── B2C Callback (payout result) ──────────────────────────────────────

export interface B2CResultPayload {
  Result: {
    ResultType: number;
    ResultCode: number;
    ResultDesc: string;
    OriginatorConversationID: string;
    ConversationID: string;
    TransactionID: string;
    ResultParameters?: {
      ResultParameter: Array<{ Key: string; Value: string | number }>;
    };
    ReferenceData?: {
      ReferenceItem: { Key: string; Value: string };
    };
  };
}

export async function handleB2CResult(payload: B2CResultPayload): Promise<void> {
  const result = payload.Result;
  const resultCode = String(result.ResultCode);
  const conversationId = result.ConversationID;

  logger.info(`[M-Pesa] B2C Result — ConversationID: ${conversationId} Code: ${resultCode}`);

  // Find payout by conversationId stored in metadata
  const payout = await prisma.payout.findFirst({
    where: { metadata: { path: ['conversationId'], equals: conversationId } } as Parameters<typeof prisma.payout.findFirst>[0],
    include: { cleaner: { include: { user: { select: { id: true, phone: true, firstName: true } } } } },
  });

  if (!payout) {
    logger.warn(`[M-Pesa] No payout found for ConversationID: ${conversationId}`);
    return;
  }

  if (isSuccessCode(resultCode)) {
    const params = result.ResultParameters?.ResultParameter ?? [];
    const getParam = (key: string) =>
      params.find((p) => p.Key === key)?.Value as string | undefined;

    const receiptNumber = getParam('TransactionReceipt') ?? result.TransactionID;
    const transactionAmount = getParam('TransactionAmount');

    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: 'COMPLETED',
        mpesaReceiptNumber: receiptNumber,
        processedAt: new Date(),
        metadata: { conversationId, receiptNumber, transactionAmount },
      },
    });

    // Create wallet debit transaction
    const cleanerProfile = payout.cleaner;
    await prisma.walletTransaction.create({
      data: {
        cleanerId: cleanerProfile.id,
        type: 'DEBIT',
        amount: payout.amount,
        balanceBefore: cleanerProfile.walletBalance,
        balanceAfter: cleanerProfile.walletBalance - payout.amount,
        payoutId: payout.id,
        description: `Withdrawal via M-Pesa — ref ${receiptNumber}`,
      },
    });

    // Update wallet balance
    await prisma.cleanerProfile.update({
      where: { id: cleanerProfile.id },
      data: { walletBalance: { decrement: payout.amount } },
    });

    // Notify cleaner
    await notifyUser(cleanerProfile.user.id, {
      title: 'Payout sent! 💰',
      body: `${formatKES(payout.amount)} sent to your M-Pesa. Ref: ${receiptNumber}`,
      data: { screen: 'Wallet' },
    });

    await sendSms(
      cleanerProfile.user.phone,
      `Mama Fua: ${formatKES(payout.amount)} sent to your M-Pesa. Ref: ${receiptNumber}. Thank you for being part of Mama Fua!`
    );

    logger.info(`[M-Pesa] B2C SUCCEEDED — Receipt: ${receiptNumber} Cleaner: ${cleanerProfile.user.id}`);
  } else {
    const failureReason = MPESA_RESULT_CODES[resultCode] ?? result.ResultDesc;

    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: 'FAILED',
        failureReason,
        metadata: { conversationId, resultCode, resultDesc: result.ResultDesc },
      },
    });

    // Return funds to wallet
    await prisma.cleanerProfile.update({
      where: { id: payout.cleaner.id },
      data: { walletBalance: { increment: payout.amount } },
    });

    await notifyUser(payout.cleaner.user.id, {
      title: 'Payout failed',
      body: `Your withdrawal of ${formatKES(payout.amount)} failed: ${failureReason}. Funds returned to wallet.`,
      data: { screen: 'Wallet' },
    });

    logger.warn(`[M-Pesa] B2C FAILED — Code: ${resultCode} Reason: ${failureReason}`);
  }
}

// ── STK status poll (fallback for missed callbacks) ───────────────────

function scheduleStkPoll(
  checkoutRequestId: string,
  paymentId: string,
  bookingId: string,
  delayMs: number
): void {
  setTimeout(async () => {
    try {
      // Check if already resolved
      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      if (!payment || payment.status !== 'PROCESSING') return; // already handled

      const queryResult = await queryStkStatus(checkoutRequestId);
      logger.info(`[M-Pesa] Poll result for ${checkoutRequestId}: Code ${queryResult.resultCode}`);

      if (isSuccessCode(queryResult.resultCode)) {
        // Payment went through but callback was missed — update directly
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: 'SUCCEEDED', failureReason: null },
        });
        await prisma.booking.update({ where: { id: bookingId }, data: { status: 'PAID' } });
        await scheduleEscrowRelease(bookingId);
        logger.info(`[M-Pesa] Payment recovered via poll — booking ${bookingId}`);
      } else if (queryResult.resultCode !== '0') {
        // Failed — update payment and leave booking in current state
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'FAILED',
            failureReason: MPESA_RESULT_CODES[queryResult.resultCode] ?? queryResult.resultDesc,
          },
        });
      }
    } catch (err) {
      logger.error('[M-Pesa] STK poll error:', err);
    }
  }, delayMs);
}

// ── Initiate cleaner payout ───────────────────────────────────────────

export async function initiateCleanerPayout(payoutId: string): Promise<void> {
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    include: { cleaner: { include: { user: { select: { id: true, phone: true, firstName: true } } } } },
  });

  if (!payout) throw new AppError(ERROR_CODES.NOT_FOUND, 'Payout not found', 404);
  if (payout.status !== 'PENDING') throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Payout already processed', 400);
  if (!payout.mpesaPhone) throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'No M-Pesa phone on record', 400);

  const amountKES = payout.amount / 100;

  let b2cResponse;
  try {
    b2cResponse = await initiateB2C({
      phone: payout.mpesaPhone,
      amountKES,
      payoutId: payout.id,
      remarks: `Mama Fua earnings payout`,
    });
  } catch (err) {
    if (err instanceof MpesaError) {
      await prisma.payout.update({
        where: { id: payoutId },
        data: { status: 'FAILED', failureReason: err.message },
      });
      throw new AppError(ERROR_CODES.PAYMENT_FAILED, `M-Pesa B2C error: ${err.message}`, 502);
    }
    throw err;
  }

  // Update payout with conversation IDs
  await prisma.payout.update({
    where: { id: payoutId },
    data: {
      status: 'PROCESSING',
      metadata: {
        conversationId: b2cResponse.conversationId,
        originatorConversationId: b2cResponse.originatorConversationId,
      },
    },
  });

  logger.info(`[M-Pesa] B2C initiated — ConversationID: ${b2cResponse.conversationId} Payout: ${payoutId}`);
}
