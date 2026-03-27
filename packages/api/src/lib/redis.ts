// Mama Fua — Redis Client
// KhimTech | 2026

import IORedis from 'ioredis';
import { logger } from './logger';

export const redis = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error:', err));

// ── Key helpers ────────────────────────────────────────────────────────────

export const RedisKeys = {
  session: (userId: string) => `session:${userId}`,
  refreshToken: (token: string) => `refresh:${token}`,
  otp: (phone: string) => `otp:${phone}`,
  otpAttempts: (phone: string) => `otp:attempts:${phone}`,
  otpLock: (phone: string) => `otp:lock:${phone}`,
  cleanersNearby: (lat: number, lng: number, radius: number) =>
    `cleaners:nearby:${lat.toFixed(3)}:${lng.toFixed(3)}:${radius}`,
  cleanerProfile: (id: string) => `cleaner:profile:${id}`,
  bookingLock: (id: string) => `booking:lock:${id}`,
  matchQueue: (bookingId: string) => `match:queue:${bookingId}`,
  cleanerPosition: (cleanerId: string) => `cleaner:pos:${cleanerId}`,
  bookingRoomMember: (bookingId: string, userId: string) => `booking:room:${bookingId}:user:${userId}`,
  rateLimitUser: (userId: string) => `rate:user:${userId}`,
};

export const TTL = {
  SESSION: 24 * 60 * 60,           // 24 hours
  REFRESH_TOKEN: 30 * 24 * 60 * 60,// 30 days
  OTP: 10 * 60,                     // 10 minutes
  OTP_LOCK: 15 * 60,               // 15 minutes
  CLEANER_SEARCH: 60,               // 1 minute
  CLEANER_PROFILE: 10 * 60,        // 10 minutes
  BOOKING_LOCK: 5 * 60,            // 5 minutes
  CLEANER_POSITION: 60,            // 60 seconds
  ROOM_MEMBERSHIP: 2 * 60 * 60,    // 2 hours
};
