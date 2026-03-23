import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '@mama-fua/database';
const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({ where: { userId: req.user!.sub }, orderBy: { createdAt: 'desc' }, take: 50 });
    res.json({ success: true, data: notifications });
  } catch (err) { next(err); }
});

export default router;
