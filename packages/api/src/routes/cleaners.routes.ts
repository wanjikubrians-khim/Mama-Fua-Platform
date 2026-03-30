import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '@mama-fua/database';
const router = Router();

const pricingSchema = z.object({
  homeCleaningPrice: z.coerce.number().int().min(500).optional(),
  laundryPrice: z.coerce.number().int().min(300).optional(),
  officeCleaningPrice: z.coerce.number().int().min(800).optional(),
  deepCleaningPrice: z.coerce.number().int().min(1500).optional(),
  postConstructionPrice: z.coerce.number().int().min(2500).optional(),
});

const SERVICE_NAME_BY_FIELD = {
  homeCleaningPrice: 'Home Cleaning',
  laundryPrice: 'Laundry (Mama Fua)',
  officeCleaningPrice: 'Office Cleaning',
  deepCleaningPrice: 'Deep Cleaning',
  postConstructionPrice: 'Post-Construction Cleaning',
} as const;

router.get(
  '/me',
  authenticate,
  requireRole('CLEANER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await prisma.cleanerProfile.findUnique({
        where: { userId: req.user!.sub },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              phone: true,
              email: true,
            },
          },
          services: { include: { service: true } },
        },
      });
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await prisma.cleanerProfile.findUnique({
      where: { userId: req.params['id'] },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        services: { include: { service: true } },
        availabilitySlots: {
          where: { isBlocked: false },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/me',
  authenticate,
  requireRole('CLEANER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bio, serviceAreaLat, serviceAreaLng, serviceAreaRadius, mpesaPhone } = req.body;
      const profile = await prisma.cleanerProfile.update({
        where: { userId: req.user!.sub },
        data: { bio, serviceAreaLat, serviceAreaLng, serviceAreaRadius, mpesaPhone },
      });
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/me/available',
  authenticate,
  requireRole('CLEANER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { isAvailable } = req.body;
      const profile = await prisma.cleanerProfile.update({
        where: { userId: req.user!.sub },
        data: { isAvailable },
      });
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/me/wallet',
  authenticate,
  requireRole('CLEANER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await prisma.cleanerProfile.findUnique({ where: { userId: req.user!.sub } });
      const transactions = await prisma.walletTransaction.findMany({
        where: { cleanerId: profile!.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      res.json({ success: true, data: { balance: profile!.walletBalance, transactions } });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/me/pricing',
  authenticate,
  requireRole('CLEANER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = pricingSchema.parse(req.body);
      const updates = Object.entries(body).filter(([, value]) => value !== undefined);

      const cleanerProfile = await prisma.cleanerProfile.findUnique({
        where: { userId: req.user!.sub },
      });

      if (!cleanerProfile) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Cleaner profile not found' } });
        return;
      }

      if (updates.length === 0) {
        res.json({ success: true, data: { message: 'No pricing changes submitted' } });
        return;
      }

      const serviceNames = updates.map(([field]) => SERVICE_NAME_BY_FIELD[field as keyof typeof SERVICE_NAME_BY_FIELD]);
      const services = await prisma.service.findMany({
        where: { name: { in: serviceNames } },
        select: { id: true, name: true },
      });

      const serviceIdByName = new Map(
        services.map((service: { name: string; id: string }) => [service.name, service.id])
      );

      await prisma.$transaction(
        updates.map(([field, value]) =>
          prisma.cleanerService.upsert({
            where: {
              cleanerId_serviceId: {
                cleanerId: cleanerProfile.id,
                serviceId: serviceIdByName.get(
                  SERVICE_NAME_BY_FIELD[field as keyof typeof SERVICE_NAME_BY_FIELD]
                )!,
              },
            },
            update: {
              customPrice: value as number,
              isActive: true,
            },
            create: {
              cleanerId: cleanerProfile.id,
              serviceId: serviceIdByName.get(
                SERVICE_NAME_BY_FIELD[field as keyof typeof SERVICE_NAME_BY_FIELD]
              )!,
              customPrice: value as number,
              isActive: true,
            },
          })
        )
      );

      res.json({ success: true, data: { message: 'Pricing updated successfully' } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
