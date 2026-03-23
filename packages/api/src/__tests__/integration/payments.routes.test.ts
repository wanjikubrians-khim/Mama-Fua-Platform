// Mama Fua — Integration Tests: Payment Routes
// KhimTech | QA: Maryann Wanjiru | 2026

import request from 'supertest';
import app from '../../app';

jest.mock('../../lib/jwt', () => ({
  verifyAccessToken: jest.fn(),
  signAccessToken: jest.fn().mockReturnValue('test.access.token'),
  signRefreshToken: jest.fn().mockReturnValue('test.refresh.token'),
}));

jest.mock('@mama-fua/database', () => ({
  prisma: {
    booking: { findUnique: jest.fn() },
    payment: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    clientProfile: { findUnique: jest.fn(), update: jest.fn() },
    cleanerProfile: { findUnique: jest.fn(), update: jest.fn() },
    payout: { findUnique: jest.fn(), create: jest.fn(), count: jest.fn().mockResolvedValue(0) },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../services/mpesa/mpesa.service', () => ({
  initiateBookingPayment: jest.fn(),
  initiateCleanerPayout: jest.fn().mockResolvedValue(undefined),
}));

import { verifyAccessToken } from '../../lib/jwt';
import { prisma } from '@mama-fua/database';
import { initiateBookingPayment } from '../../services/mpesa/mpesa.service';

const mockVerify = verifyAccessToken as jest.Mock;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockInitiatePayment = initiateBookingPayment as jest.Mock;

const authHeader = { Authorization: 'Bearer test.token' };

function asClient(id = 'client-123') {
  mockVerify.mockReturnValue({ sub: id, role: 'CLIENT', phone: '+254712345678' });
}
function asCleaner(id = 'cleaner-123') {
  mockVerify.mockReturnValue({ sub: id, role: 'CLEANER', phone: '+254712345679' });
}

const baseBooking = {
  id: 'booking-123',
  bookingRef: 'MF-2026-00001',
  clientId: 'client-123',
  cleanerId: 'cleaner-123',
  status: 'ACCEPTED',
  totalAmount: 120000,
  platformFee: 18000,
  cleanerEarnings: 102000,
};

// ── POST /payments/mpesa/initiate ─────────────────────────────────────

describe('POST /api/v1/payments/mpesa/initiate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('initiates STK Push for valid booking and phone', async () => {
    asClient();
    mockInitiatePayment.mockResolvedValue({
      paymentId: 'payment-123',
      checkoutRequestId: 'ws_CO_test_123',
      message: 'Success. Request accepted for processing',
    });

    const res = await request(app)
      .post('/api/v1/payments/mpesa/initiate')
      .set(authHeader)
      .send({ bookingId: 'booking-123', phone: '+254712345678' });

    expect(res.status).toBe(200);
    expect(res.body.data.checkoutRequestId).toBe('ws_CO_test_123');
    expect(res.body.data.instruction).toContain('M-Pesa PIN');
  });

  it('normalises 07xx phone before passing to service', async () => {
    asClient();
    mockInitiatePayment.mockResolvedValue({
      paymentId: 'p123', checkoutRequestId: 'ws_123', message: 'OK',
    });

    await request(app)
      .post('/api/v1/payments/mpesa/initiate')
      .set(authHeader)
      .send({ bookingId: 'booking-123', phone: '0712345678' });

    expect(mockInitiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '+254712345678' })
    );
  });

  it('returns 403 when CLEANER tries to initiate payment', async () => {
    asCleaner();

    const res = await request(app)
      .post('/api/v1/payments/mpesa/initiate')
      .set(authHeader)
      .send({ bookingId: 'booking-123', phone: '+254712345678' });

    expect(res.status).toBe(403);
  });

  it('returns 422 for missing bookingId', async () => {
    asClient();

    const res = await request(app)
      .post('/api/v1/payments/mpesa/initiate')
      .set(authHeader)
      .send({ phone: '+254712345678' });

    expect(res.status).toBe(422);
  });

  it('returns 422 for missing phone', async () => {
    asClient();

    const res = await request(app)
      .post('/api/v1/payments/mpesa/initiate')
      .set(authHeader)
      .send({ bookingId: 'booking-123' });

    expect(res.status).toBe(422);
  });

  it('returns 422 for invalid UUID bookingId', async () => {
    asClient();

    const res = await request(app)
      .post('/api/v1/payments/mpesa/initiate')
      .set(authHeader)
      .send({ bookingId: 'not-a-uuid', phone: '+254712345678' });

    expect(res.status).toBe(422);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/v1/payments/mpesa/initiate')
      .send({ bookingId: 'booking-123', phone: '+254712345678' });

    expect(res.status).toBe(401);
  });
});

// ── POST /payments/wallet/pay ─────────────────────────────────────────

