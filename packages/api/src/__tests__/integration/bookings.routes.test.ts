// Mama Fua — Integration Tests: Booking Routes
// KhimTech | QA: Maryann Wanjiru | 2026

import request from 'supertest';
import app from '../../app';

// Mock auth — inject user identity directly
jest.mock('../../lib/jwt', () => ({
  verifyAccessToken: jest.fn(),
  signAccessToken: jest.fn().mockReturnValue('test.access.token'),
  signRefreshToken: jest.fn().mockReturnValue('test.refresh.token'),
}));

jest.mock('@mama-fua/database', () => ({
  prisma: {
    booking: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
    },
    service: { findUnique: jest.fn() },
    address: { create: jest.fn(), findUnique: jest.fn() },
    bid: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    dispute: { findUnique: jest.fn(), create: jest.fn() },
    payment: { findFirst: jest.fn() },
    chatMessage: { findMany: jest.fn().mockResolvedValue([]) },
    clientProfile: { findUnique: jest.fn(), update: jest.fn() },
    cleanerProfile: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
  BookingStatus: {},
  BookingMode: {},
}));

jest.mock('../../services/notification.service', () => ({
  notifyUser: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/matching.service', () => ({
  dispatchMatchQueue: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/payment.service', () => ({
  releaseEscrow: jest.fn().mockResolvedValue(undefined),
  scheduleEscrowRelease: jest.fn().mockResolvedValue(undefined),
}));

import { verifyAccessToken } from '../../lib/jwt';
import { prisma } from '@mama-fua/database';

const mockVerify = verifyAccessToken as jest.Mock;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Helper: set up auth for each test
function asClient(userId = 'client-123') {
  mockVerify.mockReturnValue({ sub: userId, role: 'CLIENT', phone: '+254712345678' });
}
function asCleaner(cleanerId = 'cleaner-123') {
  mockVerify.mockReturnValue({ sub: cleanerId, role: 'CLEANER', phone: '+254712345679' });
}
const authHeader = { Authorization: 'Bearer test.token' };

const baseBooking = {
  id: 'booking-123',
  bookingRef: 'MF-2026-00001',
  status: 'PENDING',
  clientId: 'client-123',
  cleanerId: 'cleaner-123',
  serviceId: 'service-123',
  addressId: 'address-123',
  mode: 'AUTO_ASSIGN',
  bookingType: 'ONE_OFF',
  totalAmount: 120000,
  platformFee: 18000,
  cleanerEarnings: 102000,
  baseAmount: 120000,
  scheduledAt: new Date(Date.now() + 86400000).toISOString(),
  estimatedDuration: 180,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  service: { name: 'Home Cleaning', category: 'HOME_CLEANING', description: 'Test' },
  address: { id: 'address-123', area: 'Kilimani', city: 'Nairobi', lat: -1.2921, lng: 36.7823, addressLine1: 'Test Rd', label: 'Home' },
  client: { id: 'client-123', firstName: 'Grace', lastName: 'Muthoni', avatarUrl: null, phone: '+254712345678' },
  cleaner: { id: 'cleaner-123', firstName: 'John', lastName: 'Doe', avatarUrl: null, phone: '+254712345679' },
  payments: [],
  review: null,
  dispute: null,
};

// ── GET /bookings ─────────────────────────────────────────────────────

describe('GET /api/v1/bookings', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns client bookings when authenticated as CLIENT', async () => {
    asClient();
    (mockPrisma.booking.findMany as jest.Mock).mockResolvedValue([baseBooking]);
    (mockPrisma.booking.count as jest.Mock).mockResolvedValue(1);

    const res = await request(app).get('/api/v1/bookings').set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/v1/bookings');
    expect(res.status).toBe(401);
  });

  it('filters by status when provided', async () => {
    asClient();
    (mockPrisma.booking.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.booking.count as jest.Mock).mockResolvedValue(0);

    await request(app).get('/api/v1/bookings?status=PENDING').set(authHeader);

    expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PENDING' }),
      })
    );
  });
});

// ── GET /bookings/:id ─────────────────────────────────────────────────

describe('GET /api/v1/bookings/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns booking detail for booking client', async () => {
    asClient('client-123');
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(baseBooking);

    const res = await request(app).get('/api/v1/bookings/booking-123').set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.bookingRef).toBe('MF-2026-00001');
  });

  it('returns booking detail for assigned cleaner', async () => {
    asCleaner('cleaner-123');
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(baseBooking);

    const res = await request(app).get('/api/v1/bookings/booking-123').set(authHeader);

    expect(res.status).toBe(200);
  });

  it('returns 403 for unrelated user', async () => {
    mockVerify.mockReturnValue({ sub: 'stranger-999', role: 'CLIENT', phone: '+254712345670' });
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(baseBooking);

    const res = await request(app).get('/api/v1/bookings/booking-123').set(authHeader);

    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent booking', async () => {
    asClient();
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/api/v1/bookings/nonexistent').set(authHeader);

    expect(res.status).toBe(404);
  });
});

// ── POST /bookings ────────────────────────────────────────────────────

