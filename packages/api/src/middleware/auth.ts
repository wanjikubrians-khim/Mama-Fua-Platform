// Mama Fua — Auth Middleware
// KhimTech | 2026

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@mama-fua/database';
import { JwtPayload, ERROR_CODES } from '@mama-fua/shared';
import { verifyAccessToken } from '../lib/jwt';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(ERROR_CODES.UNAUTHORISED, 'Missing or invalid token', 401));
  }

  const token = authHeader.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new AppError(ERROR_CODES.UNAUTHORISED, 'Token expired or invalid', 401));
  }
};

export const requireRole = (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(ERROR_CODES.UNAUTHORISED, 'Not authenticated', 401));
    }
    if (!roles.includes(req.user.role as UserRole)) {
      return next(new AppError(ERROR_CODES.FORBIDDEN, 'Insufficient permissions', 403));
    }
    next();
  };

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(authHeader.slice(7));
    } catch {
      // silently ignore — optional
    }
  }
  next();
};
