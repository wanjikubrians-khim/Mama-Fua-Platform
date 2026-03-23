import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const requestId = (_req: Request, res: Response, next: NextFunction): void => {
  const id = `req_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  res.locals['requestId'] = id;
  res.setHeader('X-Request-Id', id);
  next();
};
