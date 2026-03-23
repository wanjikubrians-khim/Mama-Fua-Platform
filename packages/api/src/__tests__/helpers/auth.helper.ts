// Mama Fua — Test Auth Helper
// KhimTech | QA: Maryann Wanjiru | 2026

import jwt from 'jsonwebtoken';

// Use symmetric HS256 for tests (simpler than RSA setup)
const TEST_SECRET = 'mama-fua-test-secret-khimtech-2026';

export function signTestToken(payload: {
  sub: string;
  role: string;
  phone: string;
}): string {
  return jwt.sign(payload, TEST_SECRET, { expiresIn: '1h', algorithm: 'HS256' });
}

export function makeAuthHeader(userId: string, role = 'CLIENT', phone = '+254712345678') {
  const token = signTestToken({ sub: userId, role, phone });
  return { Authorization: `Bearer ${token}` };
}

// Mock verifyAccessToken for tests — patch jwt lib to use HS256
export function mockVerifyToken() {
  jest.mock('jsonwebtoken', () => ({
    ...jest.requireActual('jsonwebtoken'),
    verify: (token: string) => jwt.verify(token, TEST_SECRET),
    sign: jest.requireActual('jsonwebtoken').sign,
  }));
}
