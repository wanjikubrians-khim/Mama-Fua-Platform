// Mama Fua — Chat Service
// KhimTech | 2026

import { prisma } from '@mama-fua/database';
import { CHAT, ERROR_CODES } from '@mama-fua/shared';
import { AppError } from '../middleware/errorHandler';

const PROFANITY_PATTERNS = [
  /\bfuck(?:er|ing|ed)?\b/gi,
  /\bshit(?:ty)?\b/gi,
  /\bbitch(?:es)?\b/gi,
  /\basshole\b/gi,
  /\bbastard\b/gi,
  /\bmotherfucker\b/gi,
];

function maskProfanity(match: string) {
  if (match.length <= 2) return '*'.repeat(match.length);
  return `${match[0]}${'*'.repeat(match.length - 2)}${match[match.length - 1]}`;
}

export function applyProfanityFilter(input: string) {
  return PROFANITY_PATTERNS.reduce(
    (value, pattern) => value.replace(pattern, (match) => maskProfanity(match)),
    input
  );
}

function isAdminRole(role: string) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

function isArchived(booking: { status: string; actualEndAt: Date | null; updatedAt: Date }) {
  if (!['COMPLETED', 'CONFIRMED'].includes(booking.status)) {
    return false;
  }

  const completedAt = booking.actualEndAt ?? booking.updatedAt;
  const retentionWindowMs = CHAT.RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - completedAt.getTime() > retentionWindowMs;
}

function validateMediaUrl(mediaUrl?: string) {
  if (!mediaUrl) return null;

  let parsed: URL;
  try {
    parsed = new URL(mediaUrl);
  } catch {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Chat media URL must be a valid URL', 422);
  }

  const isSecure = parsed.protocol === 'https:' || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  if (!isSecure) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Chat media must use HTTPS', 422);
  }

  const lowerPath = parsed.pathname.toLowerCase();
  const hasAllowedExtension = CHAT.ALLOWED_MEDIA_EXTENSIONS.some((extension) =>
    lowerPath.endsWith(extension)
  );

  if (!hasAllowedExtension) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Chat only supports JPG and PNG image attachments',
      422
    );
  }

  return mediaUrl;
}

async function getBookingAccess(bookingId: string, userId: string, role: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      clientId: true,
      cleanerId: true,
      status: true,
      actualEndAt: true,
      updatedAt: true,
    },
  });

  if (!booking) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Booking not found', 404);
  }

  const admin = isAdminRole(role);
  const party = booking.clientId === userId || booking.cleanerId === userId;

  if (!admin && !party) {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'Access denied', 403);
  }

  return { booking, admin, party };
}

export async function assertBookingRoomAccess(bookingId: string, userId: string, role: string) {
  const access = await getBookingAccess(bookingId, userId, role);

  if (isArchived(access.booking) && !access.admin) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Chat history has been archived', 410);
  }

  return access;
}

export async function createChatMessage(
  bookingId: string,
  userId: string,
  role: string,
  input: { body?: string; mediaUrl?: string }
) {
  const access = await getBookingAccess(bookingId, userId, role);

  if (access.admin) {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'Admins may read chat but cannot participate', 403);
  }

  if (!CHAT.ACTIVE_STATUSES.includes(access.booking.status)) {
    throw new AppError(ERROR_CODES.CONFLICT, 'Chat is not available for this booking status', 409);
  }

  if (isArchived(access.booking)) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Chat history has been archived', 410);
  }

  const trimmedBody = input.body?.trim();
  const body = trimmedBody ? applyProfanityFilter(trimmedBody) : null;
  const mediaUrl = validateMediaUrl(input.mediaUrl);

  if (body && body.length > CHAT.MAX_MESSAGE_LENGTH) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      `Chat messages must be ${CHAT.MAX_MESSAGE_LENGTH} characters or fewer`,
      422
    );
  }

  if (!body && !mediaUrl) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Chat message cannot be empty', 422);
  }

  return prisma.chatMessage.create({
    data: {
      bookingId,
      senderId: userId,
      body,
      mediaUrl,
    },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
    },
  });
}

export async function listChatMessages(
  bookingId: string,
  userId: string,
  role: string,
  query: { cursor?: string; limit: number }
) {
  const access = await assertBookingRoomAccess(bookingId, userId, role);

  return prisma.chatMessage.findMany({
    where: {
      bookingId,
      ...(query.cursor ? { createdAt: { lt: new Date(query.cursor) } } : {}),
    },
    take: query.limit,
    orderBy: { createdAt: 'desc' },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
    },
  });
}

export function serialiseChatMessage(message: {
  id: string;
  bookingId: string;
  senderId: string;
  body: string | null;
  mediaUrl: string | null;
  createdAt: Date;
  sender: { firstName: string; lastName: string };
}) {
  return {
    id: message.id,
    bookingId: message.bookingId,
    senderId: message.senderId,
    senderName: `${message.sender.firstName} ${message.sender.lastName}`.trim(),
    body: message.body,
    mediaUrl: message.mediaUrl,
    createdAt: message.createdAt.toISOString(),
  };
}
