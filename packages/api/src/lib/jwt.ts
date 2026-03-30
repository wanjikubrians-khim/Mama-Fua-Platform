// Mama Fua — JWT Utility
// KhimTech | 2026

import jwt from 'jsonwebtoken';
import { JwtPayload } from '@mama-fua/shared';
import { logger } from './logger';

const PRIVATE_KEY = (process.env.JWT_PRIVATE_KEY ?? '').replace(/\\n/g, '\n');
const PUBLIC_KEY = (process.env.JWT_PUBLIC_KEY ?? '').replace(/\\n/g, '\n');
const ACCESS_EXPIRY = parseInt(process.env.JWT_ACCESS_EXPIRY ?? '900');
const REFRESH_EXPIRY = parseInt(process.env.JWT_REFRESH_EXPIRY ?? '2592000');

// Validate JWT keys at startup
if (!PRIVATE_KEY || !PRIVATE_KEY.startsWith('-----BEGIN')) {
  logger.error('[JWT] FATAL: JWT_PRIVATE_KEY is missing or invalid');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_PRIVATE_KEY must be configured in production');
  }
}

if (!PUBLIC_KEY || !PUBLIC_KEY.startsWith('-----BEGIN')) {
  logger.error('[JWT] FATAL: JWT_PUBLIC_KEY is missing or invalid');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_PUBLIC_KEY must be configured in production');
  }
}

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: ACCESS_EXPIRY,
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: REFRESH_EXPIRY,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] }) as JwtPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] }) as { sub: string };
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}
