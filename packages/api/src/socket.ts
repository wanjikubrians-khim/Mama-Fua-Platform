// Mama Fua — Socket.io Server
// KhimTech | 2026

import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { verifyAccessToken } from './lib/jwt';
import { redis, RedisKeys, TTL } from './lib/redis';
import { prisma } from '@mama-fua/database';
import { logger } from './lib/logger';

let io: SocketServer;

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
    logger.info(`Socket connected: ${userId}`);

    // Join personal room
    socket.join(`user:${userId}`);

    // Cleaner updates live position
    socket.on('cleaner:position', async (data: { bookingId: string; lat: number; lng: number; accuracy: number }) => {
      try {
        // Store last position in Redis (60s TTL)
        await redis.setex(
          RedisKeys.cleanerPosition(userId),
          TTL.CLEANER_POSITION,
          JSON.stringify({ lat: data.lat, lng: data.lng, updatedAt: new Date().toISOString() })
        );
        // Broadcast to booking room
        io.to(`booking:${data.bookingId}`).emit('cleaner:location', {
          bookingId: data.bookingId, lat: data.lat, lng: data.lng, accuracy: data.accuracy,
        });
      } catch (err) {
        logger.error('Position update error:', err);
      }
    });

    // Chat message
    socket.on('chat:send', async (data: { bookingId: string; body?: string; mediaUrl?: string }) => {
      try {
        const msg = await prisma.chatMessage.create({
          data: { bookingId: data.bookingId, senderId: userId, body: data.body, mediaUrl: data.mediaUrl },
          include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
        });
        io.to(`booking:${data.bookingId}`).emit('chat:message', {
          id: msg.id,
          bookingId: msg.bookingId,
          senderId: msg.senderId,
          senderName: `${msg.sender.firstName} ${msg.sender.lastName}`,
          body: msg.body,
          mediaUrl: msg.mediaUrl,
          createdAt: msg.createdAt.toISOString(),
        });
      } catch (err) {
        logger.error('Chat send error:', err);
      }
    });

    // Join booking room (called when client opens booking detail screen)
    socket.on('booking:join', (bookingId: string) => {
      socket.join(`booking:${bookingId}`);
      logger.info(`${userId} joined booking room ${bookingId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${userId}`);
    });
  });

  return io;
}

// Emit event to a user from anywhere in the app
export function emitToUser(userId: string, event: string, data: unknown): void {
  io?.to(`user:${userId}`).emit(event, data);
}

// Emit event to a booking room
export function emitToBooking(bookingId: string, event: string, data: unknown): void {
  io?.to(`booking:${bookingId}`).emit(event, data);
}

export { io };
