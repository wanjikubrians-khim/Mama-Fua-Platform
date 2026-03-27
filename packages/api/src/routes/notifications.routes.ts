import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { prisma } from '@mama-fua/database';
import { AppError } from '../middleware/errorHandler';
import { ERROR_CODES } from '@mama-fua/shared';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = z.coerce.number().min(1).max(100).default(50).parse(req.query['limit']);

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        id: req.params['id'],
        userId: req.user!.sub,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Notification not found', 404);
    }

    res.json({ success: true, data: { message: 'Marked as read' } });
  } catch (err) {
    next(err);
  }
});

router.patch('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId: req.user!.sub,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({ success: true, data: { message: 'Marked all as read', count: result.count } });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await prisma.notification.deleteMany({
      where: {
        id: req.params['id'],
        userId: req.user!.sub,
      },
    });

    if (result.count === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Notification not found', 404);
    }

    res.json({ success: true, data: { message: 'Notification cleared' } });
  } catch (err) {
    next(err);
  }
});

router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({ scope: z.enum(['all', 'read']).default('read') }).parse(req.body ?? {});

    const result = await prisma.notification.deleteMany({
      where: {
        userId: req.user!.sub,
        ...(body.scope === 'read' ? { isRead: true } : {}),
      },
    });

    res.json({ success: true, data: { message: 'Notifications cleared', count: result.count } });
  } catch (err) {
    next(err);
  }
});

export default router;
