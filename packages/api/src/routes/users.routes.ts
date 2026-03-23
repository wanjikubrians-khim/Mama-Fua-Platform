import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '@mama-fua/database';
const router = Router();
router.use(authenticate);

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub }, include: { clientProfile: true, cleanerProfile: true } });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.patch('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, email, preferredLang } = req.body;
    const user = await prisma.user.update({ where: { id: req.user!.sub }, data: { firstName, lastName, email, preferredLang } });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.get('/me/notifications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({ where: { userId: req.user!.sub }, orderBy: { createdAt: 'desc' }, take: 50 });
    res.json({ success: true, data: notifications });
  } catch (err) { next(err); }
});

router.patch('/me/notifications/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.update({ where: { id: req.params['id'] }, data: { isRead: true, readAt: new Date() } });
    res.json({ success: true, data: { message: 'Marked as read' } });
  } catch (err) { next(err); }
});

export default router;
