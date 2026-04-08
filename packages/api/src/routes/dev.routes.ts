// Mama Fua - Development Routes
// KhimTech | 2026

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '@mama-fua/database';
import { ERROR_CODES, normalisePhone } from '@mama-fua/shared';
import { signAccessToken, signRefreshToken } from '../lib/jwt';
import { logger } from '../lib/logger';
import { redis, RedisKeys, TTL } from '../lib/redis';

const router = Router();

const devLoginSchema = z.object({
  phone: z.string().min(10),
});

// Development-only login bypass
router.post('/dev-login', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Not found' },
    });
  }

  const parsed = devLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'A valid phone number is required' },
    });
  }

  try {
    const normalisedPhone = normalisePhone(parsed.data.phone);
    const user = await prisma.user.findUnique({ where: { phone: normalisedPhone } });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_SUSPENDED', message: 'Account suspended' },
      });
    }

    if (user.status === 'BANNED') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Account banned' },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = signAccessToken({ sub: user.id, role: user.role, phone: user.phone });
    const refreshToken = signRefreshToken(user.id);

    await redis.setex(RedisKeys.refreshToken(refreshToken), TTL.REFRESH_TOKEN, user.id);

    logger.info(`[DEV] Login bypass for ${normalisedPhone}`);

    return res.json({
      success: true,
      data: {
        isNewUser: false,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          phone: user.phone,
          email: user.email,
        },
      },
    });
  } catch (error) {
    logger.error('[DEV] Login bypass error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  }
});

export default router;
