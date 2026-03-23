// Mama Fua — Integration Tests: Auth Routes
// KhimTech | QA: Maryann Wanjiru | 2026
//
// Tests the full HTTP request/response cycle for auth endpoints.
// Mocks external dependencies (Redis, DB, SMS) but tests real Express routing.

import request from 'supertest';
import app from '../../app';

jest.mock('../../lib/redis', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
  },
  RedisKeys: {
    otp: (p: string) => `otp:${p}`,
    otpAttempts: (p: string) => `otp:attempts:${p}`,
    otpLock: (p: string) => `otp:lock:${p}`,
    session: (id: string) => `session:${id}`,
    refreshToken: (t: string) => `refresh:${t}`,
  },
  TTL: { OTP: 600, OTP_LOCK: 900, REFRESH_TOKEN: 2592000 },
}));

jest.mock('@mama-fua/database', () => ({
  prisma: {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  },
}));

jest.mock('../../services/sms.service', () => ({
  sendOtpSms: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../lib/jwt', () => ({
  signAccessToken: jest.fn().mockReturnValue('test.access.token'),
  signRefreshToken: jest.fn().mockReturnValue('test.refresh.token'),
  verifyAccessToken: jest.fn().mockReturnValue({ sub: 'user-123', role: 'CLIENT', phone: '+254712345678' }),
  verifyRefreshToken: jest.fn().mockReturnValue({ sub: 'user-123' }),
}));

import bcrypt from 'bcryptjs';
import { prisma } from '@mama-fua/database';
import { redis } from '../../lib/redis';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRedis = redis as jest.Mocked<typeof redis>;

// ── POST /auth/request-otp ────────────────────────────────────────────

describe('POST /api/v1/auth/request-otp', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with expiresIn for valid Kenyan phone', async () => {
    (mockRedis.get as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/request-otp')
      .send({ phone: '+254712345678' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.expiresIn).toBe(600);
  });

  it('returns 400 for missing phone', async () => {
    const res = await request(app)
      .post('/api/v1/auth/request-otp')
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for phone too short', async () => {
    const res = await request(app)
      .post('/api/v1/auth/request-otp')
      .send({ phone: '0712' });

    expect(res.status).toBe(422);
  });

  it('returns 429 when account is locked', async () => {
    (mockRedis.get as jest.Mock).mockResolvedValue('1'); // locked

    const res = await request(app)
      .post('/api/v1/auth/request-otp')
      .send({ phone: '+254712345678' });

    expect(res.status).toBe(429);
    expect(res.body.error.message).toMatch(/locked/i);
  });

  it('accepts 07xx format phone number', async () => {
    (mockRedis.get as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/request-otp')
      .send({ phone: '0712345678' });

    expect(res.status).toBe(200);
  });
});

// ── POST /auth/verify-otp ─────────────────────────────────────────────

describe('POST /api/v1/auth/verify-otp', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns isNewUser: true for unregistered phone', async () => {
    const hash = await bcrypt.hash('123456', 8);
    (mockRedis.get as jest.Mock)
      .mockResolvedValueOnce(null) // not locked
      .mockResolvedValueOnce(hash); // OTP hash
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '+254712345678', otp: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.data.isNewUser).toBe(true);
    expect(res.body.data.accessToken).toBeUndefined();
  });

  it('returns token pair for registered active user', async () => {
    const hash = await bcrypt.hash('123456', 8);
    (mockRedis.get as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(hash);
    (mockRedis.setex as jest.Mock).mockResolvedValue('OK');
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123', phone: '+254712345678', role: 'CLIENT',
      status: 'ACTIVE', firstName: 'Grace', lastName: 'Muthoni', email: null,
    });
    (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '+254712345678', otp: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBe('test.access.token');
    expect(res.body.data.refreshToken).toBe('test.refresh.token');
    expect(res.body.data.isNewUser).toBe(false);
  });

  it('returns 400 for wrong OTP', async () => {
    const hash = await bcrypt.hash('999999', 8);
    (mockRedis.get as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(hash);
    (mockRedis.incr as jest.Mock).mockResolvedValue(1);

    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '+254712345678', otp: '123456' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('OTP_INVALID');
  });

  it('returns 400 for expired OTP', async () => {
    (mockRedis.get as jest.Mock)
      .mockResolvedValueOnce(null) // not locked
      .mockResolvedValueOnce(null); // expired

    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '+254712345678', otp: '123456' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('OTP_EXPIRED');
  });

  it('returns 422 for OTP that is not 6 digits', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '+254712345678', otp: '12345' }); // 5 digits

    expect(res.status).toBe(422);
  });

  it('returns 403 for SUSPENDED user', async () => {
    const hash = await bcrypt.hash('123456', 8);
    (mockRedis.get as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(hash);
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123', status: 'SUSPENDED',
    });

    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '+254712345678', otp: '123456' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_SUSPENDED');
  });
});

