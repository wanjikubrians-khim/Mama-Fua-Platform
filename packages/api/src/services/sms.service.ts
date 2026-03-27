// Mama Fua — SMS Service (Africa's Talking)
// KhimTech | 2026

import { maskPhone, normalisePhone } from '@mama-fua/shared';
import { logger } from '../lib/logger';

export interface SmsDeliveryResult {
  delivered: boolean;
  provider: 'africastalking';
  reason?: string;
}

function getSmsConfig() {
  return {
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
    senderId: process.env.AT_SENDER_ID ?? 'MAMAFUA',
  };
}

async function postSms(phone: string, message: string): Promise<SmsDeliveryResult> {
  const { apiKey, username, senderId } = getSmsConfig();

  if (!apiKey || !username) {
    logger.warn('[SMS] Africa\'s Talking credentials missing; skipping SMS delivery');
    return { delivered: false, provider: 'africastalking', reason: 'provider_not_configured' };
  }

  if (process.env.NODE_ENV === 'test') {
    logger.info(`[SMS:test] ${maskPhone(phone)} | ${message}`);
    return { delivered: false, provider: 'africastalking', reason: 'test_environment' };
  }

  const body = new URLSearchParams({
    username,
    to: normalisePhone(phone),
    message,
    from: senderId,
  });

  const response = await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      apiKey,
    },
    body,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error(`[SMS] Africa's Talking error ${response.status}: ${errorBody}`);
    return {
      delivered: false,
      provider: 'africastalking',
      reason: `provider_error_${response.status}`,
    };
  }

  logger.info(`[SMS] Delivered to ${maskPhone(phone)}`);
  return { delivered: true, provider: 'africastalking' };
}

export async function sendOtpSms(phone: string, otp: string): Promise<SmsDeliveryResult> {
  const message = `Your Mama Fua code is ${otp}. Valid for 10 minutes. Do not share.`;
  return postSms(phone, message);
}

export async function sendSms(phone: string, message: string): Promise<SmsDeliveryResult> {
  return postSms(phone, message);
}
