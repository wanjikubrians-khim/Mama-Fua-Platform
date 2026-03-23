// Mama Fua — Unit Tests: Auth Service
// KhimTech | QA: Maryann Wanjiru | 2026

jest.mock('@mama-fua/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../lib/redis', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
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

jest.mock('../../services/sms.service', () => ({
  sendOtpSms: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../lib/jwt', () => ({
  signAccessToken: jest.fn().mockReturnValue('mock.access.token'),
  signRefreshToken: jest.fn().mockReturnValue('mock.refresh.token'),
  verifyRefreshToken: jest.fn(),
}));

import bcrypt from 'bcryptjs';
import { prisma } from '@mama-fua/database';
import { redis } from '../../lib/redis';
import * as AuthService from '../../services/auth.service';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRedis = redis as jest.Mocked<typeof redis>;

describe('AuthService.requestOtp', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends OTP and caches hash in Redis', async () => {
    (mockRedis.get as jest.Mock).mockResolvedValue(null); // not locked
    (mockRedis.setex as jest.Mock).mockResolvedValue('OK');
    (mockRedis.del as jest.Mock).mockResolvedValue(1);

    const result = await AuthService.requestOtp('+254712345678');

    expect(result.expiresIn).toBe(600);
    expect(mockRedis.setex).toHaveBeenCalledWith(
      'otp:+254712345678',
      600,
      expect.any(String) // the bcrypt hash
    );
  });

  it('normalises phone before storing OTP', async () => {
    (mockRedis.get as jest.Mock).mockResolvedValue(null);
    (mockRedis.setex as jest.Mock).mockResolvedValue('OK');
    (mockRedis.del as jest.Mock).mockResolvedValue(1);

    await AuthService.requestOtp('0712345678'); // 07xx format

    expect(mockRedis.setex).toHaveBeenCalledWith(
      'otp:+254712345678', // should be normalised
      600,
      expect.any(String)
    );
  });

  it('throws if account is locked', async () => {
    (mockRedis.get as jest.Mock).mockResolvedValue('1'); // locked

    await expect(AuthService.requestOtp('+254712345678')).rejects.toThrow(
      'Account temporarily locked'
    );
    expect(mockRedis.setex).not.toHaveBeenCalled();
  });
});

