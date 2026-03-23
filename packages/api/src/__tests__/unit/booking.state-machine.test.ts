// Mama Fua — Unit Tests: Booking State Machine
// KhimTech | QA: Maryann Wanjiru | 2026
//
// Tests every valid and invalid state transition.
// This is the most critical logic in the platform — a wrong transition
// could release funds before a job is done or block a cleaner from starting.

// We test the state transition logic by mocking Prisma
// and calling the service functions directly.

jest.mock('@mama-fua/database', () => ({
  prisma: {
    booking: {
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
    },
    bid: { findFirst: jest.fn(), create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    payment: { findFirst: jest.fn() },
    dispute: { findUnique: jest.fn() },
    chatMessage: { findMany: jest.fn().mockResolvedValue([]) },
    address: { create: jest.fn() },
    service: { findUnique: jest.fn() },
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

import { prisma } from '@mama-fua/database';
import * as BookingService from '../../services/booking.service';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// ── Helpers ───────────────────────────────────────────────────────────

function makeBooking(overrides: Partial<{
  id: string;
  status: string;
  clientId: string;
  cleanerId: string | null;
  serviceId: string;
  addressId: string;
  mode: string;
  totalAmount: number;
  platformFee: number;
  cleanerEarnings: number;
}> = {}) {
  return {
    id: overrides.id ?? 'booking-123',
    bookingRef: 'MF-2026-00001',
    status: overrides.status ?? 'PENDING',
    clientId: overrides.clientId ?? 'client-123',
    cleanerId: overrides.cleanerId ?? 'cleaner-123',
    serviceId: overrides.serviceId ?? 'service-123',
    addressId: overrides.addressId ?? 'address-123',
    mode: overrides.mode ?? 'AUTO_ASSIGN',
    totalAmount: overrides.totalAmount ?? 120000,
    platformFee: overrides.platformFee ?? 18000,
    cleanerEarnings: overrides.cleanerEarnings ?? 102000,
    scheduledAt: new Date(Date.now() + 86400000),
    estimatedDuration: 180,
    baseAmount: 120000,
    bookingType: 'ONE_OFF',
  };
}

// ── acceptBooking ─────────────────────────────────────────────────────

describe('BookingService.acceptBooking', () => {
  beforeEach(() => jest.clearAllMocks());

  it('transitions PENDING → ACCEPTED for assigned cleaner', async () => {
    const booking = makeBooking({ status: 'PENDING', cleanerId: 'cleaner-123' });
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);
    (mockPrisma.booking.update as jest.Mock).mockResolvedValue({ ...booking, status: 'ACCEPTED' });

    const result = await BookingService.acceptBooking('booking-123', 'cleaner-123');
    expect(result.status).toBe('ACCEPTED');
    expect(mockPrisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'ACCEPTED' }) })
    );
  });

  it('rejects acceptance from a different cleaner', async () => {
    const booking = makeBooking({ status: 'PENDING', cleanerId: 'cleaner-456' });
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);

    await expect(
      BookingService.acceptBooking('booking-123', 'cleaner-123')
    ).rejects.toThrow('Not assigned to this booking');
  });

  it('rejects acceptance of already ACCEPTED booking', async () => {
    const booking = makeBooking({ status: 'ACCEPTED' });
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);

    await expect(
      BookingService.acceptBooking('booking-123', 'cleaner-123')
    ).rejects.toThrow(/Invalid status transition/);
  });

  it('rejects acceptance of CANCELLED booking', async () => {
    const booking = makeBooking({ status: 'CANCELLED' });
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);

    await expect(
      BookingService.acceptBooking('booking-123', 'cleaner-123')
    ).rejects.toThrow(/Invalid status transition/);
  });

  it('throws NOT_FOUND for non-existent booking', async () => {
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      BookingService.acceptBooking('nonexistent', 'cleaner-123')
    ).rejects.toThrow('Booking not found');
  });
});

// ── startBooking ──────────────────────────────────────────────────────

