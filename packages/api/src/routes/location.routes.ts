import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '@mama-fua/database';
const router = Router();
router.use(authenticate);

router.get('/coverage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, serviceId } = req.query as Record<string, string>;
    const count = await prisma.cleanerProfile.count({
      where: {
        verificationStatus: 'VERIFIED', isAvailable: true,
        services: { some: { serviceId, isActive: true } },
      }
    });
    res.json({ success: true, data: { covered: count >= 3, cleanerCount: count } });
  } catch (err) { next(err); }
});

router.get('/cleaners/nearby', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serviceId } = req.query as Record<string, string>;
    const cleaners = await prisma.cleanerProfile.findMany({
      where: { verificationStatus: 'VERIFIED', isAvailable: true, services: { some: { serviceId, isActive: true } } },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }, services: { include: { service: true } } },
      take: 20,
      orderBy: { rating: 'desc' },
    });
    res.json({ success: true, data: cleaners });
  } catch (err) { next(err); }
});

router.post('/cleaner/position', async (req: Request, res: Response) => {
  // Handled via WebSocket — REST fallback
  res.json({ success: true, data: { message: 'Use WebSocket for live position updates' } });
});

export default router;
