// Mama Fua — Unit Tests: M-Pesa Service
// KhimTech | QA: Maryann Wanjiru | 2026
//
// Tests the M-Pesa integration logic WITHOUT calling Safaricom.
// All HTTP calls are mocked. These run fast — no network required.

jest.mock('axios');
jest.mock('../../lib/redis', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  },
  RedisKeys: {
    cleanerPosition: (id: string) => `cleaner:pos:${id}`,
    matchQueue: (id: string) => `match:${id}`,
  },
  TTL: { BOOKING_LOCK: 300 },
}));

jest.mock('@mama-fua/database', () => ({
  prisma: {
    payment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    booking: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    cleanerProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    walletTransaction: { create: jest.fn() },
    payout: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    clientProfile: { findUnique: jest.fn(), update: jest.fn() },
  },
}));

jest.mock('../../services/notification.service', () => ({
  notifyUser: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/sms.service', () => ({
  sendSms: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/payment.service', () => ({
  scheduleEscrowRelease: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../socket', () => ({
  emitToUser: jest.fn(),
  emitToBooking: jest.fn(),
}));

import axios from 'axios';
import { prisma } from '@mama-fua/database';
import { redis } from '../../lib/redis';
import {
  handleStkCallback,
  handleB2CResult,
  type StkCallback,
  type B2CResultPayload,
} from '../../services/mpesa/mpesa.service';
import { isValidStkCallback, isValidB2CResult } from '../../services/mpesa/mpesa.security';
import {
  isSuccessCode,
  MPESA_RESULT_CODES,
} from '../../services/mpesa/daraja.client';

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRedis = redis as jest.Mocked<typeof redis>;

// ── Daraja client unit tests ──────────────────────────────────────────

describe('isSuccessCode', () => {
  it('returns true for code 0', () => expect(isSuccessCode('0')).toBe(true));
  it('returns false for non-zero codes', () => {
    ['1', '4', '1032', '2001', '500'].forEach((code) => {
      expect(isSuccessCode(code)).toBe(false);
    });
  });
});

describe('MPESA_RESULT_CODES', () => {
  it('has human-readable message for common error codes', () => {
    expect(MPESA_RESULT_CODES['0']).toBe('Success');
    expect(MPESA_RESULT_CODES['1']).toBe('Insufficient funds');
    expect(MPESA_RESULT_CODES['1032']).toBe('Request cancelled by user');
    expect(MPESA_RESULT_CODES['2001']).toBe('Wrong PIN entered');
  });
});

// ── Callback structure validation ──────────────────────────────────────

describe('isValidStkCallback', () => {
  it('accepts valid STK callback payload', () => {
    const valid: StkCallback = {
      Body: {
        stkCallback: {
          MerchantRequestID: '123',
          CheckoutRequestID: 'ws_CO_123',
          ResultCode: 0,
          ResultDesc: 'Success',
        },
      },
    };
    expect(isValidStkCallback(valid)).toBe(true);
  });

  it('rejects null payload', () => expect(isValidStkCallback(null)).toBe(false));
  it('rejects empty object', () => expect(isValidStkCallback({})).toBe(false));
  it('rejects missing Body', () => expect(isValidStkCallback({ data: 'x' })).toBe(false));
  it('rejects missing stkCallback', () => expect(isValidStkCallback({ Body: {} })).toBe(false));
  it('rejects missing CheckoutRequestID', () => {
    expect(isValidStkCallback({
      Body: { stkCallback: { MerchantRequestID: '123', ResultCode: 0 } },
    })).toBe(false);
  });
  it('rejects non-numeric ResultCode', () => {
    expect(isValidStkCallback({
      Body: { stkCallback: { MerchantRequestID: '123', CheckoutRequestID: 'ws', ResultCode: '0' } },
    })).toBe(false);
  });
});

