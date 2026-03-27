// Mama Fua — Job Queue (Bull)
// KhimTech | 2026
//
// Manages all async background jobs:
//   - escrow-release: release funds to cleaner 24h after job completion
//   - payout-process: initiate M-Pesa B2C payout
//   - match-timeout:  cascade to next cleaner if no response in 5 min
//   - booking-reminder: SMS/push 24h before scheduled job

import Bull, { Queue, Job } from 'bull';
import { prisma } from '@mama-fua/database';
import { BOOKING } from '@mama-fua/shared';
import { releaseEscrow } from '../services/payment.service';
import { initiateCleanerPayout } from '../services/mpesa/mpesa.service';
import { dispatchMatchQueue } from '../services/matching.service';
import { notifyUser } from '../services/notification.service';
import { sendSms } from '../services/sms.service';
import { logger } from '../lib/logger';
import { format } from 'date-fns';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

const queueOpts = {
  redis: REDIS_URL,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
};

// ── Queue declarations ────────────────────────────────────────────────

export const escrowQueue:   Queue = new Bull('escrow-release',  queueOpts);
export const payoutQueue:   Queue = new Bull('payout-process',  queueOpts);
export const matchQueue:    Queue = new Bull('match-timeout',   queueOpts);
export const reminderQueue: Queue = new Bull('booking-reminder',queueOpts);

// ── Job: escrow-release ───────────────────────────────────────────────

escrowQueue.process(async (job: Job<{ bookingId: string }>) => {
  const { bookingId } = job.data;
  logger.info(`[Queue] Escrow release for booking ${bookingId}`);

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { skipped: true, reason: 'Booking not found' };
  if (booking.status !== 'COMPLETED') return { skipped: true, reason: `Status is ${booking.status}` };

  await releaseEscrow(bookingId);
  return { released: true, bookingId };
});

escrowQueue.on('failed', (job, err) => {
  logger.error(`[Queue] Escrow release failed for ${job.data.bookingId}:`, err.message);
});

// ── Job: payout-process ───────────────────────────────────────────────

payoutQueue.process(async (job: Job<{ payoutId: string }>) => {
  const { payoutId } = job.data;
  logger.info(`[Queue] Processing payout ${payoutId}`);

  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout) return { skipped: true, reason: 'Payout not found' };
  if (payout.status !== 'PENDING' && payout.status !== 'PROCESSING') {
    return { skipped: true, reason: `Status is ${payout.status}` };
  }

  await initiateCleanerPayout(payoutId);
  return { initiated: true, payoutId };
});

payoutQueue.on('failed', async (job, err) => {
  logger.error(`[Queue] Payout failed for ${job.data.payoutId}:`, err.message);
  // After all retries exhausted, mark as FAILED and return funds
  if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
    const payout = await prisma.payout.findUnique({
      where: { id: job.data.payoutId },
      include: { cleaner: true },
    });
    if (payout && payout.status === 'PROCESSING') {
      await prisma.payout.update({ where: { id: payout.id }, data: { status: 'FAILED', failureReason: err.message } });
      await prisma.cleanerProfile.update({ where: { id: payout.cleanerId }, data: { walletBalance: { increment: payout.amount } } });
      logger.warn(`[Queue] Payout ${payout.id} permanently failed — funds returned to wallet`);
    }
  }
});

// ── Job: match-timeout ────────────────────────────────────────────────

matchQueue.process(async (job: Job<{ bookingId: string; excludedCleanerId: string; serviceId: string; addressId: string }>) => {
  const { bookingId, excludedCleanerId, serviceId, addressId } = job.data;
  logger.info(`[Queue] Match timeout for booking ${bookingId} — cascading from cleaner ${excludedCleanerId}`);

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { skipped: true, reason: 'Booking not found' };
  if (!['PENDING', 'ACCEPTED'].includes(booking.status)) return { skipped: true, reason: `Status is ${booking.status}` };
  if (booking.cleanerId !== excludedCleanerId) return { skipped: true, reason: 'Different cleaner already assigned' };

  await dispatchMatchQueue(bookingId, serviceId, addressId, excludedCleanerId);
  return { cascaded: true, bookingId };
});

matchQueue.on('failed', (job, err) => {
  logger.error(`[Queue] Match timeout job failed for ${job.data.bookingId}:`, err.message);
});

