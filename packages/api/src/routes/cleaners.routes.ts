import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '@mama-fua/database';
const router = Router();

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
            select: { id: true, firstName: true, lastName: true, avatarUrl: true, phone: true },
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

export default router;
