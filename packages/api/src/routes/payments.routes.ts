// Mama Fua — Payments Routes (Full M-Pesa Implementation)
// KhimTech | 2026

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { ERROR_CODES, normalisePhone, PAYMENT } from '@mama-fua/shared';
import { prisma } from '@mama-fua/database';
import { initiateBookingPayment, initiateCleanerPayout } from '../services/mpesa/mpesa.service';
import { logger } from '../lib/logger';

const router = Router();
router.use(authenticate);

// POST /payments/mpesa/initiate
router.post('/mpesa/initiate', requireRole('CLIENT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({ bookingId: z.string().uuid(), phone: z.string().min(9) }).parse(req.body);
    const result = await initiateBookingPayment({ bookingId: body.bookingId, clientId: req.user!.sub, phone: normalisePhone(body.phone) });
    res.json({ success: true, data: { ...result, instruction: 'Check your phone and enter your M-Pesa PIN to complete payment.' } });
  } catch (err) { next(err); }
});

// GET /payments/mpesa/status/:checkoutId
router.get('/mpesa/status/:checkoutId', requireRole('CLIENT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { mpesaCheckoutId: req.params['checkoutId'] },
      select: { id: true, status: true, mpesaReceiptNumber: true, amount: true, failureReason: true, booking: { select: { status: true, bookingRef: true } } },
    });
    if (!payment) throw new AppError(ERROR_CODES.NOT_FOUND, 'Payment not found', 404);
    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
});

// POST /payments/wallet/pay
router.post('/wallet/pay', requireRole('CLIENT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingId } = z.object({ bookingId: z.string().uuid() }).parse(req.body);
    const [booking, clientProfile] = await Promise.all([
      prisma.booking.findUnique({ where: { id: bookingId } }),
      prisma.clientProfile.findUnique({ where: { userId: req.user!.sub } }),
    ]);
    if (!booking) throw new AppError(ERROR_CODES.NOT_FOUND, 'Booking not found', 404);
    if (booking.clientId !== req.user!.sub) throw new AppError(ERROR_CODES.FORBIDDEN, 'Not your booking', 403);
    if (!clientProfile || clientProfile.walletBalance < booking.totalAmount) {
      throw new AppError(ERROR_CODES.PAYMENT_FAILED, 'Insufficient wallet balance', 402);
    }
    const [payment] = await prisma.$transaction([
      prisma.payment.create({ data: { bookingId, payerId: req.user!.sub, method: 'WALLET', status: 'SUCCEEDED', amount: booking.totalAmount, currency: 'KES' } }),
      prisma.clientProfile.update({ where: { userId: req.user!.sub }, data: { walletBalance: { decrement: booking.totalAmount } } }),
      prisma.booking.update({ where: { id: bookingId }, data: { status: 'PAID' } }),
    ]);
    res.json({ success: true, data: { paymentId: payment.id, status: 'SUCCEEDED', method: 'WALLET' } });
  } catch (err) { next(err); }
});

// GET /payments/booking/:bookingId
router.get('/booking/:bookingId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await prisma.payment.findFirst({ where: { bookingId: req.params['bookingId'] }, orderBy: { createdAt: 'desc' } });
    if (!payment) throw new AppError(ERROR_CODES.NOT_FOUND, 'Payment not found', 404);
    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
});

// POST /payments/payout/request
router.post('/payout/request', requireRole('CLEANER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({
      amount: z.number().int().min(PAYMENT.MIN_WITHDRAWAL).max(PAYMENT.MAX_WITHDRAWAL),
      method: z.enum(['MPESA', 'BANK']),
      mpesaPhone: z.string().optional(),
      bankName: z.string().optional(),
      bankAccount: z.string().optional(),
    }).parse(req.body);

    const cleanerProfile = await prisma.cleanerProfile.findUnique({ where: { userId: req.user!.sub } });
    if (!cleanerProfile) throw new AppError(ERROR_CODES.NOT_FOUND, 'Cleaner profile not found', 404);
    if (cleanerProfile.walletBalance < body.amount) throw new AppError(ERROR_CODES.PAYMENT_FAILED, 'Insufficient wallet balance', 402);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayCount = await prisma.payout.count({ where: { cleanerId: cleanerProfile.id, createdAt: { gte: today }, status: { not: 'FAILED' } } });
    if (todayCount >= PAYMENT.MAX_WITHDRAWALS_PER_DAY) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Max ${PAYMENT.MAX_WITHDRAWALS_PER_DAY} withdrawals per day reached`, 429);
    }

    const requiresApproval = body.amount > PAYMENT.AUTO_APPROVE_PAYOUT_LIMIT;
    const payout = await prisma.payout.create({
      data: {
        cleanerId: cleanerProfile.id,
        amount: body.amount,
        method: body.method as 'MPESA' | 'STRIPE_CARD' | 'WALLET' | 'CASH',
        status: requiresApproval ? 'PENDING' : 'PROCESSING',
        mpesaPhone: body.mpesaPhone ? normalisePhone(body.mpesaPhone) : cleanerProfile.mpesaPhone,
        bankName: body.bankName,
        bankAccount: body.bankAccount,
      },
    });

    if (!requiresApproval && body.method === 'MPESA') {
      initiateCleanerPayout(payout.id).catch((err) => logger.error(`Payout auto-process failed:`, err));
    }

    res.status(201).json({
      success: true,
      data: {
        payoutId: payout.id,
        status: payout.status,
        requiresApproval,
        message: requiresApproval
          ? 'Payout submitted. Admin approval required for amounts over KES 5,000.'
          : 'Payout initiated. M-Pesa payment incoming shortly.',
      },
    });
  } catch (err) { next(err); }
});

// POST /payments/stripe/intent  (Phase 2 stub)
router.post('/stripe/intent', requireRole('CLIENT'), async (_req: Request, res: Response) => {
  res.json({ success: true, data: { message: 'Stripe integration arriving in Phase 2. Use M-Pesa for now.' } });
});

export default router;
