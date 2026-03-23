// Mama Fua — Booking Service
// KhimTech | 2026

import { prisma, BookingStatus, BookingMode } from '@mama-fua/database';
import {
  BOOKING, COMMISSION, generateBookingRef, calculateCommission, ERROR_CODES,
} from '@mama-fua/shared';
import { AppError } from '../middleware/errorHandler';
import { dispatchMatchQueue } from './matching.service';
import { releaseEscrow, scheduleEscrowRelease } from './payment.service';
import { notifyUser } from './notification.service';
import { logger } from '../lib/logger';

// ── Create Booking ──────────────────────────────────────────────────────

export async function createBooking(clientId: string, input: {
  serviceId: string;
  mode: string;
  cleanerId?: string;
  addressId?: string;
  address?: {
    label: string; addressLine1: string; area: string; lat: number; lng: number;
    addressLine2?: string; city?: string; county?: string; instructions?: string; saveAddress?: boolean;
  };
  scheduledAt: string;
  bookingType: string;
  recurringFrequency?: string;
  specialInstructions?: string;
  paymentMethod: string;
  mpesaPhone?: string;
}) {
  const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
  if (!service || !service.isActive) throw new AppError(ERROR_CODES.NOT_FOUND, 'Service not found', 404);

  // Resolve address
  let addressId = input.addressId;
  if (!addressId && input.address) {
    const addr = await prisma.address.create({
      data: {
        userId: clientId,
        label: input.address.label,
        addressLine1: input.address.addressLine1,
        addressLine2: input.address.addressLine2,
        area: input.address.area,
        city: input.address.city ?? 'Nairobi',
        county: input.address.county,
        lat: input.address.lat,
        lng: input.address.lng,
        instructions: input.address.instructions,
      },
    });
    addressId = addr.id;
  }
  if (!addressId) throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Address is required', 400);

  // Commission rate
  let commissionRate = COMMISSION.STANDARD;
  if (input.cleanerId) {
    const cp = await prisma.cleanerProfile.findUnique({ where: { userId: input.cleanerId } });
    if (cp && Number(cp.rating) >= 4.8) commissionRate = COMMISSION.PREMIUM_CLEANER;
  }

  const { platformFee, cleanerEarnings } = calculateCommission(service.basePrice, commissionRate);

  // Generate booking ref
  const count = await prisma.booking.count();
  const bookingRef = generateBookingRef(count + 1);

  const booking = await prisma.booking.create({
    data: {
      bookingRef,
      clientId,
      cleanerId: input.cleanerId,
      serviceId: input.serviceId,
      mode: input.mode as BookingMode,
      status: 'PENDING',
      bookingType: input.bookingType as 'ONE_OFF' | 'RECURRING',
      recurringFrequency: input.recurringFrequency as 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | undefined,
      scheduledAt: new Date(input.scheduledAt),
      estimatedDuration: service.durationMinutes,
      addressId,
      specialInstructions: input.specialInstructions,
      baseAmount: service.basePrice,
      platformFee,
      totalAmount: service.basePrice,
      cleanerEarnings,
    },
    include: { service: true, address: true, client: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
  });

  // Dispatch matching for AUTO_ASSIGN
  if (input.mode === 'AUTO_ASSIGN') {
    dispatchMatchQueue(booking.id, input.serviceId, booking.addressId).catch(
      (err) => logger.error('Match dispatch failed:', err)
    );
  }

  // Notify specific cleaner for BROWSE_PICK
  if (input.mode === 'BROWSE_PICK' && input.cleanerId) {
    await notifyUser(input.cleanerId, {
      title: 'New booking request',
      body: `${booking.client.firstName} has requested your services on ${new Date(booking.scheduledAt).toDateString()}`,
      data: { screen: 'BookingDetail', bookingId: booking.id },
    });
  }

  return booking;
}

// ── List Bookings ───────────────────────────────────────────────────────

export async function listBookings(userId: string, role: string, query: { status?: string; page: number; pageSize: number }) {
  const where = role === 'CLIENT' ? { clientId: userId } : { cleanerId: userId };
  if (query.status) Object.assign(where, { status: query.status });

  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { scheduledAt: 'desc' },
      include: {
        service: { select: { name: true, category: true } },
        address: { select: { area: true, city: true } },
        cleaner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        client: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    data,
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
      hasNext: query.page * query.pageSize < total,
      hasPrev: query.page > 1,
    },
  };
}

