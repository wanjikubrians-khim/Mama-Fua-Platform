// Mama Fua — Auth Service
// KhimTech | 2026

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@mama-fua/database';
import { normalisePhone, OTP, ERROR_CODES, TokenPair } from '@mama-fua/shared';
import { redis, RedisKeys, TTL } from '../lib/redis';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { AppError } from '../middleware/errorHandler';
import { sendOtpSms } from './sms.service';
import { logger } from '../lib/logger';

// ── OTP ───────────────────────────────────────────────────────────────────

export async function requestOtp(rawPhone: string): Promise<{ expiresIn: number }> {
  const phone = normalisePhone(rawPhone);

  // Check lockout
  const locked = await redis.get(RedisKeys.otpLock(phone));
  if (locked) {
    throw new AppError(ERROR_CODES.OTP_MAX_ATTEMPTS, 'Account temporarily locked. Try again later.', 429);
  }

  // Generate OTP
  const otp = process.env.NODE_ENV === 'development'
    ? OTP.DEV_CODE
    : String(crypto.randomInt(100000, 999999));

  const codeHash = await bcrypt.hash(otp, 8);

  // Store in Redis
  await redis.setex(RedisKeys.otp(phone), TTL.OTP, codeHash);
  await redis.del(RedisKeys.otpAttempts(phone));

  // Send SMS (non-blocking in production)
  if (process.env.NODE_ENV !== 'development') {
    sendOtpSms(phone, otp).catch((err) => logger.error('OTP SMS failed:', err));
  } else {
    logger.info(`[DEV] OTP for ${phone}: ${otp}`);
  }

  return { expiresIn: TTL.OTP };
}

export async function verifyOtp(
  rawPhone: string,
  code: string
): Promise<{ isNewUser: boolean } & Partial<TokenPair & { user: object }>> {
  const phone = normalisePhone(rawPhone);

  logger.info(`[DEBUG] NODE_ENV: ${process.env.NODE_ENV}, OTP: ${code}`);
  
  // Development bypass - accept any 6-digit code or the dev code
  if (process.env.NODE_ENV === 'development') {
    if (code === '123456' || code === OTP.DEV_CODE) {
      logger.info(`[DEV] Bypassing OTP verification for ${phone}`);
      // Clean up any existing OTP data
      await redis.del(RedisKeys.otp(phone));
      await redis.del(RedisKeys.otpAttempts(phone));
      await redis.del(RedisKeys.otpLock(phone));
    } else {
      throw new AppError(ERROR_CODES.OTP_INVALID, 'Invalid OTP. Use 123456 in development mode.', 400);
    }
  } else {
    const locked = await redis.get(RedisKeys.otpLock(phone));
    if (locked) throw new AppError(ERROR_CODES.OTP_MAX_ATTEMPTS, 'Account locked. Try again later.', 429);

    const codeHash = await redis.get(RedisKeys.otp(phone));
    if (!codeHash) throw new AppError(ERROR_CODES.OTP_EXPIRED, 'OTP has expired', 400);

    const valid = await bcrypt.compare(code, codeHash);
    if (!valid) {
    const attempts = await redis.incr(RedisKeys.otpAttempts(phone));
    if (attempts >= OTP.MAX_ATTEMPTS) {
      await redis.setex(RedisKeys.otpLock(phone), TTL.OTP_LOCK, '1');
      await redis.del(RedisKeys.otp(phone));
      throw new AppError(ERROR_CODES.OTP_MAX_ATTEMPTS, 'Too many attempts. Account locked for 15 minutes.', 429);
    }
    throw new AppError(ERROR_CODES.OTP_INVALID, `Invalid OTP. ${OTP.MAX_ATTEMPTS - attempts} attempts remaining.`, 400);
  }

    await redis.del(RedisKeys.otp(phone));
    await redis.del(RedisKeys.otpAttempts(phone));
  }

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (!existing) return { isNewUser: true };

  if (existing.status === 'SUSPENDED') throw new AppError(ERROR_CODES.ACCOUNT_SUSPENDED, 'Account suspended', 403);
  if (existing.status === 'BANNED') throw new AppError(ERROR_CODES.FORBIDDEN, 'Account banned', 403);

  // Update last login
  await prisma.user.update({ where: { id: existing.id }, data: { lastLoginAt: new Date() } });

  const tokens = await issueTokens(existing.id, existing.role, existing.phone);
  return { isNewUser: false, ...tokens, user: sanitiseUser(existing) };
}

export async function register(input: {
  phone: string;
  otp: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: 'CLIENT' | 'CLEANER';
  preferredLang: 'en' | 'sw';
}): Promise<TokenPair & { user: object }> {
  const phone = normalisePhone(input.phone);

  // Verify OTP first
  const result = await verifyOtp(phone, input.otp);
  if (!result.isNewUser) throw new AppError(ERROR_CODES.CONFLICT, 'Account already exists. Please log in.', 409);

  // Check email uniqueness
  if (input.email) {
    const emailExists = await prisma.user.findUnique({ where: { email: input.email } });
    if (emailExists) throw new AppError(ERROR_CODES.CONFLICT, 'Email already in use', 409);
  }

  const user = await prisma.user.create({
    data: {
      phone,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      preferredLang: input.preferredLang,
      lastLoginAt: new Date(),
      ...(input.role === 'CLIENT' && { clientProfile: { create: {} } }),
      ...(input.role === 'CLEANER' && { cleanerProfile: { create: {} } }),
    },
  });

  const tokens = await issueTokens(user.id, user.role, user.phone);
  return { ...tokens, user: sanitiseUser(user) };
}

export async function refreshTokens(token: string): Promise<TokenPair> {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError(ERROR_CODES.UNAUTHORISED, 'Invalid or expired refresh token', 401);
  }

  // Check token is not blacklisted
  const stored = await redis.get(RedisKeys.refreshToken(token));
  if (!stored) throw new AppError(ERROR_CODES.UNAUTHORISED, 'Refresh token revoked', 401);

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.status !== 'ACTIVE') throw new AppError(ERROR_CODES.UNAUTHORISED, 'User not found or inactive', 401);

  // Rotate — invalidate old, issue new
  await redis.del(RedisKeys.refreshToken(token));
  return issueTokens(user.id, user.role, user.phone);
}

export async function logout(userId: string, refreshToken: string): Promise<void> {
  await redis.del(RedisKeys.refreshToken(refreshToken));
  await redis.del(RedisKeys.session(userId));
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function issueTokens(userId: string, role: string, phone: string): Promise<TokenPair> {
  const accessToken = signAccessToken({ sub: userId, role, phone });
  const refreshToken = signRefreshToken(userId);
  await redis.setex(RedisKeys.refreshToken(refreshToken), TTL.REFRESH_TOKEN, userId);
  return { accessToken, refreshToken };
}

function sanitiseUser(user: { id: string; firstName: string; lastName: string; role: string; phone: string; email: string | null }) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    phone: user.phone,
    email: user.email,
  };
}
