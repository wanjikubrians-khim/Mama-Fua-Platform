// Mama Fua — Express App
// KhimTech | 2026

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { RATE_LIMIT } from '@mama-fua/shared';

import { logger } from './lib/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestId } from './middleware/requestId';

// ── Route imports ──────────────────────────────────────────────────────────
import authRouter from './routes/auth.routes';
import usersRouter from './routes/users.routes';
import cleanersRouter from './routes/cleaners.routes';
import bookingsRouter from './routes/bookings.routes';
import paymentsRouter from './routes/payments.routes';
import locationRouter from './routes/location.routes';
import reviewsRouter from './routes/reviews.routes';
import notificationsRouter from './routes/notifications.routes';
import adminRouter from './routes/admin.routes';
import webhooksRouter from './routes/webhooks.routes';
import servicesRouter from './routes/services.routes';

const app = express();

// ── Security middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: (process.env.ALLOWED_ORIGINS?.split(',') ?? []).map((o) => o.trim()).filter(Boolean),
    credentials: true,
  })
);

// ── Parsing ───────────────────────────────────────────────────────────────
// Webhooks need raw body — mount BEFORE express.json()
app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// ── Logging & request ID ──────────────────────────────────────────────────
app.use(requestId);
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip: (req) => req.path === '/health',
  })
);

// ── Global rate limit ─────────────────────────────────────────────────────
app.use(
  '/api/',
  rateLimit({
    windowMs: 60 * 1000,
    max: RATE_LIMIT.GLOBAL_PER_MIN,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
  })
);

// ── Health check ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'mama-fua-api',
    version: process.env.npm_package_version ?? '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────
const v1 = '/api/v1';
app.use(`${v1}/auth`, authRouter);
app.use(`${v1}/users`, usersRouter);
app.use(`${v1}/cleaners`, cleanersRouter);
app.use(`${v1}/bookings`, bookingsRouter);
app.use(`${v1}/payments`, paymentsRouter);
app.use(`${v1}/location`, locationRouter);
app.use(`${v1}/reviews`, reviewsRouter);
app.use(`${v1}/notifications`, notificationsRouter);
app.use(`${v1}/admin`, adminRouter);
app.use(`${v1}/webhooks`, webhooksRouter);
app.use(`${v1}/services`, servicesRouter);

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// ── Global error handler ──────────────────────────────────────────────────
app.use(errorHandler);

export default app;