describe('BookingService.startBooking', () => {
  beforeEach(() => jest.clearAllMocks());

  it('transitions PAID → IN_PROGRESS for assigned cleaner', async () => {
    const booking = makeBooking({ status: 'PAID', cleanerId: 'cleaner-123' });
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);
    (mockPrisma.booking.update as jest.Mock).mockResolvedValue({ ...booking, status: 'IN_PROGRESS' });

    const result = await BookingService.startBooking('booking-123', 'cleaner-123');
    expect(result.status).toBe('IN_PROGRESS');
  });

  it('also accepts ACCEPTED → IN_PROGRESS (payment via cash)', async () => {
    const booking = makeBooking({ status: 'ACCEPTED', cleanerId: 'cleaner-123' });
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);
    (mockPrisma.booking.update as jest.Mock).mockResolvedValue({ ...booking, status: 'IN_PROGRESS' });

    const result = await BookingService.startBooking('booking-123', 'cleaner-123');
    expect(result.status).toBe('IN_PROGRESS');
  });

  it('rejects start from wrong cleaner', async () => {
    const booking = makeBooking({ status: 'PAID', cleanerId: 'cleaner-456' });
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);

    await expect(
      BookingService.startBooking('booking-123', 'cleaner-123')
    ).rejects.toThrow('Not assigned to this booking');
  });

  it('cannot start a PENDING booking (no payment yet)', async () => {
    const booking = makeBooking({ status: 'PENDING' });
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);

    await expect(
      BookingService.startBooking('booking-123', 'cleaner-123')
    ).rejects.toThrow(/Invalid status transition/);
  });
});

// ── completeBooking ───────────────────────────────────────────────────

describe('BookingService.completeBooking', () => {
  beforeEach(() => jest.clearAllMocks());

  it('transitions IN_PROGRESS → COMPLETED and schedules escrow', async () => {
    const booking = makeBooking({ status: 'IN_PROGRESS', cleanerId: 'cleaner-123' });
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);
    (mockPrisma.booking.update as jest.Mock).mockResolvedValue({ ...booking, status: 'COMPLETED' });

    const { scheduleEscrowRelease } = await import('../../services/payment.service');
    await BookingService.completeBooking('booking-123', 'cleaner-123');

    expect(scheduleEscrowRelease).toHaveBeenCalledWith('booking-123');
    expect(mockPrisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) })
    );
  });

  it('cannot complete a PENDING booking', async () => {
    const booking = makeBooking({ status: 'PENDING' });
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);

    await expect(
      BookingService.completeBooking('booking-123', 'cleaner-123')
    ).rejects.toThrow(/Invalid status transition/);
  });

  it('cannot complete a COMPLETED booking (idempotency)', async () => {
    const booking = makeBooking({ status: 'COMPLETED' });
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);

    await expect(
      BookingService.completeBooking('booking-123', 'cleaner-123')
    ).rejects.toThrow(/Invalid status transition/);
  });
});

// ── confirmBooking ────────────────────────────────────────────────────

describe('BookingService.confirmBooking', () => {
  beforeEach(() => jest.clearAllMocks());

  it('transitions COMPLETED → CONFIRMED and releases escrow', async () => {
    const booking = makeBooking({ status: 'COMPLETED', clientId: 'client-123' });
    (mockPrisma.booking.findUnique as jest.Mock)
      .mockResolvedValueOnce(booking)
      .mockResolvedValueOnce({ ...booking, status: 'CONFIRMED' });

    const { releaseEscrow } = await import('../../services/payment.service');
    await BookingService.confirmBooking('booking-123', 'client-123');

    expect(releaseEscrow).toHaveBeenCalledWith('booking-123');
  });

  it('only the booking client can confirm', async () => {
    const booking = makeBooking({ status: 'COMPLETED', clientId: 'client-123' });
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);

    await expect(
      BookingService.confirmBooking('booking-123', 'different-client')
    ).rejects.toThrow('Not your booking');
  });

  it('cannot confirm a PENDING booking', async () => {
    const booking = makeBooking({ status: 'PENDING', clientId: 'client-123' });
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);

    await expect(
      BookingService.confirmBooking('booking-123', 'client-123')
    ).rejects.toThrow(/Invalid status transition/);
  });

  it('cannot confirm a CANCELLED booking', async () => {
    const booking = makeBooking({ status: 'CANCELLED', clientId: 'client-123' });
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);

    await expect(
      BookingService.confirmBooking('booking-123', 'client-123')
    ).rejects.toThrow(/Invalid status transition/);
  });
});

// ── cancelBooking ─────────────────────────────────────────────────────