describe('isValidB2CResult', () => {
  it('accepts valid B2C result payload', () => {
    const valid: B2CResultPayload = {
      Result: {
        ResultType: 0,
        ResultCode: 0,
        ResultDesc: 'Success',
        OriginatorConversationID: 'abc',
        ConversationID: 'AG_123',
        TransactionID: 'NLJ0000000',
      },
    };
    expect(isValidB2CResult(valid)).toBe(true);
  });

  it('rejects null payload', () => expect(isValidB2CResult(null)).toBe(false));
  it('rejects missing Result', () => expect(isValidB2CResult({})).toBe(false));
  it('rejects missing ConversationID', () => {
    expect(isValidB2CResult({ Result: { ResultCode: 0 } })).toBe(false);
  });
});

// ── handleStkCallback ─────────────────────────────────────────────────

describe('handleStkCallback', () => {
  const basePayment = {
    id: 'payment-123',
    bookingId: 'booking-123',
    amount: 120000,
    status: 'PROCESSING',
    metadata: {},
    booking: {
      bookingRef: 'MF-2026-00001',
      client: { id: 'client-123', phone: '+254712345678', firstName: 'Grace' },
      cleaner: { id: 'cleaner-123' },
    },
  };

  beforeEach(() => jest.clearAllMocks());

  it('marks payment SUCCEEDED and booking PAID on ResultCode 0', async () => {
    (mockPrisma.payment.findUnique as jest.Mock).mockResolvedValue(basePayment);
    (mockPrisma.payment.update as jest.Mock).mockResolvedValue({ ...basePayment, status: 'SUCCEEDED' });
    (mockPrisma.booking.update as jest.Mock).mockResolvedValue({});
    (mockRedis.del as jest.Mock).mockResolvedValue(1);

    const callback: StkCallback = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'merchant-123',
          CheckoutRequestID: 'ws_CO_123',
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: 1200 },
              { Name: 'MpesaReceiptNumber', Value: 'NLJ7RT61SV' },
              { Name: 'TransactionDate', Value: 20260101102115 },
              { Name: 'PhoneNumber', Value: 254712345678 },
            ],
          },
        },
      },
    };

    await handleStkCallback(callback);

    expect(mockPrisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'SUCCEEDED',
          mpesaReceiptNumber: 'NLJ7RT61SV',
        }),
      })
    );
    expect(mockPrisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'PAID' } })
    );
  });

  it('marks payment FAILED on ResultCode 1032 (user cancelled)', async () => {
    (mockPrisma.payment.findUnique as jest.Mock).mockResolvedValue(basePayment);
    (mockPrisma.payment.update as jest.Mock).mockResolvedValue({ ...basePayment, status: 'FAILED' });
    (mockRedis.del as jest.Mock).mockResolvedValue(1);

    const callback: StkCallback = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'merchant-123',
          CheckoutRequestID: 'ws_CO_123',
          ResultCode: 1032,
          ResultDesc: 'Request cancelled by user',
        },
      },
    };

    await handleStkCallback(callback);

    expect(mockPrisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'FAILED',
          failureReason: 'Request cancelled by user',
        }),
      })
    );
    // Booking should NOT be updated to PAID
    expect(mockPrisma.booking.update).not.toHaveBeenCalled();
  });

  it('marks payment FAILED on ResultCode 1 (insufficient funds)', async () => {
    (mockPrisma.payment.findUnique as jest.Mock).mockResolvedValue(basePayment);
    (mockPrisma.payment.update as jest.Mock).mockResolvedValue({});
    (mockRedis.del as jest.Mock).mockResolvedValue(1);

    const callback: StkCallback = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'merchant-123',
          CheckoutRequestID: 'ws_CO_123',
          ResultCode: 1,
          ResultDesc: 'The balance is insufficient',
        },
      },
    };

    await handleStkCallback(callback);

    expect(mockPrisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'FAILED',
          failureReason: 'Insufficient funds',
        }),
      })
    );
  });

  it('handles unknown CheckoutRequestID gracefully (no payment found)', async () => {
    (mockPrisma.payment.findUnique as jest.Mock).mockResolvedValue(null);

    const callback: StkCallback = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'x',
          CheckoutRequestID: 'unknown_checkout_id',
          ResultCode: 0,
          ResultDesc: 'Success',
        },
      },
    };

    // Should not throw
    await expect(handleStkCallback(callback)).resolves.toBeUndefined();
    expect(mockPrisma.payment.update).not.toHaveBeenCalled();
  });

  it('cleans up Redis checkout mapping after processing', async () => {
    (mockPrisma.payment.findUnique as jest.Mock).mockResolvedValue(basePayment);
    (mockPrisma.payment.update as jest.Mock).mockResolvedValue({});
    (mockPrisma.booking.update as jest.Mock).mockResolvedValue({});
    (mockRedis.del as jest.Mock).mockResolvedValue(1);

    const callback: StkCallback = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'x',
          CheckoutRequestID: 'ws_CO_cleanup_test',
          ResultCode: 0,
          ResultDesc: 'Success',
          CallbackMetadata: { Item: [{ Name: 'MpesaReceiptNumber', Value: 'ABCDEF' }] },
        },
      },
    };

    await handleStkCallback(callback);
    expect(mockRedis.del).toHaveBeenCalledWith('mpesa:checkout:ws_CO_cleanup_test');
  });
});

