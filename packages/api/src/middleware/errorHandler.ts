// Mama Fua — Error Handling
// KhimTech | 2026

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';
import { ErrorCode, ERROR_CODES } from '@mama-fua/shared';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public override readonly message: string,
    public readonly statusCode: number = 400,
    public readonly fields?: Record<string, string>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = res.locals['requestId'] as string | undefined;

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        requestId,
        ...(err.fields && { fields: err.fields }),
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    err.errors.forEach((e) => {
      const key = e.path.join('.');
      fields[key] = e.message;
    });
    res.status(422).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        requestId,
        fields,
      },
    });
    return;
  }

  logger.error('Unhandled error:', { err, path: req.path, requestId });

  res.status(500).json({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
      requestId,
    },
  });
};
