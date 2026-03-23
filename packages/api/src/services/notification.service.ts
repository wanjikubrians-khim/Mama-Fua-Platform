// Mama Fua — Notification Service stub
// KhimTech | 2026
import { prisma } from '@mama-fua/database';
import { PushPayload } from '@mama-fua/shared';
import { logger } from '../lib/logger';

export async function notifyUser(userId: string, payload: PushPayload & { data?: Record<string, string> }): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: 'BOOKING',
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      },
    });
    // TODO: Firebase FCM push — wire up in Phase 2
    logger.info(`[notify] ${userId}: ${payload.title}`);
  } catch (err) {
    logger.error('Notification failed:', err);
  }
}