// ── Job: booking-reminder ─────────────────────────────────────────────

reminderQueue.process(async (job: Job<{ bookingId: string }>) => {
  const { bookingId } = job.data;
  logger.info(`[Queue] Sending booking reminder for ${bookingId}`);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      client: { select: { id: true, phone: true, firstName: true } },
      cleaner: { select: { id: true, phone: true, firstName: true } },
      service: { select: { name: true } },
      address: { select: { area: true } },
    },
  });

  if (!booking || !['PAID', 'ACCEPTED'].includes(booking.status)) {
    return { skipped: true };
  }

  const scheduledStr = format(new Date(booking.scheduledAt), 'EEEE dd MMM \'at\' h:mm a');

  // Remind client
  await notifyUser(booking.client.id, {
    type: 'BOOKING',
    title: 'Job reminder 🗓️',
    body: `Your ${booking.service.name} is scheduled for tomorrow ${scheduledStr}`,
    data: { screen: 'BookingDetail', bookingId },
    channels: ['IN_APP', 'PUSH', 'EMAIL'],
  });
  await sendSms(
    booking.client.phone,
    `Mama Fua reminder: Your ${booking.service.name} is tomorrow ${scheduledStr} in ${booking.address.area}. Booking ${booking.bookingRef}.`
  );

  // Remind cleaner
  if (booking.cleaner) {
    await notifyUser(booking.cleaner.id, {
      type: 'BOOKING',
      title: 'Job reminder 🗓️',
      body: `You have a ${booking.service.name} job tomorrow ${scheduledStr} in ${booking.address.area}`,
      data: { screen: 'BookingDetail', bookingId },
      channels: ['IN_APP', 'PUSH', 'EMAIL'],
    });
    await sendSms(
      booking.cleaner.phone,
      `Mama Fua reminder: You have a ${booking.service.name} job tomorrow ${scheduledStr} in ${booking.address.area}. Booking ${booking.bookingRef}.`
    );
  }

  return { reminded: true, bookingId };
});

// ── Helpers: enqueue jobs ─────────────────────────────────────────────

/** Schedule escrow release 24 hours after job completion */
export async function enqueueEscrowRelease(bookingId: string): Promise<void> {
  await escrowQueue.add(
    { bookingId },
    { delay: BOOKING.ESCROW_RELEASE_HOURS * 3_600_000, jobId: `escrow:${bookingId}` }
  );
  logger.info(`[Queue] Escrow release queued for booking ${bookingId} in ${BOOKING.ESCROW_RELEASE_HOURS}h`);
}

/** Enqueue payout processing (with optional delay) */
export async function enqueuePayout(payoutId: string, delayMs = 0): Promise<void> {
  await payoutQueue.add({ payoutId }, { delay: delayMs, jobId: `payout:${payoutId}` });
}

/** Enqueue match cascade after cleaner timeout */
export async function enqueueMatchTimeout(
  bookingId: string, cleanerId: string, serviceId: string, addressId: string
): Promise<void> {
  await matchQueue.add(
    { bookingId, excludedCleanerId: cleanerId, serviceId, addressId },
    { delay: BOOKING.AUTO_ASSIGN_TIMEOUT_MS, jobId: `match:${bookingId}:${cleanerId}` }
  );
}

/** Schedule booking reminder 24h before job */
export async function enqueueBookingReminder(bookingId: string, scheduledAt: Date): Promise<void> {
  const reminderAt = new Date(scheduledAt.getTime() - 24 * 3_600_000);
  const delay = Math.max(0, reminderAt.getTime() - Date.now());
  if (delay > 0) {
    await reminderQueue.add({ bookingId }, { delay, jobId: `reminder:${bookingId}` });
    logger.info(`[Queue] Reminder queued for booking ${bookingId} — fires in ${Math.round(delay / 3_600_000)}h`);
  }
}

// ── Health check ──────────────────────────────────────────────────────

export async function getQueueStats() {
  const [escrow, payout, match, reminder] = await Promise.all([
    escrowQueue.getJobCounts(),
    payoutQueue.getJobCounts(),
    matchQueue.getJobCounts(),
    reminderQueue.getJobCounts(),
  ]);
  return { escrow, payout, match, reminder };
}
