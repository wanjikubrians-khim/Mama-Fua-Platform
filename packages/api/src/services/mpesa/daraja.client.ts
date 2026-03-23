// Mama Fua — M-Pesa Daraja API Client
// KhimTech | Lead Dev: Brian Wanjiku | QA: Maryann Wanjiru | 2026
//
// Implements:
//   - OAuth2 access token (auto-refresh, Redis cached)
//   - STK Push (C2B Lipa Na M-Pesa Online)
//   - STK Push Query (status poll)
//   - B2C Payment (Business to Customer — cleaner payouts)
//   - Account Balance query

import axios from 'axios';
import { redis, RedisKeys, TTL } from '../../lib/redis';
import { logger } from '../../lib/logger';
import { maskPhone } from '@mama-fua/shared';

// ── Config ────────────────────────────────────────────────────────────

const IS_SANDBOX = process.env.NODE_ENV !== 'production';

const BASE_URL = IS_SANDBOX
  ? 'https://sandbox.safaricom.co.ke'
  : 'https://api.safaricom.co.ke';

const cfg = {
  consumerKey:         process.env.MPESA_CONSUMER_KEY ?? '',
  consumerSecret:      process.env.MPESA_CONSUMER_SECRET ?? '',
  shortcode:           process.env.MPESA_SHORTCODE ?? '174379',
  passkey:             process.env.MPESA_PASSKEY ?? '',
  callbackUrl:         process.env.MPESA_CALLBACK_URL ?? '',
  b2cResultUrl:        process.env.MPESA_B2C_RESULT_URL ?? '',
  b2cQueueTimeoutUrl:  process.env.MPESA_B2C_QUEUE_TIMEOUT_URL ?? '',
  initiatorName:       process.env.MPESA_INITIATOR_NAME ?? '',
  securityCredential:  process.env.MPESA_SECURITY_CREDENTIAL ?? '',
};

// ── Token management ──────────────────────────────────────────────────

const TOKEN_CACHE_KEY = 'mpesa:access_token';

