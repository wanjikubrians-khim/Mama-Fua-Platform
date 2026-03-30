import { Router, Request, Response, NextFunction } from 'express';
import { compare, hash } from 'bcryptjs';
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

const addressInputSchema = z.object({
  label: z.string().min(1).max(100),
  addressLine1: z.string().min(5).max(255),
  addressLine2: z.string().max(255).optional(),
  area: z.string().min(2).max(120),
  city: z.string().min(2).max(120).default('Nairobi'),
  county: z.string().max(120).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  instructions: z.string().max(500).optional(),
  isDefault: z.boolean().default(false),
});

const addressUpdateSchema = addressInputSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Provide at least one field to update'
);

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  nairobi: { lat: -1.286389, lng: 36.817223 },
  mombasa: { lat: -4.043477, lng: 39.668206 },
  kisumu: { lat: -0.091702, lng: 34.767956 },
  nakuru: { lat: -0.303099, lng: 36.080025 },
  eldoret: { lat: 0.514277, lng: 35.269779 },
};

function resolveAddressCoordinates(city: string, lat?: number, lng?: number) {
  if (lat !== undefined && lng !== undefined) {
    return { lat, lng };
  }

  const fallback = CITY_COORDINATES[city.trim().toLowerCase()] ?? {
    lat: -1.286389,
    lng: 36.817223,
  };
  return { lat: lat ?? fallback.lat, lng: lng ?? fallback.lng };
}

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
    const { firstName, lastName, email, phone, preferredLang } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.sub },
      data: { firstName, lastName, email, phone, preferredLang },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

router.patch('/me/password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = passwordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'User not found', 404);
    }

    if (user.passwordHash) {
      const matches = await compare(body.currentPassword, user.passwordHash);
      if (!matches) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Current password is incorrect', 400);
      }
    }

    const nextHash = await hash(body.newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: nextHash },
    });

    res.json({ success: true, data: { message: 'Password updated successfully' } });
  } catch (err) {
    next(err);
  }
});

router.get('/me/addresses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.sub },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    res.json({ success: true, data: addresses });
  } catch (err) {
    next(err);
  }
});

router.post('/me/addresses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = addressInputSchema.parse(req.body);
    const addressCount = await prisma.address.count({ where: { userId: req.user!.sub } });
    const isDefault = body.isDefault || addressCount === 0;
    const coords = resolveAddressCoordinates(body.city, body.lat, body.lng);

    const address = await prisma.$transaction(async (tx: typeof prisma) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId: req.user!.sub, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId: req.user!.sub,
          label: body.label,
          addressLine1: body.addressLine1,
          addressLine2: body.addressLine2,
          area: body.area,
          city: body.city,
          county: body.county,
          instructions: body.instructions,
          isDefault,
          lat: coords.lat,
          lng: coords.lng,
        },
      });
    });

    res.status(201).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
});

router.patch('/me/addresses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = addressUpdateSchema.parse(req.body);
    const current = await prisma.address.findFirst({
      where: { id: req.params['id'], userId: req.user!.sub },
    });

    if (!current) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Address not found', 404);
    }

    const nextCity = body.city ?? current.city;
    const coords = resolveAddressCoordinates(nextCity, body.lat ?? current.lat, body.lng ?? current.lng);
    const nextIsDefault = body.isDefault ?? current.isDefault;

    const address = await prisma.$transaction(async (tx: typeof prisma) => {
      if (nextIsDefault) {
        await tx.address.updateMany({
          where: { userId: req.user!.sub, isDefault: true, id: { not: current.id } },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id: current.id },
        data: {
          label: body.label,
          addressLine1: body.addressLine1,
          addressLine2: body.addressLine2,
          area: body.area,
          city: body.city,
          county: body.county,
          instructions: body.instructions,
          isDefault: nextIsDefault,
          lat: coords.lat,
          lng: coords.lng,
        },
      });
    });

    res.json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
});

router.delete('/me/addresses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const current = await prisma.address.findFirst({
      where: { id: req.params['id'], userId: req.user!.sub },
    });

    if (!current) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Address not found', 404);
    }

    await prisma.$transaction(async (tx: typeof prisma) => {
      await tx.address.delete({ where: { id: current.id } });

      if (current.isDefault) {
        const replacement = await tx.address.findFirst({
          where: { userId: req.user!.sub },
          orderBy: { createdAt: 'asc' },
        });

        if (replacement) {
          await tx.address.update({
            where: { id: replacement.id },
            data: { isDefault: true },
          });
        }
      }
    });

    res.json({ success: true, data: { message: 'Address deleted successfully' } });
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
