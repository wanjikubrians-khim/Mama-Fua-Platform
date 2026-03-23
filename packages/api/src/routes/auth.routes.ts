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
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many OTP requests. Try again in 1 hour.' } },
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: RATE_LIMIT.AUTH_PER_MIN,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many auth requests.' } },
});

// POST /auth/request-otp
router.post('/request-otp', otpLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = z.object({ phone: z.string().min(10) }).parse(req.body);
    const result = await AuthService.requestOtp(phone);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// POST /auth/verify-otp
router.post('/verify-otp', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({
      phone: z.string().min(10),
      otp: z.string().length(6),
    }).parse(req.body);
    const result = await AuthService.verifyOtp(body.phone, body.otp);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// POST /auth/register
router.post('/register', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({
      phone: z.string().min(10),
      otp: z.string().length(6),
      firstName: z.string().min(1).max(100),
      lastName: z.string().min(1).max(100),
      email: z.string().email().optional(),
      role: z.enum(['CLIENT', 'CLEANER']).default('CLIENT'),
      preferredLang: z.enum(['en', 'sw']).default('en'),
    }).parse(req.body);
    const result = await AuthService.register(body);
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