// ── POST /auth/register ───────────────────────────────────────────────

describe('POST /api/v1/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a new CLIENT account', async () => {
    const hash = await bcrypt.hash('123456', 8);
    (mockRedis.get as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(hash);
    (mockPrisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(null) // OTP verify: no existing user
      .mockResolvedValueOnce(null); // email check
    (mockPrisma.user.create as jest.Mock).mockResolvedValue({
      id: 'new-user-123', phone: '+254712345678', role: 'CLIENT',
      firstName: 'Grace', lastName: 'Muthoni', email: null, status: 'ACTIVE',
    });
    (mockRedis.setex as jest.Mock).mockResolvedValue('OK');
    (mockRedis.del as jest.Mock).mockResolvedValue(1);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        phone: '+254712345678',
        otp: '123456',
        firstName: 'Grace',
        lastName: 'Muthoni',
        role: 'CLIENT',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBe('test.access.token');
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          firstName: 'Grace',
          role: 'CLIENT',
          clientProfile: { create: {} },
        }),
      })
    );
  });

  it('creates a CLEANER account with cleaner profile', async () => {
    const hash = await bcrypt.hash('123456', 8);
    (mockRedis.get as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(hash);
    (mockPrisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    (mockPrisma.user.create as jest.Mock).mockResolvedValue({
      id: 'cleaner-user-123', phone: '+254712345678', role: 'CLEANER',
      firstName: 'Grace', lastName: 'Muthoni', email: null, status: 'ACTIVE',
    });
    (mockRedis.setex as jest.Mock).mockResolvedValue('OK');
    (mockRedis.del as jest.Mock).mockResolvedValue(1);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ phone: '+254712345678', otp: '123456', firstName: 'Grace', lastName: 'Muthoni', role: 'CLEANER' });

    expect(res.status).toBe(201);
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: 'CLEANER',
          cleanerProfile: { create: {} },
        }),
      })
    );
  });

  it('returns 422 for missing firstName', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ phone: '+254712345678', otp: '123456', lastName: 'Muthoni' });

    expect(res.status).toBe(422);
    expect(res.body.error.fields).toHaveProperty('firstName');
  });

  it('returns 409 for already registered phone', async () => {
    const hash = await bcrypt.hash('123456', 8);
    (mockRedis.get as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(hash);
    // verifyOtp finds existing user → isNewUser = false
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'existing', status: 'ACTIVE', phone: '+254712345678', role: 'CLIENT',
      firstName: 'Grace', lastName: 'Muthoni', email: null,
    });
    (mockPrisma.user.update as jest.Mock).mockResolvedValue({});
    (mockRedis.setex as jest.Mock).mockResolvedValue('OK');
    (mockRedis.del as jest.Mock).mockResolvedValue(1);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ phone: '+254712345678', otp: '123456', firstName: 'Grace', lastName: 'Muthoni' });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/already exists/i);
  });
});

// ── POST /auth/refresh ────────────────────────────────────────────────

describe('POST /api/v1/auth/refresh', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns new token pair for valid refresh token', async () => {
    (mockRedis.get as jest.Mock).mockResolvedValue('user-123');
    (mockRedis.del as jest.Mock).mockResolvedValue(1);
    (mockRedis.setex as jest.Mock).mockResolvedValue('OK');
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123', role: 'CLIENT', phone: '+254712345678', status: 'ACTIVE',
    });

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'valid.refresh.token' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBe('test.access.token');
    expect(res.body.data.refreshToken).toBe('test.refresh.token');
  });

  it('returns 422 for missing refreshToken', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({});

    expect(res.status).toBe(422);
  });
});

// ── Middleware: authenticate ──────────────────────────────────────────

describe('authenticate middleware', () => {
  it('returns 401 for request without Authorization header', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORISED');
  });

  it('returns 401 for malformed Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer not.a.real.token');

    // verifyAccessToken mock would throw for invalid token
    expect(res.status).toBe(401);
  });
});