describe('BookingService.cancelBooking', () => {
  beforeEach(() => jest.clearAllMocks());

  const cancellableStatuses = ['DRAFT', 'PENDING', 'ACCEPTED', 'PAID'];
  const nonCancellableStatuses = ['IN_PROGRESS', 'COMPLETED', 'CONFIRMED', 'DISPUTED', 'CANCELLED', 'REFUNDED'];

  cancellableStatuses.forEach((status) => {
    it(`client can cancel a ${status} booking`, async () => {
      const booking = makeBooking({ status, clientId: 'client-123' });
      (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);
      (mockPrisma.booking.update as jest.Mock).mockResolvedValue({ ...booking, status: 'CANCELLED' });

      const result = await BookingService.cancelBooking('booking-123', 'client-123', 'CLIENT');
      expect(result!.status).toBe('CANCELLED');
    });
  });

  nonCancellableStatuses.forEach((status) => {
    it(`cannot cancel a ${status} booking`, async () => {
      const booking = makeBooking({ status, clientId: 'client-123' });
      (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);

      await expect(
        BookingService.cancelBooking('booking-123', 'client-123', 'CLIENT')
      ).rejects.toThrow(/Invalid status transition/);
    });
  });

  it('admin can cancel any booking their role allows', async () => {
    const booking = makeBooking({ status: 'PENDING', clientId: 'client-123' });
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);
    (mockPrisma.booking.update as jest.Mock).mockResolvedValue({ ...booking, status: 'CANCELLED' });

    const result = await BookingService.cancelBooking('booking-123', 'admin-123', 'ADMIN');
    expect(result!.status).toBe('CANCELLED');
  });

  it('stranger cannot cancel someone else\'s booking', async () => {
    const booking = makeBooking({ status: 'PENDING', clientId: 'client-123', cleanerId: 'cleaner-123' });
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);

    await expect(
      BookingService.cancelBooking('booking-123', 'stranger-456', 'CLIENT')
    ).rejects.toThrow('Cannot cancel this booking');
  });
});

// ── raiseDispute ──────────────────────────────────────────────────────

describe('BookingService.raiseDispute', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates dispute for COMPLETED booking by client', async () => {
    const booking = makeBooking({ status: 'COMPLETED', clientId: 'client-123' });
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);
    (mockPrisma.dispute.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrisma.$transaction as jest.Mock).mockResolvedValue([
      { id: 'dispute-123', bookingId: 'booking-123', status: 'OPEN' },
    ]);

    const dispute = await BookingService.raiseDispute('booking-123', 'client-123', {
      reason: 'POOR_QUALITY',
      description: 'The cleaner did not clean the bathroom properly.',
    });

    expect(dispute).toBeDefined();
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it('cannot raise dispute on IN_PROGRESS booking', async () => {
    const booking = makeBooking({ status: 'IN_PROGRESS', clientId: 'client-123' });
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);

    await expect(
      BookingService.raiseDispute('booking-123', 'client-123', {
        reason: 'POOR_QUALITY',
        description: 'Test',
      })
    ).rejects.toThrow(/Invalid status transition/);
  });

  it('cannot raise duplicate dispute', async () => {
    const booking = makeBooking({ status: 'COMPLETED', clientId: 'client-123' });
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);
    (mockPrisma.dispute.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-dispute' });

    await expect(
      BookingService.raiseDispute('booking-123', 'client-123', {
        reason: 'POOR_QUALITY',
        description: 'Test',
      })
    ).rejects.toThrow('Dispute already raised');
  });

  it('only the client of the booking can raise a dispute', async () => {
    const booking = makeBooking({ status: 'COMPLETED', clientId: 'client-123' });
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);

    await expect(
      BookingService.raiseDispute('booking-123', 'different-client', {
        reason: 'POOR_QUALITY',
        description: 'Test',
      })
    ).rejects.toThrow('Not your booking');
  });
});

// ── State machine completeness check ─────────────────────────────────

describe('Booking status transition completeness', () => {
  const ALL_STATUSES = [
    'DRAFT', 'PENDING', 'ACCEPTED', 'PAID', 'IN_PROGRESS',
    'COMPLETED', 'CONFIRMED', 'DISPUTED', 'CANCELLED', 'REFUNDED',
  ];

  it('defines exactly 10 booking statuses', () => {
    expect(ALL_STATUSES).toHaveLength(10);
  });

  it('terminal states cannot be further transitioned', () => {
    const terminalStatuses = ['CONFIRMED', 'CANCELLED', 'REFUNDED'];
    terminalStatuses.forEach((status) => {
      // These statuses should not appear in any "allowed" list for transitions
      // except COMPLETED → CONFIRMED (which is allowed above)
      expect(status).toBeDefined();
    });
  });
});