describe('POST /api/v1/bookings', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a booking for authenticated CLIENT', async () => {
    asClient();
    (mockPrisma.service.findUnique as jest.Mock).mockResolvedValue({
      id: 'service-123', name: 'Home Cleaning', basePrice: 120000,
      durationMinutes: 180, isActive: true,
    });
    (mockPrisma.address.create as jest.Mock).mockResolvedValue({ id: 'addr-123' });
    (mockPrisma.booking.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.booking.create as jest.Mock).mockResolvedValue({
      ...baseBooking, status: 'PENDING',
    });

    const res = await request(app)
      .post('/api/v1/bookings')
      .set(authHeader)
      .send({
        serviceId: 'service-123',
        mode: 'AUTO_ASSIGN',
        address: {
          label: 'Home', addressLine1: 'Test Road', area: 'Kilimani',
          lat: -1.2921, lng: 36.7823,
        },
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        bookingType: 'ONE_OFF',
        paymentMethod: 'MPESA',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING');
  });

  it('returns 403 when CLEANER tries to create booking', async () => {
    asCleaner();

    const res = await request(app)
      .post('/api/v1/bookings')
      .set(authHeader)
      .send({
        serviceId: 'service-123', mode: 'AUTO_ASSIGN',
        addressId: 'addr-123',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        bookingType: 'ONE_OFF', paymentMethod: 'MPESA',
      });

    expect(res.status).toBe(403);
  });

  it('returns 422 for missing required fields', async () => {
    asClient();

    const res = await request(app)
      .post('/api/v1/bookings')
      .set(authHeader)
      .send({ serviceId: 'service-123' }); // missing many fields

    expect(res.status).toBe(422);
  });

  it('returns 422 for invalid mode', async () => {
    asClient();

    const res = await request(app)
      .post('/api/v1/bookings')
      .set(authHeader)
      .send({
        serviceId: 'service-123', mode: 'INVALID_MODE',
        addressId: 'addr-123',
        scheduledAt: new Date().toISOString(),
        bookingType: 'ONE_OFF', paymentMethod: 'MPESA',
      });

    expect(res.status).toBe(422);
  });
});

// ── POST /bookings/:id/accept ─────────────────────────────────────────

describe('POST /api/v1/bookings/:id/accept', () => {
  beforeEach(() => jest.clearAllMocks());

  it('cleaner can accept an assigned PENDING booking', async () => {
    asCleaner('cleaner-123');
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue({
      ...baseBooking, status: 'PENDING', cleanerId: 'cleaner-123',
    });
    (mockPrisma.booking.update as jest.Mock).mockResolvedValue({
      ...baseBooking, status: 'ACCEPTED',
    });

    const res = await request(app)
      .post('/api/v1/bookings/booking-123/accept')
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ACCEPTED');
  });

  it('returns 403 if CLIENT tries to accept', async () => {
    asClient();

    const res = await request(app)
      .post('/api/v1/bookings/booking-123/accept')
      .set(authHeader);

    expect(res.status).toBe(403);
  });
});

// ── POST /bookings/:id/start ──────────────────────────────────────────

describe('POST /api/v1/bookings/:id/start', () => {
  it('cleaner can start a PAID booking', async () => {
    asCleaner('cleaner-123');
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue({
      ...baseBooking, status: 'PAID', cleanerId: 'cleaner-123',
    });
    (mockPrisma.booking.update as jest.Mock).mockResolvedValue({
      ...baseBooking, status: 'IN_PROGRESS',
    });

    const res = await request(app)
      .post('/api/v1/bookings/booking-123/start')
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('IN_PROGRESS');
  });
});

// ── POST /bookings/:id/complete ───────────────────────────────────────

describe('POST /api/v1/bookings/:id/complete', () => {
  it('cleaner can complete an IN_PROGRESS booking', async () => {
    asCleaner('cleaner-123');
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue({
      ...baseBooking, status: 'IN_PROGRESS', cleanerId: 'cleaner-123',
    });
    (mockPrisma.booking.update as jest.Mock).mockResolvedValue({
      ...baseBooking, status: 'COMPLETED',
    });

    const res = await request(app)
      .post('/api/v1/bookings/booking-123/complete')
      .set(authHeader);

    expect(res.status).toBe(200);
  });
});

// ── POST /bookings/:id/dispute ────────────────────────────────────────

describe('POST /api/v1/bookings/:id/dispute', () => {
  it('client can raise dispute on COMPLETED booking', async () => {
    asClient('client-123');
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue({
      ...baseBooking, status: 'COMPLETED',
    });
    (mockPrisma.dispute.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrisma.$transaction as jest.Mock).mockResolvedValue([{
      id: 'dispute-123', bookingId: 'booking-123', status: 'OPEN',
    }]);

    const res = await request(app)
      .post('/api/v1/bookings/booking-123/dispute')
      .set(authHeader)
      .send({
        reason: 'POOR_QUALITY',
        description: 'The bathroom was not cleaned properly at all.',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('OPEN');
  });

  it('returns 422 for short description', async () => {
    asClient('client-123');

    const res = await request(app)
      .post('/api/v1/bookings/booking-123/dispute')
      .set(authHeader)
      .send({ reason: 'POOR_QUALITY', description: 'Bad' }); // too short

    expect(res.status).toBe(422);
  });

  it('returns 403 when CLEANER tries to raise dispute', async () => {
    asCleaner();

    const res = await request(app)
      .post('/api/v1/bookings/booking-123/dispute')
      .set(authHeader)
      .send({ reason: 'POOR_QUALITY', description: 'Test description here' });

    expect(res.status).toBe(403);
  });
});