// ── Get Single Booking ──────────────────────────────────────────────────

export async function getBooking(bookingId: string, userId: string, role: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      address: true,
      cleaner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, phone: true } },
      client: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, phone: true } },
      payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      review: true,
      dispute: true,
    },
  });
  if (!booking) throw new AppError(ERROR_CODES.NOT_FOUND, 'Booking not found', 404);

  const isParty = booking.clientId === userId || booking.cleanerId === userId;
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  if (!isParty && !isAdmin) throw new AppError(ERROR_CODES.FORBIDDEN, 'Access denied', 403);

  return booking;
}

// ── State Transitions ───────────────────────────────────────────────────

export async function acceptBooking(bookingId: string, cleanerId: string) {
  const booking = await getBookingOrThrow(bookingId);
  assertStatus(booking.status, ['PENDING']);
  if (booking.cleanerId !== cleanerId) throw new AppError(ERROR_CODES.FORBIDDEN, 'Not assigned to this booking', 403);

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'ACCEPTED', acceptedAt: new Date() },
  });

  await notifyUser(booking.clientId, {
    title: 'Cleaner accepted!',
    body: 'Your cleaner is confirmed. Track their arrival.',
    data: { screen: 'TrackCleaner', bookingId },
  });

  return updated;
}

export async function declineBooking(bookingId: string, cleanerId: string, reason?: string) {
  const booking = await getBookingOrThrow(bookingId);
  assertStatus(booking.status, ['PENDING']);
  if (booking.cleanerId !== cleanerId) throw new AppError(ERROR_CODES.FORBIDDEN, 'Not assigned to this booking', 403);

  await prisma.booking.update({ where: { id: bookingId }, data: { cleanerId: null, status: 'PENDING' } });

  // Re-dispatch matching with next candidate
  dispatchMatchQueue(bookingId, booking.serviceId, booking.addressId, cleanerId).catch(
    (err) => logger.error('Re-match dispatch failed:', err)
  );
}

export async function startBooking(bookingId: string, cleanerId: string) {
  const booking = await getBookingOrThrow(bookingId);
  assertStatus(booking.status, ['PAID', 'ACCEPTED']);
  if (booking.cleanerId !== cleanerId) throw new AppError(ERROR_CODES.FORBIDDEN, 'Not assigned to this booking', 403);

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'IN_PROGRESS', actualStartAt: new Date() },
  });

  await notifyUser(booking.clientId, {
    title: 'Job started!',
    body: 'Your cleaner has checked in and the job is underway.',
    data: { screen: 'BookingDetail', bookingId },
  });

  return updated;
}

export async function completeBooking(bookingId: string, cleanerId: string) {
  const booking = await getBookingOrThrow(bookingId);
  assertStatus(booking.status, ['IN_PROGRESS']);
  if (booking.cleanerId !== cleanerId) throw new AppError(ERROR_CODES.FORBIDDEN, 'Not assigned to this booking', 403);

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'COMPLETED', actualEndAt: new Date() },
  });

  // Schedule escrow release in 24 hours
  await scheduleEscrowRelease(bookingId);

  await notifyUser(booking.clientId, {
    title: 'Job complete!',
    body: 'Please confirm the job and leave a review. Payment releases in 24 hours.',
    data: { screen: 'WriteReview', bookingId },
  });

  return updated;
}

export async function confirmBooking(bookingId: string, clientId: string) {
  const booking = await getBookingOrThrow(bookingId);
  assertStatus(booking.status, ['COMPLETED']);
  if (booking.clientId !== clientId) throw new AppError(ERROR_CODES.FORBIDDEN, 'Not your booking', 403);

  await releaseEscrow(bookingId);
  return prisma.booking.findUnique({ where: { id: bookingId } });
}

export async function cancelBooking(bookingId: string, userId: string, role: string, reason?: string) {
  const booking = await getBookingOrThrow(bookingId);
  assertStatus(booking.status, ['DRAFT', 'PENDING', 'ACCEPTED', 'PAID']);

  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isParty = booking.clientId === userId || booking.cleanerId === userId;
  if (!isParty && !isAdmin) throw new AppError(ERROR_CODES.FORBIDDEN, 'Cannot cancel this booking', 403);

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledById: userId, cancelReason: reason },
  });
}

