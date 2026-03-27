declare const jest: any;
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;

jest.mock('@mama-fua/database', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    notification: { create: jest.fn() },
  },
}));

jest.mock('../../socket', () => ({
  emitToUser: jest.fn(),
}));

jest.mock('../../services/push.service', () => ({
  sendPushToUser: jest.fn(),
}));

jest.mock('../../services/sms.service', () => ({
  sendSms: jest.fn(),
}));

jest.mock('../../services/email.service', () => ({
  sendTransactionalEmail: jest.fn(),
}));

import { emitToUser } from '../../socket';
import { sendPushToUser } from '../../services/push.service';
import { sendSms } from '../../services/sms.service';
import { sendTransactionalEmail } from '../../services/email.service';
import { notifyUser } from '../../services/notification.service';

const { prisma } = jest.requireMock('@mama-fua/database') as { prisma: any };
const mockPrisma = prisma as any;
const mockEmitToUser = emitToUser as any;
const mockSendPushToUser = sendPushToUser as any;
const mockSendSms = sendSms as any;
const mockSendTransactionalEmail = sendTransactionalEmail as any;

describe('notification.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-123',
      phone: '+254712345678',
      email: 'grace@test.com',
    } as never);
    mockPrisma.notification.create.mockResolvedValue({
      id: 'notification-123',
    } as never);
    mockSendPushToUser.mockResolvedValue({
      delivered: true,
      attemptedTokens: 1,
      successfulTokens: 1,
      failedTokens: 0,
    });
    mockSendSms.mockResolvedValue({
      delivered: true,
      provider: 'africastalking',
    });
    mockSendTransactionalEmail.mockResolvedValue({
      delivered: true,
      provider: 'sendgrid',
    });
  });

  it('persists typed notifications and emits them in real time', async () => {
    const result = await notifyUser('user-123', {
      type: 'PAYMENT',
      title: 'Payment confirmed',
      body: 'Wallet updated.',
      data: { screen: 'Wallet' },
    });

    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-123',
          type: 'PAYMENT',
          title: 'Payment confirmed',
        }),
      })
    );

    expect(mockEmitToUser).toHaveBeenCalledWith(
      'user-123',
      'notification:new',
      expect.objectContaining({
        id: 'notification-123',
        type: 'PAYMENT',
        title: 'Payment confirmed',
      })
    );

    expect(result.persisted).toBe(true);
    expect(result.channels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ channel: 'IN_APP', status: 'sent' }),
        expect.objectContaining({ channel: 'PUSH', status: 'sent' }),
      ])
    );
  });

  it('falls back to SMS when push delivery fails and SMS fallback is configured', async () => {
    mockSendPushToUser.mockResolvedValue({
      delivered: false,
      attemptedTokens: 0,
      successfulTokens: 0,
      failedTokens: 0,
      reason: 'no_device_tokens',
    });

    const result = await notifyUser('user-123', {
      type: 'BOOKING',
      title: 'Cleaner accepted',
      body: 'Track their arrival.',
      fallbackChannels: ['SMS'],
      sms: {
        message: 'Cleaner accepted your Mama Fua booking.',
      },
    });

    expect(mockSendSms).toHaveBeenCalledWith(
      '+254712345678',
      'Cleaner accepted your Mama Fua booking.'
    );

    expect(result.channels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ channel: 'PUSH', status: 'failed', reason: 'no_device_tokens' }),
        expect.objectContaining({ channel: 'SMS', status: 'sent' }),
      ])
    );
  });

  it('sends email when explicitly requested and the user has an email address', async () => {
    await notifyUser('user-123', {
      type: 'SYSTEM',
      title: 'Account update',
      body: 'Your settings were changed.',
      channels: ['IN_APP', 'EMAIL'],
      email: {
        subject: 'Mama Fua account update',
        textContent: 'Your settings were changed.',
      },
    });

    expect(mockSendTransactionalEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'grace@test.com',
        subject: 'Mama Fua account update',
      })
    );
  });
});
