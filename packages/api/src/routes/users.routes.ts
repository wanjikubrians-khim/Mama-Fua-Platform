import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { prisma } from '@mama-fua/database';
import { AppError } from '../middleware/errorHandler';
import { ERROR_CODES } from '@mama-fua/shared';

const router = Router();

router.use(authenticate);

const deviceTokenSchema = z.object({
  token: z.string().min(20).max(4096),
  platform: z.enum(['ios', 'android', 'web']),
});

const clearNotificationsSchema = z.object({
  scope: z.enum(['all', 'read']).default('read'),
});

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      include: {
        clientProfile: true,
        cleanerProfile: true,
        addresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] },
      },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

router.patch('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, email, preferredLang } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.sub },
      data: { firstName, lastName, email, preferredLang },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

router.post('/me/device-tokens', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = deviceTokenSchema.parse(req.body);

    const token = await prisma.deviceToken.upsert({
      where: { token: body.token },
      update: {
        userId: req.user!.sub,
        platform: body.platform,
      },
      create: {
        userId: req.user!.sub,
        token: body.token,
        platform: body.platform,
      },
    });

    res.status(201).json({ success: true, data: token });
  } catch (err) {
    next(err);
  }
});

router.delete('/me/device-tokens', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({ token: z.string().min(20).max(4096) }).parse(req.body);

    const deleted = await prisma.deviceToken.deleteMany({
      where: {
        userId: req.user!.sub,
        token: body.token,
      },
    });

    if (deleted.count === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Device token not found', 404);
    }

    res.json({ success: true, data: { message: 'Device token removed' } });
  } catch (err) {
    next(err);
  }
});

router.get('/me/notifications', async (req: Request, res: Response, next: NextFunction) => {
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

router.patch('/me/notifications/read-all', async (req: Request, res: Response, next: NextFunction) => {
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

router.patch(
  '/me/notifications/:id/read',
  async (req: Request, res: Response, next: NextFunction) => {
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
  }
);

router.delete('/me/notifications/:id', async (req: Request, res: Response, next: NextFunction) => {
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

router.delete('/me/notifications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = clearNotificationsSchema.parse(req.body ?? {});

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