export async function raiseDispute(bookingId: string, clientId: string, input: {
  reason: string; description: string; evidenceUrls?: string[];
}) {
  const booking = await getBookingOrThrow(bookingId);
  assertStatus(booking.status, ['COMPLETED']);
  if (booking.clientId !== clientId) throw new AppError(ERROR_CODES.FORBIDDEN, 'Not your booking', 403);

  const existing = await prisma.dispute.findUnique({ where: { bookingId } });
  if (existing) throw new AppError(ERROR_CODES.CONFLICT, 'Dispute already raised', 409);

  const [dispute] = await prisma.$transaction([
    prisma.dispute.create({
      data: { bookingId, raisedById: clientId, reason: input.reason, description: input.description, evidenceUrls: input.evidenceUrls ?? [] },
    }),
    prisma.booking.update({ where: { id: bookingId }, data: { status: 'DISPUTED' } }),
  ]);

  return dispute;
}

export async function getChatMessages(bookingId: string, userId: string, query: { cursor?: string; limit: number }) {
  const booking = await getBookingOrThrow(bookingId);
  const isParty = booking.clientId === userId || booking.cleanerId === userId;
  if (!isParty) throw new AppError(ERROR_CODES.FORBIDDEN, 'Access denied', 403);

  return prisma.chatMessage.findMany({
    where: { bookingId, ...(query.cursor && { createdAt: { lt: new Date(query.cursor) } }) },
    take: query.limit,
    orderBy: { createdAt: 'desc' },
    include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
  });
}

export async function submitBid(bookingId: string, cleanerId: string, input: {
  proposedAmount: number; estimatedDuration: number; message?: string;
}) {
  const booking = await getBookingOrThrow(bookingId);
  assertStatus(booking.status, ['PENDING']);
  if (booking.mode !== 'POST_BID') throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Booking is not in bid mode', 400);

  const existing = await prisma.bid.findFirst({ where: { bookingId, cleanerId } });
  if (existing) throw new AppError(ERROR_CODES.CONFLICT, 'Already submitted a bid', 409);

  const expiresAt = new Date(Date.now() + BOOKING.BID_EXPIRY_HOURS * 3600000);
  return prisma.bid.create({ data: { bookingId, cleanerId, ...input, expiresAt } });
}

export async function listBids(bookingId: string, clientId: string) {
  const booking = await getBookingOrThrow(bookingId);
  if (booking.clientId !== clientId) throw new AppError(ERROR_CODES.FORBIDDEN, 'Not your booking', 403);
  return prisma.bid.findMany({
    where: { bookingId, expiresAt: { gt: new Date() } },
    include: { cleaner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function acceptBid(bookingId: string, bidId: string, clientId: string) {
  const booking = await getBookingOrThrow(bookingId);
  if (booking.clientId !== clientId) throw new AppError(ERROR_CODES.FORBIDDEN, 'Not your booking', 403);

  const bid = await prisma.bid.findUnique({ where: { id: bidId } });
  if (!bid || bid.bookingId !== bookingId) throw new AppError(ERROR_CODES.NOT_FOUND, 'Bid not found', 404);

  const { platformFee, cleanerEarnings } = calculateCommission(bid.proposedAmount, COMMISSION.STANDARD);

  const [updated] = await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        cleanerId: bid.cleanerId,
        baseAmount: bid.proposedAmount,
        totalAmount: bid.proposedAmount,
        estimatedDuration: bid.estimatedDuration,
        platformFee,
        cleanerEarnings,
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    }),
    prisma.bid.update({ where: { id: bidId }, data: { isAccepted: true } }),
  ]);

  await notifyUser(bid.cleanerId, {
    title: 'Your bid was accepted!',
    body: `You have a new job on ${new Date(booking.scheduledAt).toDateString()}`,
    data: { screen: 'BookingDetail', bookingId },
  });

  return updated;
}

// ── Helpers ─────────────────────────────────────────────────────────────

async function getBookingOrThrow(bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new AppError(ERROR_CODES.NOT_FOUND, 'Booking not found', 404);
  return booking;
}

function assertStatus(current: string, allowed: BookingStatus[]) {
  if (!allowed.includes(current as BookingStatus)) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      `Invalid status transition. Current: ${current}. Allowed from: ${allowed.join(', ')}`,
      400
    );
  }
}
