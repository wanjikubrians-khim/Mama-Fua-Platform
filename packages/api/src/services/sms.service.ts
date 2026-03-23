// Mama Fua — SMS Service (Africa's Talking)
// KhimTech | 2026

import { logger } from '../lib/logger';

export async function sendOtpSms(phone: string, otp: string): Promise<void> {
  const message = `Your Mama Fua verification code is ${otp}. Valid for 10 minutes. Do not share this code.`;
  // TODO: wire up Africa's Talking SDK
  // const at = AfricasTalking({ apiKey: process.env.AT_API_KEY, username: process.env.AT_USERNAME });
  // await at.SMS.send({ to: [phone], message, from: 'MAMAFUA' });
  logger.info(`[SMS] To: ${phone} | Message: ${message}`);
}

export async function sendSms(phone: string, message: string): Promise<void> {
  logger.info(`[SMS] To: ${phone} | Message: ${message}`);
}
