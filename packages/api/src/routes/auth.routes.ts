// Mama Fua — Auth Routes
// KhimTech | 2026

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { RATE_LIMIT } from '@mama-fua/shared';
import { authenticate } from '../middleware/auth';
import * as AuthService from '../services/auth.service';

const router = Router();

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: RATE_LIMIT.OTP_PER_HOUR,
  skip: () => process.env.NODE_ENV === 'development',
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many OTP requests. Try again in 1 hour.' },
  },
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: RATE_LIMIT.AUTH_PER_MIN,
  skip: () => process.env.NODE_ENV === 'development',
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many auth requests.' } },
});

// POST /auth/request-otp
router.post('/request-otp', otpLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = z.object({ phone: z.string().min(10) }).parse(req.body);

    // Development bypass - always succeed in development mode
    if (process.env.NODE_ENV === 'development') {
      return res.json({ success: true, data: { expiresIn: 600 } });
    }

    const result = await AuthService.requestOtp(phone);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /auth/debug
router.get('/debug', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    isDevelopment: process.env.NODE_ENV === 'development',
  });
});

// POST /auth/verify-otp
router.post('/verify-otp', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z
      .object({
        phone: z.string().min(10),
        otp: z.string().length(6),
      })
      .parse(req.body);

    // Development bypass - skip rate limiter
    if (process.env.NODE_ENV === 'development' && body.otp === '123456') {
      const { prisma } = await import('@mama-fua/database');
      const { normalisePhone } = await import('@mama-fua/shared');
      const { signAccessToken, signRefreshToken } = await import('../lib/jwt');

      const phone = normalisePhone(body.phone);
      const user = await prisma.user.findUnique({ where: { phone } });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        });
      }

      if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
        return res.status(403).json({
          success: false,
          error: { code: 'ACCOUNT_SUSPENDED', message: 'Account suspended' },
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const accessToken = signAccessToken({ sub: user.id, role: user.role, phone: user.phone });
      const refreshToken = signRefreshToken(user.id);

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
    }
    const result = await AuthService.verifyOtp(body.phone, body.otp);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// POST /auth/register
router.post('/register', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z
      .object({
        phone: z.string().min(10),
        otp: z.string().length(6),
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        email: z.string().email().optional(),
        role: z.enum(['CLIENT', 'CLEANER']).default('CLIENT'),
        preferredLang: z.enum(['en', 'sw']).default('en'),
      })
      .parse(req.body);
    const result = await AuthService.register({
      phone: body.phone,
      otp: body.otp,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role,
      preferredLang: body.preferredLang,
      ...(body.email ? { email: body.email } : {}),
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
    const result = await AuthService.refreshTokens(refreshToken);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout
router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
    await AuthService.logout(req.user!.sub, refreshToken);
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (err) {
    next(err);
  }
});

export default router;
