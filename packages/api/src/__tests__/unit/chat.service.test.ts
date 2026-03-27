declare const jest: any;
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;

jest.mock('@mama-fua/database', () => ({
  prisma: {
    booking: { findUnique: jest.fn() },
    chatMessage: { create: jest.fn(), findMany: jest.fn() },
  },
}));

import { AppError } from '../../middleware/errorHandler';
import {
  applyProfanityFilter,
  createChatMessage,
  listChatMessages,
} from '../../services/chat.service';

const { prisma } = jest.requireMock('@mama-fua/database') as { prisma: any };
const mockPrisma = prisma as any;

describe('chat.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks chat history access for unrelated users', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'booking-123',
      clientId: 'client-123',
      cleanerId: 'cleaner-123',
      status: 'IN_PROGRESS',
      actualEndAt: null,
      updatedAt: new Date(),
    } as never);

    await expect(
      listChatMessages('booking-123', 'stranger-999', 'CLIENT', { limit: 20 })
    ).rejects.toMatchObject({
      statusCode: 403,
      code: 'FORBIDDEN',
    });
  });

  it('filters profanity before persisting a message', async () => {
    const now = new Date();

    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'booking-123',
      clientId: 'client-123',
      cleanerId: 'cleaner-123',
      status: 'IN_PROGRESS',
      actualEndAt: null,
      updatedAt: now,
    } as never);

    mockPrisma.chatMessage.create.mockResolvedValue({
      id: 'message-123',
      bookingId: 'booking-123',
      senderId: 'client-123',
      body: 'This is s**t',
      mediaUrl: null,
      createdAt: now,
      sender: { firstName: 'Grace', lastName: 'Muthoni' },
    } as never);

    await createChatMessage('booking-123', 'client-123', 'CLIENT', {
      body: 'This is shit',
    });

    expect(mockPrisma.chatMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          body: 'This is s**t',
        }),
      })
    );
  });

  it('rejects new messages for cancelled bookings', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'booking-123',
      clientId: 'client-123',
      cleanerId: 'cleaner-123',
      status: 'CANCELLED',
      actualEndAt: null,
      updatedAt: new Date(),
    } as never);

    await expect(
      createChatMessage('booking-123', 'client-123', 'CLIENT', {
        body: 'Hello there',
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
  });

  it('only allows jpg and png attachments', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'booking-123',
      clientId: 'client-123',
      cleanerId: 'cleaner-123',
      status: 'IN_PROGRESS',
      actualEndAt: null,
      updatedAt: new Date(),
    } as never);

    await expect(
      createChatMessage('booking-123', 'client-123', 'CLIENT', {
        mediaUrl: 'https://cdn.mamafua.co.ke/chat/manual.pdf',
      })
    ).rejects.toMatchObject({
      statusCode: 422,
      code: 'VALIDATION_ERROR',
    });
  });

  it('applies the profanity filter deterministically', () => {
    expect(applyProfanityFilter('bitch please')).toBe('b***h please');
  });
});
