// Mama Fua — Socket.io Server
// KhimTech | 2026

import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { verifyAccessToken } from './lib/jwt';
import { redis, RedisKeys, TTL } from './lib/redis';
import { prisma } from '@mama-fua/database';
import { logger } from './lib/logger';
import {
  assertBookingRoomAccess,
  createChatMessage,
  serialiseChatMessage,
} from './services/chat.service';

let io: SocketServer;

async function assertCleanerTrackingAccess(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { cleanerId: true, status: true },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.cleanerId !== userId) {
    throw new Error('Only the assigned cleaner may share live position');
  }

  if (!['ACCEPTED', 'PAID', 'IN_PROGRESS'].includes(booking.status)) {
    throw new Error('Live tracking is not active for this booking');
  }
}

export function initSocket(server: HttpServer): SocketServer {
  io = new SocketServer(server, {
    cors: { origin: (process.env.ALLOWED_ORIGINS ?? '').split(','), credentials: true },
    transports: ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth['token'] as string | undefined;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = verifyAccessToken(token);
      socket.data['userId'] = payload.sub;
      socket.data['role'] = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data['userId'] as string;
    const role = socket.data['role'] as string;

    logger.info(`Socket connected: ${userId}`);
    socket.join(`user:${userId}`);

    socket.on(
      'cleaner:position',
      async (data: { bookingId: string; lat: number; lng: number; accuracy: number }) => {
        try {
          if (!Number.isFinite(data.lat) || !Number.isFinite(data.lng) || !Number.isFinite(data.accuracy)) {
            throw new Error('Invalid location payload');
          }

          await assertCleanerTrackingAccess(data.bookingId, userId);

          const updatedAt = new Date();
          await Promise.all([
            redis.setex(
              RedisKeys.cleanerPosition(userId),
              TTL.CLEANER_POSITION,
              JSON.stringify({ lat: data.lat, lng: data.lng, updatedAt: updatedAt.toISOString() })
            ),
            prisma.cleanerProfile.updateMany({
              where: { userId },
              data: {
                currentLat: data.lat,
                currentLng: data.lng,
                lastLocationAt: updatedAt,
              },
            }),
          ]);

          io.to(`booking:${data.bookingId}`).emit('cleaner:location', {
            bookingId: data.bookingId,
            lat: data.lat,
            lng: data.lng,
            accuracy: data.accuracy,
          });
        } catch (err) {
          logger.warn('Position update rejected', err);
          socket.emit('system:error', { message: err instanceof Error ? err.message : 'Position update failed' });
        }
      }
    );

    socket.on(
      'chat:send',
      async (data: { bookingId: string; body?: string; mediaUrl?: string }) => {
        try {
          const message = await createChatMessage(data.bookingId, userId, role, {
            ...(data.body !== undefined ? { body: data.body } : {}),
            ...(data.mediaUrl !== undefined ? { mediaUrl: data.mediaUrl } : {}),
          });

          io.to(`booking:${data.bookingId}`).emit('chat:message', serialiseChatMessage(message));
        } catch (err) {
          logger.warn('Chat send rejected', err);
          socket.emit('chat:error', { message: err instanceof Error ? err.message : 'Unable to send chat message' });
        }
      }
    );

    socket.on('booking:join', async (payload: string | { bookingId: string }) => {
      const bookingId = typeof payload === 'string' ? payload : payload.bookingId;

      try {
        await assertBookingRoomAccess(bookingId, userId, role);
        socket.join(`booking:${bookingId}`);
        await redis.setex(
          RedisKeys.bookingRoomMember(bookingId, userId),
          TTL.ROOM_MEMBERSHIP,
          socket.id
        );
        logger.info(`${userId} joined booking room ${bookingId}`);
      } catch (err) {
        logger.warn(`Socket join rejected for ${userId} on booking ${bookingId}`, err);
        socket.emit('booking:error', {
          bookingId,
          message: err instanceof Error ? err.message : 'Unable to join booking room',
        });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${userId}`);
    });
  });

  return io;
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  io?.to(`user:${userId}`).emit(event, data);
}

export function emitToBooking(bookingId: string, event: string, data: unknown): void {
  io?.to(`booking:${bookingId}`).emit(event, data);
}

export { io };