// ── handleB2CResult ───────────────────────────────────────────────────

describe('handleB2CResult', () => {
  const basePayout = {
    id: 'payout-123',
    amount: 102000,
    status: 'PROCESSING',
    cleaner: {
      id: 'cleaner-profile-123',
      walletBalance: 102000,
      user: { id: 'cleaner-user-123', phone: '+254712345678', firstName: 'Grace' },
    },
  };

  beforeEach(() => jest.clearAllMocks());

  it('marks payout COMPLETED and records wallet debit on success', async () => {
    (mockPrisma.payout.findFirst as jest.Mock).mockResolvedValue(basePayout);
    (mockPrisma.payout.update as jest.Mock).mockResolvedValue({ ...basePayout, status: 'COMPLETED' });
    (mockPrisma.walletTransaction.create as jest.Mock).mockResolvedValue({});
    (mockPrisma.cleanerProfile.update as jest.Mock).mockResolvedValue({});

    const payload: B2CResultPayload = {
      Result: {
        ResultType: 0,
        ResultCode: 0,
        ResultDesc: 'The service request is processed successfully.',
        OriginatorConversationID: 'originator-123',
        ConversationID: 'AG_20260101_00005797af5d7d75f652',
        TransactionID: 'NLJ0000001',
        ResultParameters: {
          ResultParameter: [
            { Key: 'TransactionReceipt', Value: 'NLJ0000001' },
            { Key: 'TransactionAmount', Value: 1020 },
          ],
        },
      },
    };

    await handleB2CResult(payload);

    expect(mockPrisma.payout.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'COMPLETED',
          mpesaReceiptNumber: 'NLJ0000001',
        }),
      })
    );
    expect(mockPrisma.walletTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'DEBIT',
          amount: 102000,
        }),
      })
    );
  });

  it('marks payout FAILED and returns funds to wallet on failure', async () => {
    (mockPrisma.payout.findFirst as jest.Mock).mockResolvedValue(basePayout);
    (mockPrisma.payout.update as jest.Mock).mockResolvedValue({ ...basePayout, status: 'FAILED' });
    (mockPrisma.cleanerProfile.update as jest.Mock).mockResolvedValue({});

    const payload: B2CResultPayload = {
      Result: {
        ResultType: 0,
        ResultCode: 17,
        ResultDesc: 'System Error',
        OriginatorConversationID: 'originator-123',
        ConversationID: 'AG_20260101_fail',
        TransactionID: 'FAIL001',
      },
    };

    await handleB2CResult(payload);

    expect(mockPrisma.payout.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED' }),
      })
    );
    // Wallet balance should be restored
    expect(mockPrisma.cleanerProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { walletBalance: { increment: 102000 } },
      })
    );
  });

  it('handles unknown ConversationID gracefully', async () => {
    (mockPrisma.payout.findFirst as jest.Mock).mockResolvedValue(null);

    const payload: B2CResultPayload = {
      Result: {
        ResultType: 0,
        ResultCode: 0,
        ResultDesc: 'Success',
        OriginatorConversationID: 'unknown',
        ConversationID: 'unknown_conversation',
        TransactionID: 'XYZ001',
      },
    };

    await expect(handleB2CResult(payload)).resolves.toBeUndefined();
    expect(mockPrisma.payout.update).not.toHaveBeenCalled();
  });
});
