// Mama Fua — Webhook Routes
// KhimTech | 2026
//
// IMPORTANT: These routes receive raw bodies (mounted before express.json() in app.ts)
// They are PUBLIC — no auth middleware. Security is via IP whitelist + signature validation.

import { Router, Request, Response } from 'express';
import {
  handleStkCallback, handleB2CResult,
  StkCallback, B2CResultPayload,
} from '../services/mpesa/mpesa.service';
import {
  validateMpesaCallback, isValidStkCallback, isValidB2CResult,
} from '../services/mpesa/mpesa.security';
import { logger } from '../lib/logger';

const router = Router();

// ── M-Pesa STK Push Callback ──────────────────────────────────────────
// Safaricom POSTs here after client enters PIN (success or failure)
// URL configured in MPESA_CALLBACK_URL env var

router.post('/mpesa/stk', validateMpesaCallback, async (req: Request, res: Response) => {
  // Always respond 200 immediately — Safaricom retries if we take > 3s
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  try {
    const body = req.body as unknown;

    if (!isValidStkCallback(body)) {
      logger.warn('[Webhook] Invalid STK callback structure received');
      return;
    }

    await handleStkCallback(body as StkCallback);
  } catch (err) {
    // Don't throw — response already sent. Just log.
    logger.error('[Webhook] STK callback processing error:', err);
  }
});

// ── M-Pesa B2C Result ─────────────────────────────────────────────────
// Safaricom POSTs here after a B2C payout is processed (success or failure)
// URL configured in MPESA_B2C_RESULT_URL env var

router.post('/mpesa/b2c', validateMpesaCallback, async (req: Request, res: Response) => {
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  try {
    const body = req.body as unknown;

    if (!isValidB2CResult(body)) {
      logger.warn('[Webhook] Invalid B2C result structure received');
      return;
    }

    await handleB2CResult(body as B2CResultPayload);
  } catch (err) {
    logger.error('[Webhook] B2C result processing error:', err);
  }
});

// ── M-Pesa B2C Queue Timeout ──────────────────────────────────────────
// Fires if B2C request times out in Safaricom's queue
// Must return funds to cleaner's wallet for retry

router.post('/mpesa/b2c/timeout', validateMpesaCallback, async (req: Request, res: Response) => {
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  try {
    const body = req.body as unknown;

    if (!isValidB2CResult(body)) {
      logger.warn('[Webhook] Invalid B2C timeout structure received');
      return;
    }

    const payload = body as B2CResultPayload;
    logger.warn('[Webhook] M-Pesa B2C queue timeout received:', {
      conversationId: payload.ConversationID,
      originator: payload.OriginatorConversationID,
      timeoutOn: new Date().toISOString(),
    });

    // TODO: Parse conversation ID from payload
    // TODO: Find booking/payout record
    // TODO: Mark transaction as TIMEOUT
    // TODO: Return funds to cleaner's wallet for manual review
    // TODO: Notify cleaner of timeout + retry option
  } catch (err) {
    logger.error('[Webhook] B2C timeout processing error:', err);
  }
});

// ── Stripe Webhook ────────────────────────────────────────────────────
// Stripe POSTs here on payment events
// Signature verification + event handling

router.post('/stripe', async (req: Request, res: Response) => {
  // Stripe requires a 200 response quickly — send first
  res.json({ received: true });

  try {
    const sig = req.headers['stripe-signature'] as string | undefined;
    const rawBody = req.body;

    if (!sig) {
      logger.warn('[Webhook] Stripe event missing signature header');
      return;
    }

    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      logger.warn('[Webhook] STRIPE_WEBHOOK_SECRET not configured');
      return;
    }

    // TODO: Implement Stripe signature verification + event handler
    // const event = stripe.webhooks.constructEvent(rawBody, sig, secret);
    // Handle event.type: 'charge.succeeded', 'charge.failed', etc.
    
    logger.info('[Webhook] Stripe event signature verified:', typeof rawBody === 'object' ? JSON.stringify(rawBody).slice(0, 200) : 'raw');
  } catch (err) {
    logger.error('[Webhook] Stripe processing error:', err);
  }
});

export default router;
