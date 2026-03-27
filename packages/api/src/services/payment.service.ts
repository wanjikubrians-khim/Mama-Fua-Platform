// Mama Fua — Payment Service (Escrow)
// KhimTech | 2026

import { prisma } from '@mama-fua/database';
import { ERROR_CODES, formatKES } from '@mama-fua/shared';
import { AppError } from '../middleware/errorHandler';
import { notifyUser } from './notification.service';
import { logger } from '../lib/logger';

export async function scheduleEscrowRelease(bookingId: string): Promise<void> {
  // Dynamically import to avoid circular deps (queue imports payment.service)
  const { enqueueEscrowRelease } = await import('../jobs/queue');
  await enqueueEscrowRelease(bookingId);
}

export async function releaseEscrow(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new AppError(ERROR_CODES.NOT_FOUND, 'Booking not found', 404);
  if (!booking.cleanerId) throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'No cleaner assigned', 400);

  const cleanerProfile = await prisma.cleanerProfile.findUnique({ where: { userId: booking.cleanerId } });
  if (!cleanerProfile) throw new AppError(ERROR_CODES.NOT_FOUND, 'Cleaner profile not found', 404);

  await prisma.$transaction([
    prisma.booking.update({ where: { id: bookingId }, data: { status: 'CONFIRMED' } }),
    prisma.cleanerProfile.update({
      where: { id: cleanerProfile.id },
      data: { walletBalance: { increment: booking.cleanerEarnings }, totalJobs: { increment: 1 } },
    }),
    prisma.walletTransaction.create({
      data: {
        cleanerId: cleanerProfile.id,
        type: 'CREDIT',
        amount: booking.cleanerEarnings,
        balanceBefore: cleanerProfile.walletBalance,
        balanceAfter: cleanerProfile.walletBalance + booking.cleanerEarnings,
        bookingId: booking.id,
        description: `Earnings released for booking ${booking.bookingRef}`,
      },
    }),
    prisma.clientProfile.update({
      where: { userId: booking.clientId },
      data: { totalBookings: { increment: 1 } },
    }),
  ]);

  await notifyUser(booking.cleanerId, {
    type: 'PAYMENT',
    title: 'Earnings released! 💰',
    body: `${formatKES(booking.cleanerEarnings)} added to your wallet for booking ${booking.bookingRef}`,
    data: { screen: 'Wallet' },
    channels: ['IN_APP', 'PUSH', 'EMAIL'],
  });

  logger.info(`[Escrow] Released ${formatKES(booking.cleanerEarnings)} to cleaner for booking ${booking.bookingRef}`);
}
