import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { prisma } from '@mama-fua/database';

const router = Router();
router.use(authenticate);

router.get('/coverage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, serviceId } = req.query as Record<string, string>;
    const count = await prisma.cleanerProfile.count({
      where: {
        verificationStatus: 'VERIFIED',
        isAvailable: true,
        services: { some: { serviceId, isActive: true } },
      },
    });
    res.json({ success: true, data: { covered: count >= 3, cleanerCount: count } });
  } catch (err) {
    next(err);
  }
});

router.get('/cleaners/nearby', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = z
      .object({
        lat: z.coerce.number(),
        lng: z.coerce.number(),
        serviceId: z.string().min(1),
        scheduledAt: z.string().datetime().optional(),
        minRating: z.coerce.number().min(0).max(5).default(3.5),
        maxPrice: z.coerce.number().int().positive().optional(),
        radiusKm: z.coerce.number().int().min(1).max(20).default(10),
        sort: z.enum(['recommended', 'distance', 'rating', 'price']).default('recommended'),
      })
      .parse(req.query);

    const scheduledAt = query.scheduledAt ? new Date(query.scheduledAt) : null;
    const candidates = await prisma.cleanerProfile.findMany({
      where: {
        verificationStatus: 'VERIFIED',
        isAvailable: true,
        serviceAreaLat: { not: null },
        serviceAreaLng: { not: null },
        services: { some: { serviceId: query.serviceId, isActive: true } },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        services: {
          where: { serviceId: query.serviceId, isActive: true },
          include: { service: true },
        },
        availabilitySlots: {
          where: {
            OR: [
              { isRecurring: true },
              ...(scheduledAt
                ? [
                    {
                      specificDate: {
                        gte: startOfDay(scheduledAt),
                        lt: endOfDay(scheduledAt),
                      },
                    },
                  ]
                : []),
            ],
          },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
      take: 100,
    });

    const bookingsByCleaner = new Map<string, Array<{ status: string; scheduledAt: Date }>>();

    if (scheduledAt && candidates.length > 0) {
      const blockingBookings = await prisma.booking.findMany({
        where: {
          cleanerId: { in: candidates.map((candidate) => candidate.userId) },
          status: { in: ['ACCEPTED', 'PAID', 'IN_PROGRESS'] },
          OR: [
            { status: 'IN_PROGRESS' },
            {
              scheduledAt: {
                gte: new Date(scheduledAt.getTime() - 2 * 60 * 60 * 1000),
                lte: new Date(scheduledAt.getTime() + 2 * 60 * 60 * 1000),
              },
            },
          ],
        },
        select: { cleanerId: true, status: true, scheduledAt: true },
      });

      blockingBookings.forEach((booking) => {
        if (!booking.cleanerId) return;
        const existing = bookingsByCleaner.get(booking.cleanerId) ?? [];
        existing.push({ status: booking.status, scheduledAt: booking.scheduledAt });
        bookingsByCleaner.set(booking.cleanerId, existing);
      });
    }

    const cleaners = candidates
      .map((candidate) => {
        const service = candidate.services[0];
        const lat = candidate.serviceAreaLat ?? candidate.currentLat;
        const lng = candidate.serviceAreaLng ?? candidate.currentLng;
        if (!service || lat == null || lng == null) return null;

        const rating = Number(candidate.rating);
        const distanceKm = haversineDistanceKm(query.lat, query.lng, lat, lng);
        const servicePrice = service.customPrice || service.service.basePrice;
        const blocking = bookingsByCleaner.get(candidate.userId) ?? [];
        const availableForSlot =
          !scheduledAt || isAvailableForSlot(candidate.availabilitySlots, scheduledAt, blocking);

        if (rating < query.minRating) return null;
        if (distanceKm > query.radiusKm) return null;
        if (distanceKm > candidate.serviceAreaRadius) return null;
        if (query.maxPrice && servicePrice > query.maxPrice) return null;
        if (!availableForSlot) return null;

        return {
          id: candidate.userId,
          bio: candidate.bio,
          rating,
          totalReviews: candidate.totalReviews,
          totalJobs: candidate.totalJobs,
          isAvailable: candidate.isAvailable,
          verificationStatus: candidate.verificationStatus,
          serviceAreaRadius: candidate.serviceAreaRadius,
          serviceAreaLat: lat,
          serviceAreaLng: lng,
          distanceKm: Number(distanceKm.toFixed(1)),
          servicePrice,
          nextAvailableLabel: describeAvailability(candidate.availabilitySlots, scheduledAt),
          recommendedScore: getRecommendedScore(distanceKm, rating, candidate.totalJobs),
          user: candidate.user,
          services: candidate.services.map((cleanerService) => ({
            id: cleanerService.id,
            customPrice: cleanerService.customPrice,
            isActive: cleanerService.isActive,
            service: cleanerService.service,
          })),
        };
      })
      .filter((cleaner): cleaner is NonNullable<typeof cleaner> => cleaner !== null)
      .sort((a, b) => sortCandidates(a, b, query.sort))
      .slice(0, 20);

    res.json({ success: true, data: cleaners });
  } catch (err) {
    next(err);
  }
});

