// Mama Fua — M-Pesa Webhook Security
// KhimTech | 2026
//
// Safaricom sends callbacks from a known IP range.
// We validate both IP origin and basic structural integrity.

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../lib/logger';

// Safaricom's documented callback IP ranges (update if Safaricom changes these)
// Source: https://developer.safaricom.co.ke/Documentation
const SAFARICOM_IPS = new Set([
  '196.201.214.200',
  '196.201.214.206',
  '196.201.213.114',
  '196.201.214.207',
  '196.201.214.208',
  '196.201.213.44',
  '196.201.212.127',
  '196.201.212.138',
  '196.201.212.129',
  '196.201.212.136',
  '196.201.212.74',
  '196.201.212.69',
]);

// In sandbox, Safaricom callbacks come from various IPs — skip IP check
const IS_SANDBOX = process.env.NODE_ENV !== 'production';

/**
 * Middleware: validate that the callback is genuinely from Safaricom.
 * Checks IP whitelist in production. Logs but allows in sandbox.
 */
export function validateMpesaCallback(req: Request, res: Response, next: NextFunction): void {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
    req.socket.remoteAddress ??
    '';

  if (IS_SANDBOX) {
    logger.info(`[M-Pesa] Sandbox callback from IP: ${ip}`);
    next();
    return;
  }

  if (!SAFARICOM_IPS.has(ip)) {
    logger.warn(`[M-Pesa] Blocked callback from unknown IP: ${ip}`);
    res.status(403).json({ ResultCode: 1, ResultDesc: 'Forbidden' });
    return;
  }

  next();
}

/**
 * Validate STK Push callback structure.
 * Returns true if the payload looks legitimate.
 */
export function isValidStkCallback(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  if (!b['Body'] || typeof b['Body'] !== 'object') return false;
  const body2 = b['Body'] as Record<string, unknown>;
  if (!body2['stkCallback'] || typeof body2['stkCallback'] !== 'object') return false;
  const cb = body2['stkCallback'] as Record<string, unknown>;
  return (
    typeof cb['CheckoutRequestID'] === 'string' &&
    typeof cb['MerchantRequestID'] === 'string' &&
    typeof cb['ResultCode'] === 'number'
  );
}

/**
 * Validate B2C result callback structure.
 */
export function isValidB2CResult(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  if (!b['Result'] || typeof b['Result'] !== 'object') return false;
  const result = b['Result'] as Record<string, unknown>;
  return (
    typeof result['ResultCode'] === 'number' &&
    typeof result['ConversationID'] === 'string'
  );
}