describe('POST /api/v1/payments/wallet/pay', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deducts from wallet and marks booking PAID', async () => {
    asClient('client-123');
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(baseBooking);
    (mockPrisma.clientProfile.findUnique as jest.Mock).mockResolvedValue({
      userId: 'client-123', walletBalance: 200000, // KES 2,000
    });
    (mockPrisma.$transaction as jest.Mock).mockResolvedValue([
      { id: 'payment-wallet-123', status: 'SUCCEEDED', method: 'WALLET' },
    ]);

    const res = await request(app)
      .post('/api/v1/payments/wallet/pay')
      .set(authHeader)
      .send({ bookingId: 'booking-123' });

    expect(res.status).toBe(200);
    expect(res.body.data.method).toBe('WALLET');
    expect(res.body.data.status).toBe('SUCCEEDED');
  });

  it('returns 402 for insufficient wallet balance', async () => {
    asClient('client-123');
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(baseBooking);
    (mockPrisma.clientProfile.findUnique as jest.Mock).mockResolvedValue({
      userId: 'client-123', walletBalance: 50000, // KES 500 — not enough for KES 1,200
    });

    const res = await request(app)
      .post('/api/v1/payments/wallet/pay')
      .set(authHeader)
      .send({ bookingId: 'booking-123' });

    expect(res.status).toBe(402);
    expect(res.body.error.message).toMatch(/insufficient/i);
  });

  it('returns 403 if client does not own the booking', async () => {
    asClient('other-client');
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue({
      ...baseBooking, clientId: 'client-123', // different owner
    });

    const res = await request(app)
      .post('/api/v1/payments/wallet/pay')
      .set(authHeader)
      .send({ bookingId: 'booking-123' });

    expect(res.status).toBe(403);
  });
});

// ── POST /payments/payout/request ────────────────────────────────────

describe('POST /api/v1/payments/payout/request', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates payout request for cleaner with sufficient balance', async () => {
    asCleaner('cleaner-123');
    (mockPrisma.cleanerProfile.findUnique as jest.Mock).mockResolvedValue({
      id: 'profile-123', walletBalance: 500000, mpesaPhone: '+254712345678',
    });
    (mockPrisma.payout.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.payout.create as jest.Mock).mockResolvedValue({
      id: 'payout-123', amount: 200000, status: 'PROCESSING',
    });

    const res = await request(app)
      .post('/api/v1/payments/payout/request')
      .set(authHeader)
      .send({ amount: 200000, method: 'MPESA' });

    expect(res.status).toBe(201);
    expect(res.body.data.payoutId).toBe('payout-123');
    expect(res.body.data.requiresApproval).toBe(false); // Under KES 5,000 limit
  });

  it('flags large payout for admin approval', async () => {
    asCleaner('cleaner-123');
    (mockPrisma.cleanerProfile.findUnique as jest.Mock).mockResolvedValue({
      id: 'profile-123', walletBalance: 1000000, mpesaPhone: '+254712345678',
    });
    (mockPrisma.payout.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.payout.create as jest.Mock).mockResolvedValue({
      id: 'payout-456', amount: 700000, status: 'PENDING',
    });

    const res = await request(app)
      .post('/api/v1/payments/payout/request')
      .set(authHeader)
      .send({ amount: 700000, method: 'MPESA' }); // KES 7,000 > KES 5,000 limit

    expect(res.status).toBe(201);
    expect(res.body.data.requiresApproval).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
  });

  it('returns 402 for insufficient wallet balance', async () => {
    asCleaner();
    (mockPrisma.cleanerProfile.findUnique as jest.Mock).mockResolvedValue({
      id: 'profile-123', walletBalance: 10000, // KES 100 — below minimum
    });

    const res = await request(app)
      .post('/api/v1/payments/payout/request')
      .set(authHeader)
      .send({ amount: 200000, method: 'MPESA' });

    expect(res.status).toBe(402);
  });

  it('returns 422 for amount below minimum withdrawal', async () => {
    asCleaner();

    const res = await request(app)
      .post('/api/v1/payments/payout/request')
      .set(authHeader)
      .send({ amount: 5000, method: 'MPESA' }); // KES 50 < KES 200 minimum

    expect(res.status).toBe(422);
  });

  it('returns 429 when daily withdrawal limit reached', async () => {
    asCleaner();
    (mockPrisma.cleanerProfile.findUnique as jest.Mock).mockResolvedValue({
      id: 'profile-123', walletBalance: 1000000,
    });
    (mockPrisma.payout.count as jest.Mock).mockResolvedValue(3); // already at limit

    const res = await request(app)
      .post('/api/v1/payments/payout/request')
      .set(authHeader)
      .send({ amount: 200000, method: 'MPESA' });

    expect(res.status).toBe(429);
    expect(res.body.error.message).toMatch(/daily/i);
  });

  it('returns 403 when CLIENT tries to request payout', async () => {
    asClient();

    const res = await request(app)
      .post('/api/v1/payments/payout/request')
      .set(authHeader)
      .send({ amount: 200000, method: 'MPESA' });

    expect(res.status).toBe(403);
  });
});
