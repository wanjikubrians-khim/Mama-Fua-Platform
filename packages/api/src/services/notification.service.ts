// Mama Fua — Notification Orchestration
// KhimTech | 2026

import { prisma } from '@mama-fua/database';
import type { Prisma } from '@prisma/client';
import { NOTIFICATIONS, type PushPayload } from '@mama-fua/shared';
import { logger } from '../lib/logger';
import { emitToUser } from '../socket';
import { sendTransactionalEmail } from './email.service';
import { sendPushToUser, type PushChannelId } from './push.service';
import { sendSms } from './sms.service';

export type NotificationCategory =
  | 'BOOKING'
  | 'PAYMENT'
  | 'REVIEW'
  | 'CHAT'
  | 'SYSTEM'
  | 'PROMOTION';

export type NotificationChannel = 'IN_APP' | 'PUSH' | 'SMS' | 'EMAIL';

export interface NotificationRequest extends PushPayload {
  type?: NotificationCategory;
  channels?: NotificationChannel[];
  fallbackChannels?: Array<Exclude<NotificationChannel, 'IN_APP'>>;
  persist?: boolean;
  realtime?: boolean;
  sms?: {
    message?: string;
  };
  email?: {
    subject?: string;
    templateId?: string;
    dynamicTemplateData?: Record<string, unknown>;
    textContent?: string;
    categories?: string[];
  };
  push?: {
    channelId?: PushChannelId;
  };
}

export interface NotificationDeliveryResult {
  notificationId?: string;
  persisted: boolean;
  channels: Array<{
    channel: NotificationChannel;
    status: 'sent' | 'skipped' | 'failed';
    reason?: string;
  }>;
}

const DEFAULT_CHANNELS: NotificationChannel[] = ['IN_APP', 'PUSH'];

const DEFAULT_PUSH_CHANNEL_BY_TYPE: Record<NotificationCategory, PushChannelId> = {
  BOOKING: 'bookings',
  PAYMENT: 'payments',
  REVIEW: 'bookings',
  CHAT: 'chat',
  SYSTEM: 'system',
  PROMOTION: 'promotions',
};

function dedupeChannels(channels?: NotificationChannel[]) {
  return [...new Set(channels ?? DEFAULT_CHANNELS)];
}

function dedupeFallbackChannels(
  channels?: Array<Exclude<NotificationChannel, 'IN_APP'>>
): Array<Exclude<NotificationChannel, 'IN_APP'>> {
  return [...new Set(channels ?? [])];
}

function normaliseString(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

function normaliseData(data?: Record<string, string>) {
  if (!data) return {};

  return Object.fromEntries(
    Object.entries(data)
      .slice(0, NOTIFICATIONS.MAX_DATA_ITEMS)
      .map(
        ([key, value]): [string, string] => [
        key.slice(0, 64),
        String(value).slice(0, NOTIFICATIONS.MAX_DATA_VALUE_LENGTH),
        ]
      )
      .filter(
        (entry): entry is [string, string] => entry[0].length > 0 && entry[1].length > 0
      )
  );
}

function buildSmsMessage(payload: NotificationRequest) {
  return payload.sms?.message ?? `${payload.title}: ${payload.body}`;
}

export async function notifyUser(
  userId: string,
  payload: NotificationRequest
): Promise<NotificationDeliveryResult> {
  const type = payload.type ?? 'BOOKING';
  const title = normaliseString(payload.title, NOTIFICATIONS.MAX_TITLE_LENGTH);
  const body = normaliseString(payload.body, NOTIFICATIONS.MAX_BODY_LENGTH);
  const data = normaliseData(payload.data);
  const channels = dedupeChannels(payload.channels);
  const fallbackChannels = dedupeFallbackChannels(payload.fallbackChannels);
  const delivery: NotificationDeliveryResult = {
    persisted: false,
    channels: [],
  };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      email: true,
    },
  });

  if (!user) {
    logger.warn(`[notify] user ${userId} not found`);
    return {
      ...delivery,
      channels: channels.map((channel) => ({
        channel,
        status: 'failed',
        reason: 'user_not_found',
      })),
    };
  }

  if (payload.persist !== false || channels.includes('IN_APP')) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data: data as Prisma.InputJsonValue,
      },
    });

    delivery.notificationId = notification.id;
    delivery.persisted = true;

    if (payload.realtime !== false) {
      emitToUser(userId, 'notification:new', {
        id: notification.id,
        type,
        title,
        body,
        data,
      });
    }

    delivery.channels.push({ channel: 'IN_APP', status: 'sent' });
  }

  if (channels.includes('PUSH')) {
    try {
      const pushResult = await sendPushToUser(userId, {
        title,
        body,
        data,
        channelId: payload.push?.channelId ?? DEFAULT_PUSH_CHANNEL_BY_TYPE[type],
      });

      delivery.channels.push({
        channel: 'PUSH',
        status: pushResult.delivered ? 'sent' : 'failed',
        ...(pushResult.reason ? { reason: pushResult.reason } : {}),
      });

      if (!pushResult.delivered && fallbackChannels.includes('SMS')) {
        const smsResult = await sendSms(user.phone, buildSmsMessage(payload));
        delivery.channels.push({
          channel: 'SMS',
          status: smsResult.delivered ? 'sent' : 'failed',
          ...(smsResult.reason ? { reason: smsResult.reason } : {}),
        });
      }
    } catch (err) {
      logger.error('[notify] push delivery failed', err);
      delivery.channels.push({
        channel: 'PUSH',
        status: 'failed',
        reason: 'push_exception',
      });
    }
  }

  if (channels.includes('SMS')) {
    const smsResult = await sendSms(user.phone, buildSmsMessage(payload));
    delivery.channels.push({
      channel: 'SMS',
      status: smsResult.delivered ? 'sent' : 'failed',
      ...(smsResult.reason ? { reason: smsResult.reason } : {}),
    });
  }

  if (channels.includes('EMAIL')) {
    if (!user.email) {
      delivery.channels.push({
        channel: 'EMAIL',
        status: 'skipped',
        reason: 'missing_email',
      });
    } else {
      const emailOptions: Parameters<typeof sendTransactionalEmail>[0] = {
        to: user.email,
        subject: payload.email?.subject ?? title,
        textContent: payload.email?.textContent ?? body,
        categories: payload.email?.categories ?? ['transactional', type.toLowerCase()],
      };

      if (payload.email?.templateId) {
        emailOptions.templateId = payload.email.templateId;
      }

      if (payload.email?.dynamicTemplateData) {
        emailOptions.dynamicTemplateData = payload.email.dynamicTemplateData;
      }

      const emailResult = await sendTransactionalEmail(emailOptions);
      delivery.channels.push({
        channel: 'EMAIL',
        status: emailResult.delivered ? 'sent' : 'failed',
        ...(emailResult.reason ? { reason: emailResult.reason } : {}),
      });
    }
  }

  logger.info(`[notify] ${userId}: ${title}`);
  return delivery;
}