describe('AuthService.verifyOtp', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns isNewUser: true if account does not exist', async () => {
    const hash = await bcrypt.hash('123456', 8);
    (mockRedis.get as jest.Mock)
      .mockResolvedValueOnce(null) // not locked
      .mockResolvedValueOnce(hash); // OTP hash
    (mockRedis.del as jest.Mock).mockResolvedValue(1);
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await AuthService.verifyOtp('+254712345678', '123456');
    expect(result.isNewUser).toBe(true);
    expect(result.accessToken).toBeUndefined();
  });

  it('returns tokens for existing active user', async () => {
    const hash = await bcrypt.hash('123456', 8);
    (mockRedis.get as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(hash);
    (mockRedis.del as jest.Mock).mockResolvedValue(1);
    (mockRedis.setex as jest.Mock).mockResolvedValue('OK');
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123', phone: '+254712345678', role: 'CLIENT',
      status: 'ACTIVE', firstName: 'Grace', lastName: 'Muthoni', email: null,
    });
    (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

    const result = await AuthService.verifyOtp('+254712345678', '123456');

    expect(result.isNewUser).toBe(false);
    expect(result.accessToken).toBe('mock.access.token');
    expect(result.refreshToken).toBe('mock.refresh.token');
  });

  it('rejects expired OTP (no hash in Redis)', async () => {
    (mockRedis.get as jest.Mock)
      .mockResolvedValueOnce(null)  // not locked
      .mockResolvedValueOnce(null); // OTP expired

    await expect(
      AuthService.verifyOtp('+254712345678', '123456')
    ).rejects.toThrow('OTP has expired');
  });

  it('rejects wrong OTP and increments attempt counter', async () => {
    const hash = await bcrypt.hash('999999', 8); // wrong code
    (mockRedis.get as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(hash);
    (mockRedis.incr as jest.Mock).mockResolvedValue(1); // 1st failed attempt

    await expect(
      AuthService.verifyOtp('+254712345678', '123456')
    ).rejects.toThrow('Invalid OTP');

    expect(mockRedis.incr).toHaveBeenCalledWith('otp:attempts:+254712345678');
  });

  it('locks account after 5 failed attempts', async () => {
    const hash = await bcrypt.hash('999999', 8);
    (mockRedis.get as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(hash);
    (mockRedis.incr as jest.Mock).mockResolvedValue(5); // 5th attempt = lockout
    (mockRedis.setex as jest.Mock).mockResolvedValue('OK');
    (mockRedis.del as jest.Mock).mockResolvedValue(1);

    await expect(
      AuthService.verifyOtp('+254712345678', '123456')
    ).rejects.toThrow('Too many attempts');

    // Should lock the account
    expect(mockRedis.setex).toHaveBeenCalledWith('otp:lock:+254712345678', 900, '1');
  });

  it('throws for SUSPENDED user', async () => {
    const hash = await bcrypt.hash('123456', 8);
    (mockRedis.get as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(hash);
    (mockRedis.del as jest.Mock).mockResolvedValue(1);
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123', phone: '+254712345678', role: 'CLIENT',
      status: 'SUSPENDED', firstName: 'Grace', lastName: 'Muthoni', email: null,
    });

    await expect(
      AuthService.verifyOtp('+254712345678', '123456')
    ).rejects.toThrow('Account suspended');
  });

  it('throws for BANNED user', async () => {
    const hash = await bcrypt.hash('123456', 8);
    (mockRedis.get as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(hash);
    (mockRedis.del as jest.Mock).mockResolvedValue(1);
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123', phone: '+254712345678', status: 'BANNED',
    });

    await expect(
      AuthService.verifyOtp('+254712345678', '123456')
    ).rejects.toThrow('Account banned');
  });
});

describe('AuthService.refreshTokens', () => {
  beforeEach(() => jest.clearAllMocks());

  it('issues new token pair on valid refresh token', async () => {
    (verifyRefreshToken as jest.Mock).mockReturnValue({ sub: 'user-123' });
    (mockRedis.get as jest.Mock).mockResolvedValue('user-123'); // token in Redis
    (mockRedis.del as jest.Mock).mockResolvedValue(1);
    (mockRedis.setex as jest.Mock).mockResolvedValue('OK');
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123', role: 'CLIENT', phone: '+254712345678', status: 'ACTIVE',
    });

    const result = await AuthService.refreshTokens('valid.refresh.token');

    expect(result.accessToken).toBe('mock.access.token');
    expect(result.refreshToken).toBe('mock.refresh.token');
    // Old token should be deleted
    expect(mockRedis.del).toHaveBeenCalledWith('refresh:valid.refresh.token');
  });

  it('rejects revoked refresh token (not in Redis)', async () => {
    (verifyRefreshToken as jest.Mock).mockReturnValue({ sub: 'user-123' });
    (mockRedis.get as jest.Mock).mockResolvedValue(null); // revoked

    await expect(AuthService.refreshTokens('revoked.token')).rejects.toThrow(
      'Refresh token revoked'
    );
  });

  it('rejects invalid refresh token signature', async () => {
    (verifyRefreshToken as jest.Mock).mockImplementation(() => {
      throw new Error('invalid signature');
    });

    await expect(AuthService.refreshTokens('invalid.token')).rejects.toThrow(
      'Invalid or expired refresh token'
    );
  });
});

describe('AuthService.logout', () => {
  it('deletes refresh token and session from Redis', async () => {
    (mockRedis.del as jest.Mock).mockResolvedValue(1);

    await AuthService.logout('user-123', 'some.refresh.token');

    expect(mockRedis.del).toHaveBeenCalledWith('refresh:some.refresh.token');
    expect(mockRedis.del).toHaveBeenCalledWith('session:user-123');
  });
});
