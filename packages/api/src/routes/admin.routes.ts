import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '@mama-fua/database';
const router = Router();
router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

router.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [users, bookings, disputes, pendingPayouts] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.dispute.count({ where: { status: 'OPEN' } }),
      prisma.payout.count({ where: { status: 'PENDING' } }),
    ]);
    res.json({ success: true, data: { totalUsers: users, activeJobs: bookings, openDisputes: disputes, pendingPayouts } });
  } catch (err) { next(err); }
});

router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, status, page = '1', pageSize = '20' } = req.query as Record<string, string>;
    const where: Record<string, string> = {};
    if (role) where['role'] = role;
    if (status) where['status'] = status;
    const users = await prisma.user.findMany({ where, skip: (parseInt(page) - 1) * parseInt(pageSize), take: parseInt(pageSize), orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
});

router.get('/disputes', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const disputes = await prisma.dispute.findMany({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } }, include: { booking: true, raisedBy: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'asc' } });
    res.json({ success: true, data: disputes });
  } catch (err) { next(err); }
});

router.patch('/cleaners/:userId/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, rejectionReason } = req.body;
    const profile = await prisma.cleanerProfile.update({ where: { userId: req.params['userId'] }, data: { verificationStatus: status, verifiedAt: status === 'VERIFIED' ? new Date() : null, verifiedById: req.user!.sub } });
    await prisma.adminAction.create({ data: { adminId: req.user!.sub, action: `CLEANER_${status}`, targetType: 'user', targetId: req.params['userId']!, notes: rejectionReason } });
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
});

export default router;
