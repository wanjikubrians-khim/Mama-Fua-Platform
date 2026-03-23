import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '@mama-fua/database';
import { z } from 'zod';
const router = Router();

router.post('/', authenticate, requireRole('CLIENT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({ bookingId: z.string().uuid(), rating: z.number().int().min(1).max(5), title: z.string().optional(), review: z.string().optional() }).parse(req.body);
    const booking = await prisma.booking.findUnique({ where: { id: body.bookingId } });
    if (!booking?.cleanerId) return next(new Error('Booking not found'));
    const review = await prisma.review.create({ data: { bookingId: body.bookingId, clientId: req.user!.sub, cleanerId: booking.cleanerId, rating: body.rating, title: body.title, body: body.review } });
    await prisma.cleanerProfile.update({ where: { userId: booking.cleanerId }, data: { totalReviews: { increment: 1 } } });
    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
});

router.get('/cleaner/:cleanerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviews = await prisma.review.findMany({ where: { cleanerId: req.params['cleanerId'], isPublic: true }, orderBy: { createdAt: 'desc' }, take: 20, include: { client: { select: { firstName: true, avatarUrl: true } } } });
    res.json({ success: true, data: reviews });
  } catch (err) { next(err); }
});

export default router;
