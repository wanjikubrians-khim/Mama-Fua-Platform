// Mama Fua — Integration Tests: Webhook Routes
// KhimTech | QA: Maryann Wanjiru | 2026
//
// Tests the M-Pesa callback endpoints.
// These MUST respond 200 immediately and process async.
// Safaricom retries if they don't get a response within 3 seconds.

import request from 'supertest';
import app from '../../app';

jest.mock('../../services/mpesa/mpesa.service', () => ({
  handleStkCallback: jest.fn().mockResolvedValue(undefined),
  handleB2CResult: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../services/mpesa/mpesa.security', () => ({
  validateMpesaCallback: (_req: unknown, _res: unknown, next: () => void) => next(),
  isValidStkCallback: jest.fn(),
  isValidB2CResult: jest.fn(),
}));

import { handleStkCallback, handleB2CResult } from '../../services/mpesa/mpesa.service';
import { isValidStkCallback, isValidB2CResult } from '../../services/mpesa/mpesa.security';

const mockHandleStk = handleStkCallback as jest.Mock;
const mockHandleB2C = handleB2CResult as jest.Mock;
const mockIsValidStk = isValidStkCallback as jest.Mock;
const mockIsValidB2C = isValidB2CResult as jest.Mock;

// ── STK Push webhook ──────────────────────────────────────────────────

describe('POST /api/v1/webhooks/mpesa/stk', () => {
  beforeEach(() => jest.clearAllMocks());

  const validStkSuccess = {
    Body: {
      stkCallback: {
        MerchantRequestID: '29115-34620561-1',
        CheckoutRequestID: 'ws_CO_191220191020363925',
        ResultCode: 0,
        ResultDesc: 'The service request is processed successfully.',
        CallbackMetadata: {
          Item: [
            { Name: 'Amount', Value: 1200 },
            { Name: 'MpesaReceiptNumber', Value: 'NLJ7RT61SV' },
            { Name: 'TransactionDate', Value: 20191219102115 },
            { Name: 'PhoneNumber', Value: 254712345678 },
          ],
        },
      },
    },
  };

  const validStkFailure = {
    Body: {
      stkCallback: {
        MerchantRequestID: '29115-34620561-2',
        CheckoutRequestID: 'ws_CO_fail_001',
        ResultCode: 1032,
        ResultDesc: 'Request cancelled by user',
      },
    },
  };

  it('responds 200 immediately for successful STK callback', async () => {
    mockIsValidStk.mockReturnValue(true);
    mockHandleStk.mockResolvedValue(undefined);

    const res = await request(app)
      .post('/api/v1/webhooks/mpesa/stk')
      .send(validStkSuccess);

    expect(res.status).toBe(200);
    expect(res.body.ResultCode).toBe(0);
    expect(res.body.ResultDesc).toBe('Accepted');
  });

  it('responds 200 immediately for failed STK callback (user cancelled)', async () => {
    mockIsValidStk.mockReturnValue(true);
    mockHandleStk.mockResolvedValue(undefined);

    const res = await request(app)
      .post('/api/v1/webhooks/mpesa/stk')
      .send(validStkFailure);

    expect(res.status).toBe(200); // Always 200 to Safaricom
    expect(res.body.ResultCode).toBe(0);
  });

  it('calls handleStkCallback for valid payload', async () => {
    mockIsValidStk.mockReturnValue(true);
    mockHandleStk.mockResolvedValue(undefined);

    await request(app)
      .post('/api/v1/webhooks/mpesa/stk')
      .send(validStkSuccess);

    expect(mockHandleStk).toHaveBeenCalledWith(validStkSuccess);
  });

  it('does NOT call handleStkCallback for invalid payload structure', async () => {
    mockIsValidStk.mockReturnValue(false);

    await request(app)
      .post('/api/v1/webhooks/mpesa/stk')
      .send({ invalid: 'payload' });

    expect(mockHandleStk).not.toHaveBeenCalled();
  });

  it('still returns 200 even if handleStkCallback throws (async resilience)', async () => {
    mockIsValidStk.mockReturnValue(true);
    mockHandleStk.mockRejectedValue(new Error('Database error'));

    const res = await request(app)
      .post('/api/v1/webhooks/mpesa/stk')
      .send(validStkSuccess);

    // Must still be 200 — response is sent before async processing
    expect(res.status).toBe(200);
  });

  it('responds within 2 seconds (Safaricom 3s timeout requirement)', async () => {
    mockIsValidStk.mockReturnValue(true);
    // Simulate slow processing
    mockHandleStk.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    const start = Date.now();
    const res = await request(app)
      .post('/api/v1/webhooks/mpesa/stk')
      .send(validStkSuccess);
    const elapsed = Date.now() - start;

    expect(res.status).toBe(200);
    expect(elapsed).toBeLessThan(2000); // Response sent before async completes
  });
});

// ── B2C Result webhook ────────────────────────────────────────────────

describe('POST /api/v1/webhooks/mpesa/b2c', () => {
  beforeEach(() => jest.clearAllMocks());

  const validB2CSuccess = {
    Result: {
      ResultType: 0,
      ResultCode: 0,
      ResultDesc: 'The service request is processed successfully.',
      OriginatorConversationID: '19455-773836-1',
      ConversationID: 'AG_20191219_00005797af5d7d75f652',
      TransactionID: 'NLJ0000000',
      ResultParameters: {
        ResultParameter: [
          { Key: 'TransactionReceipt', Value: 'NLJ0000000' },
          { Key: 'TransactionAmount', Value: 1020 },
        ],
      },
    },
  };

  it('responds 200 for valid B2C success callback', async () => {
    mockIsValidB2C.mockReturnValue(true);
    mockHandleB2C.mockResolvedValue(undefined);

    const res = await request(app)
      .post('/api/v1/webhooks/mpesa/b2c')
      .send(validB2CSuccess);

    expect(res.status).toBe(200);
    expect(res.body.ResultCode).toBe(0);
  });

  it('calls handleB2CResult for valid payload', async () => {
    mockIsValidB2C.mockReturnValue(true);
    mockHandleB2C.mockResolvedValue(undefined);

    await request(app)
      .post('/api/v1/webhooks/mpesa/b2c')
      .send(validB2CSuccess);

    expect(mockHandleB2C).toHaveBeenCalledWith(validB2CSuccess);
  });

  it('does not call handleB2CResult for invalid payload', async () => {
    mockIsValidB2C.mockReturnValue(false);

    await request(app)
      .post('/api/v1/webhooks/mpesa/b2c')
      .send({ junk: 'data' });

    expect(mockHandleB2C).not.toHaveBeenCalled();
  });

  it('remains resilient to processing errors', async () => {
    mockIsValidB2C.mockReturnValue(true);
    mockHandleB2C.mockRejectedValue(new Error('Redis timeout'));

    const res = await request(app)
      .post('/api/v1/webhooks/mpesa/b2c')
      .send(validB2CSuccess);

    expect(res.status).toBe(200);
  });
});

// ── Stripe webhook ────────────────────────────────────────────────────

describe('POST /api/v1/webhooks/stripe', () => {
  it('responds 200 for Stripe webhook', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/stripe')
      .set('stripe-signature', 'test_sig')
      .send({ type: 'payment_intent.succeeded', data: { object: {} } });

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });
});