router.post('/cleaner/position', async (req: Request, res: Response) => {
  // Handled via WebSocket — REST fallback
  res.json({ success: true, data: { message: 'Use WebSocket for live position updates' } });
});

export default router;

function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function isAvailableForSlot(
  slots: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
    specificDate: Date | null;
    isBlocked: boolean;
  }>,
  scheduledAt: Date,
  blockingBookings: Array<{ status: string; scheduledAt: Date }>
) {
  const dayOfWeek = scheduledAt.getDay();
  const time = `${String(scheduledAt.getHours()).padStart(2, '0')}:${String(scheduledAt.getMinutes()).padStart(2, '0')}`;
  const sameDaySlots = slots.filter((slot) => {
    if (slot.isBlocked) return false;
    if (slot.specificDate) {
      return slot.specificDate.toDateString() === scheduledAt.toDateString();
    }
    return slot.isRecurring && slot.dayOfWeek === dayOfWeek;
  });

  const hasSlot = sameDaySlots.some((slot) => time >= slot.startTime && time < slot.endTime);
  if (!hasSlot) return false;

  return !blockingBookings.some((booking) => {
    if (booking.status === 'IN_PROGRESS') return true;
    return Math.abs(booking.scheduledAt.getTime() - scheduledAt.getTime()) < 2 * 60 * 60 * 1000;
  });
}

function describeAvailability(
  slots: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
    specificDate: Date | null;
    isBlocked: boolean;
  }>,
  scheduledAt: Date | null
) {
  if (scheduledAt) return 'Available for your selected time';

  const nextRecurring = slots.find((slot) => slot.isRecurring && !slot.isBlocked);
  if (!nextRecurring) return 'Availability on request';

  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][nextRecurring.dayOfWeek] ?? 'Day';
  return `${day} ${nextRecurring.startTime} - ${nextRecurring.endTime}`;
}

function getRecommendedScore(distanceKm: number, rating: number, totalJobs: number) {
  const distanceScore = Math.max(0, (20 - distanceKm) / 20) * 100;
  const ratingScore = (rating / 5) * 100;
  const experienceScore = Math.min(100, Math.log10(totalJobs + 1) * 45);
  return Number((distanceScore * 0.3 + ratingScore * 0.5 + experienceScore * 0.2).toFixed(1));
}

function sortCandidates(
  a: { recommendedScore: number; distanceKm: number; rating: number; servicePrice: number },
  b: { recommendedScore: number; distanceKm: number; rating: number; servicePrice: number },
  sort: 'recommended' | 'distance' | 'rating' | 'price'
) {
  if (sort === 'distance') return a.distanceKm - b.distanceKm || b.rating - a.rating;
  if (sort === 'rating') return b.rating - a.rating || a.distanceKm - b.distanceKm;
  if (sort === 'price') return a.servicePrice - b.servicePrice || b.rating - a.rating;
  return b.recommendedScore - a.recommendedScore || a.distanceKm - b.distanceKm;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}