async function getAccessToken(): Promise<string> {
  // Try cache first
  const cached = await redis.get(TOKEN_CACHE_KEY);
  if (cached) return cached;

  // Fetch fresh token
  const credentials = Buffer.from(`${cfg.consumerKey}:${cfg.consumerSecret}`).toString('base64');
  const res = await axios.get(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` } }
  );

  const token: string = res.data.access_token;
  const expiresIn: number = parseInt(res.data.expires_in ?? '3600') - 60; // refresh 1 min early

  await redis.setex(TOKEN_CACHE_KEY, expiresIn, token);
  logger.info('[M-Pesa] Access token refreshed');
  return token;
}

// ── Timestamp helper ──────────────────────────────────────────────────

function mpesaTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 14); // YYYYMMDDHHmmss
}

function mpesaPassword(timestamp: string): string {
  return Buffer.from(`${cfg.shortcode}${cfg.passkey}${timestamp}`).toString('base64');
}

// ── STK Push ─────────────────────────────────────────────────────────

export interface StkPushInput {
  phone: string;          // +254... format
  amountKES: number;      // in KES (not cents)
  bookingRef: string;
  description: string;
}

export interface StkPushResponse {
  merchantRequestId: string;
  checkoutRequestId: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
}

export async function initiateStkPush(input: StkPushInput): Promise<StkPushResponse> {
  const token = await getAccessToken();
  const timestamp = mpesaTimestamp();
  const password = mpesaPassword(timestamp);

  // Safaricom expects phone without '+' prefix
  const phone = input.phone.replace(/^\+/, '');

  logger.info(`[M-Pesa] STK Push → ${maskPhone(input.phone)} KES ${input.amountKES} ref:${input.bookingRef}`);

  const payload = {
    BusinessShortCode: cfg.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(input.amountKES),  // must be integer
    PartyA: phone,
    PartyB: cfg.shortcode,
    PhoneNumber: phone,
    CallBackURL: cfg.callbackUrl,
    AccountReference: input.bookingRef,
    TransactionDesc: input.description.slice(0, 13), // Safaricom max 13 chars
  };

  const res = await axios.post(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    payload,
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );

  if (res.data.ResponseCode !== '0') {
    throw new MpesaError(
      res.data.ResponseCode,
      res.data.ResponseDescription ?? 'STK Push failed'
    );
  }

  return {
    merchantRequestId: res.data.MerchantRequestID,
    checkoutRequestId: res.data.CheckoutRequestID,
    responseCode: res.data.ResponseCode,
    responseDescription: res.data.ResponseDescription,
    customerMessage: res.data.CustomerMessage,
  };
}

// ── STK Push Query (status poll) ─────────────────────────────────────

export interface StkQueryResponse {
  resultCode: string;
  resultDesc: string;
  merchantRequestId: string;
  checkoutRequestId: string;
}

export async function queryStkStatus(checkoutRequestId: string): Promise<StkQueryResponse> {
  const token = await getAccessToken();
  const timestamp = mpesaTimestamp();
  const password = mpesaPassword(timestamp);

  const res = await axios.post(
    `${BASE_URL}/mpesa/stkpushquery/v1/query`,
    {
      BusinessShortCode: cfg.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );

  return {
    resultCode: res.data.ResultCode,
    resultDesc: res.data.ResultDesc,
    merchantRequestId: res.data.MerchantRequestID,
    checkoutRequestId: res.data.CheckoutRequestID,
  };
}

// ── B2C Payment (cleaner payouts) ─────────────────────────────────────

export interface B2CInput {
  phone: string;          // +254...
  amountKES: number;      // in KES (not cents)
  payoutId: string;
  remarks: string;
}

export interface B2CResponse {
  conversationId: string;
  originatorConversationId: string;
  responseDescription: string;
}

export async function initiateB2C(input: B2CInput): Promise<B2CResponse> {
  const token = await getAccessToken();
  const phone = input.phone.replace(/^\+/, '');

  logger.info(`[M-Pesa] B2C → ${maskPhone(input.phone)} KES ${input.amountKES} payout:${input.payoutId}`);

  const res = await axios.post(
    `${BASE_URL}/mpesa/b2c/v1/paymentrequest`,
    {
      InitiatorName: cfg.initiatorName,
      SecurityCredential: cfg.securityCredential,
      CommandID: 'BusinessPayment',         // direct to phone
      Amount: Math.round(input.amountKES),
      PartyA: cfg.shortcode,
      PartyB: phone,
      Remarks: input.remarks.slice(0, 100),
      QueueTimeOutURL: cfg.b2cQueueTimeoutUrl,
      ResultURL: cfg.b2cResultUrl,
      Occasion: input.payoutId,
    },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );

  if (res.data.ResponseCode !== '0') {
    throw new MpesaError(
      res.data.ResponseCode,
      res.data.ResponseDescription ?? 'B2C initiation failed'
    );
  }

  return {
    conversationId: res.data.ConversationID,
    originatorConversationId: res.data.OriginatorConversationID,
    responseDescription: res.data.ResponseDescription,
  };
}

// ── Error class ───────────────────────────────────────────────────────

export class MpesaError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'MpesaError';
  }
}

// ── Result codes ──────────────────────────────────────────────────────

export const MPESA_RESULT_CODES: Record<string, string> = {
  '0':    'Success',
  '1':    'Insufficient funds',
  '2':    'Account not active',
  '4':    'Request cancelled by user',
  '17':   'M-Pesa system error',
  '1032': 'Request cancelled by user',
  '1037': 'DS timeout — user did not respond',
  '2001': 'Wrong PIN entered',
  '1019': 'Transaction expired',
};

export function isSuccessCode(code: string): boolean {
  return code === '0';
}
