// Mama Fua — Matching Engine
// KhimTech | Lead Dev: Brian Wanjiku | 2026

import { prisma } from '@mama-fua/database';
import { BOOKING, ERROR_CODES } from '@mama-fua/shared';
import { redis, RedisKeys, TTL } from '../lib/redis';
import { notifyUser } from './notification.service';
import { logger } from '../lib/logger';
import { AppError } from '../middleware/errorHandler';

// ── Haversine distance (km) ────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Match Score ─────────────────────────────────────────────────────────

interface CleanerCandidate {
  userId: string;
  lat: number;
  lng: number;
  rating: number;
  totalJobs: number;
  acceptedLast30: number;
  offeredLast30: number;
  lastLocationAt: Date | null;
}

function scoreCandidate(candidate: CleanerCandidate, jobLat: number, jobLng: number): number {
  const distKm = haversineKm(candidate.lat, candidate.lng, jobLat, jobLng);
  const distScore = Math.max(0, (BOOKING.DEFAULT_SEARCH_RADIUS_KM - distKm) / BOOKING.DEFAULT_SEARCH_RADIUS_KM) * 100;

  const ratingScore = (candidate.rating / 5.0) * 100;

  const acceptRate = candidate.offeredLast30 > 0
    ? candidate.acceptedLast30 / candidate.offeredLast30
    : 0.5; // neutral for new cleaners
  const acceptScore = acceptRate * 100;

  const jobScore = Math.min(100, Math.log10(candidate.totalJobs + 1) * 50);

  const hoursSinceActive = candidate.lastLocationAt
    ? (Date.now() - candidate.lastLocationAt.getTime()) / 3_600_000
    : 999;
  const activityBonus = hoursSinceActive < 2 ? 100 : 0;

  return (
    distScore * 0.40 +
    ratingScore * 0.30 +
    acceptScore * 0.20 +
    jobScore * 0.05 +
    activityBonus * 0.05
  );
}

// ── Build Match Queue ────────────────────────────────────────────────────

export async function buildMatchQueue(
  bookingId: string,
  serviceId: string,
  addressId: string,
  excludeCleanerIds: string[] = []
): Promise<string[]> {
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address) throw new AppError(ERROR_CODES.NOT_FOUND, 'Address not found', 404);

  // Find candidates with PostGIS-style distance filter via raw SQL
  const candidates = await prisma.$queryRaw<Array<{
    userId: string;
    serviceAreaLat: number;
    serviceAreaLng: number;
    rating: number;
    totalJobs: number;
    lastLocationAt: Date | null;
  }>>`
    SELECT cp."userId", cp."serviceAreaLat", cp."serviceAreaLng",
           cp.rating, cp."totalJobs", cp."lastLocationAt"
    FROM cleaner_profiles cp
    JOIN cleaner_services cs ON cs."cleanerId" = cp.id
    JOIN users u ON u.id = cp."userId"
    WHERE cs."serviceId" = ${serviceId}
      AND cs."isActive" = true
      AND cp."verificationStatus" = 'VERIFIED'
      AND cp."isAvailable" = true
      AND u.status = 'ACTIVE'
      AND cp."userId" NOT IN (${excludeCleanerIds.length ? excludeCleanerIds.join(',') : 'NULL'})
      AND cp.rating >= ${BOOKING.MIN_CLEANER_RATING_FOR_MATCH}
      AND (
        6371 * 2 * ASIN(SQRT(
          POWER(SIN((RADIANS(${address.lat}) - RADIANS(cp."serviceAreaLat")) / 2), 2) +
          COS(RADIANS(cp."serviceAreaLat")) * COS(RADIANS(${address.lat})) *
          POWER(SIN((RADIANS(${address.lng}) - RADIANS(cp."serviceAreaLng")) / 2), 2)
        ))
      ) <= cp."serviceAreaRadius"
    LIMIT 50
  `;

  if (candidates.length === 0) return [];

  // Score and sort
  const scored = candidates
    .map((c) => ({
      userId: c.userId,
      score: scoreCandidate(
        {
          userId: c.userId,
          lat: c.serviceAreaLat,
          lng: c.serviceAreaLng,
          rating: Number(c.rating),
          totalJobs: c.totalJobs,
          acceptedLast30: 0, // TODO: compute from bookings
          offeredLast30: 1,
          lastLocationAt: c.lastLocationAt,
        },
        address.lat,
        address.lng
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, BOOKING.MAX_MATCH_CANDIDATES)
    .map((c) => c.userId);

  return scored;
}

// ── Dispatch Match Queue ────────────────────────────────────────────────

export async function dispatchMatchQueue(
  bookingId: string,
  serviceId: string,
  addressId: string,
  excludedCleanerId?: string
): Promise<void> {
  // Get existing queue or build fresh
  const queueKey = RedisKeys.matchQueue(bookingId);
  let queue: string[] = [];

  const existing = await redis.get(queueKey);
  if (existing) {
    queue = JSON.parse(existing) as string[];
    if (excludedCleanerId) queue = queue.filter((id) => id !== excludedCleanerId);
  } else {
    const excludes = excludedCleanerId ? [excludedCleanerId] : [];
    queue = await buildMatchQueue(bookingId, serviceId, addressId, excludes);
  }

  if (queue.length === 0) {
    logger.warn(`No candidates found for booking ${bookingId}`);
    await prisma.booking.update({ where: { id: bookingId }, data: { status: 'PENDING' } });
    // Notify client no cleaners found
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (booking) {
      await notifyUser(booking.clientId, {
        type: 'BOOKING',
        title: 'Still searching...',
        body: 'We are looking for available cleaners in your area. We will notify you shortly.',
        data: { screen: 'BookingDetail', bookingId },
      });
    }
    return;
  }

  const nextCleanerId = queue[0]!;
  const remaining = queue.slice(1);

  // Store remaining in Redis
  await redis.setex(queueKey, TTL.BOOKING_LOCK * 12, JSON.stringify(remaining));

  // Assign and notify
  await prisma.booking.update({ where: { id: bookingId }, data: { cleanerId: nextCleanerId } });

  await notifyUser(nextCleanerId, {
    type: 'BOOKING',
    title: 'New job available!',
    body: 'A client needs your services. You have 5 minutes to respond.',
    data: { screen: 'JobOffer', bookingId },
    fallbackChannels: ['SMS'],
  });

  logger.info(`Booking ${bookingId} → offered to cleaner ${nextCleanerId}. ${remaining.length} in queue.`);
}
