// Mama Fua — Push Notification Service (Firebase FCM)
// KhimTech | 2026

import * as admin from 'firebase-admin';
import { prisma } from '@mama-fua/database';
import type { PushPayload } from '@mama-fua/shared';
import { logger } from '../lib/logger';

export type PushChannelId = 'bookings' | 'payments' | 'chat' | 'promotions' | 'system';

export interface PushDeliveryResult {
  delivered: boolean;
  attemptedTokens: number;
  successfulTokens: number;
  failedTokens: number;
  reason?: string;
}

let firebaseBootAttempted = false;

function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as admin.ServiceAccount;
  } catch (err) {
    logger.error('[Push] Invalid FIREBASE_SERVICE_ACCOUNT_JSON', err);
    return null;
  }
}

function getMessaging() {
  if (admin.apps.length > 0) {
    return admin.messaging();
  }

  if (firebaseBootAttempted) {
    return null;
  }

  firebaseBootAttempted = true;

  const serviceAccount = parseServiceAccount();

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    logger.info('[Push] Firebase admin initialized from service account JSON');
    return admin.messaging();
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp();
    logger.info('[Push] Firebase admin initialized from application default credentials');
    return admin.messaging();
  }

  logger.warn('[Push] Firebase credentials missing; push delivery disabled');
  return null;
}

function normalisePushData(data?: Record<string, string>) {
  if (!data) return undefined;
  return Object.fromEntries(
    Object.entries(data)
      .filter(([key, value]) => key.length > 0 && typeof value === 'string')
      .map(([key, value]) => [key, value])
  );
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload & { channelId?: PushChannelId }
): Promise<PushDeliveryResult> {
  const messaging = getMessaging();

  if (!messaging) {
    return {
      delivered: false,
      attemptedTokens: 0,
      successfulTokens: 0,
      failedTokens: 0,
      reason: 'provider_not_configured',
    };
  }

  const deviceTokens = await prisma.deviceToken.findMany({
    where: {
      userId,
      platform: { in: ['ios', 'android', 'web'] },
    },
    select: { token: true },
  });

  if (deviceTokens.length === 0) {
    return {
      delivered: false,
      attemptedTokens: 0,
      successfulTokens: 0,
      failedTokens: 0,
      reason: 'no_device_tokens',
    };
  }

  const multicastMessage: admin.messaging.MulticastMessage = {
    tokens: deviceTokens.map((entry: { token: string }) => entry.token),
    notification: {
      title: payload.title,
      body: payload.body,
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: payload.channelId ?? 'system',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  const pushData = normalisePushData(payload.data);
  if (pushData) {
    multicastMessage.data = pushData;
  }

  const response = await messaging.sendEachForMulticast(multicastMessage);

  const staleTokens = response.responses
    .map((result, index) => ({
      result,
      token: deviceTokens[index]?.token,
    }))
    .filter(
      ({ result, token }) =>
        token &&
        !result.success &&
        (
          result.error?.code === 'messaging/registration-token-not-registered' ||
          result.error?.code === 'messaging/invalid-registration-token'
        )
    )
    .map(({ token }) => token!);

  if (staleTokens.length > 0) {
    await prisma.deviceToken.deleteMany({
      where: { token: { in: staleTokens } },
    });
    logger.warn(`[Push] Removed ${staleTokens.length} stale device token(s) for user ${userId}`);
  }

  return {
    delivered: response.successCount > 0,
    attemptedTokens: deviceTokens.length,
    successfulTokens: response.successCount,
    failedTokens: response.failureCount,
    ...(response.successCount === 0 ? { reason: 'delivery_failed' } : {}),
  };
}
