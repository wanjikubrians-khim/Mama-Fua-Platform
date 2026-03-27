// Mama Fua — Shared Types
// KhimTech | 2026

// ─── API RESPONSE WRAPPER ────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
    fields?: Record<string, string>;
  };
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;        // userId
  role: string;       // UserRole
  phone: string;
  iat: number;
  exp: number;
}

// ─── USER ────────────────────────────────────────────────────────────────────
export interface UserPublic {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
}

export interface UserMe extends UserPublic {
  phone: string;
  email: string | null;
  status: string;
  preferredLang: string;
  lastLoginAt: string | null;
}

// ─── CLEANER ─────────────────────────────────────────────────────────────────
export interface CleanerPublic extends UserPublic {
  bio: string | null;
  rating: number;
  totalReviews: number;
  totalJobs: number;
  isAvailable: boolean;
  serviceAreaRadius: number;
  verificationStatus: string;
  services: CleanerServicePublic[];
}

export interface CleanerServicePublic {
  serviceId: string;
  serviceName: string;
  category: string;
  customPrice: number;
  estimatedDuration: number;
}

export interface CleanerNearby extends CleanerPublic {
  distanceKm: number;
  estimatedArrivalMinutes?: number;
}

// ─── BOOKING ─────────────────────────────────────────────────────────────────
export interface BookingCreateInput {
  serviceId: string;
  mode: 'AUTO_ASSIGN' | 'BROWSE_PICK' | 'POST_BID';
  cleanerId?: string;
  addressId?: string;
  address?: AddressInput;
  scheduledAt: string;
  bookingType: 'ONE_OFF' | 'RECURRING';
  recurringFrequency?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  specialInstructions?: string;
  paymentMethod: 'MPESA' | 'STRIPE_CARD' | 'WALLET' | 'CASH';
  mpesaPhone?: string;
}

export interface AddressInput {
  label: string;
  addressLine1: string;
  addressLine2?: string;
  area: string;
  city?: string;
  county?: string;
  lat: number;
  lng: number;
  instructions?: string;
  saveAddress?: boolean;
}

export interface BookingSummary {
  id: string;
  bookingRef: string;
  status: string;
  mode: string;
  scheduledAt: string;
  totalAmount: number;
  service: { name: string; category: string };
  cleaner: UserPublic | null;
  client: UserPublic;
  address: AddressSummary;
  createdAt: string;
}

export interface AddressSummary {
  id: string;
  label: string;
  addressLine1: string;
  area: string;
  city: string;
  lat: number;
  lng: number;
}

// ─── PAYMENT ─────────────────────────────────────────────────────────────────
export interface MpesaInitiateInput {
  bookingId: string;
  phone: string;
}

export interface MpesaInitiateResponse {
  checkoutRequestId: string;
  merchantRequestId: string;
  responseDescription: string;
}

export interface StripeIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
}

// ─── LOCATION ────────────────────────────────────────────────────────────────
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetail extends Coordinates {
  formattedAddress: string;
  area: string;
  city: string;
  county?: string;
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

// ─── SOCKET EVENTS ───────────────────────────────────────────────────────────
export interface SocketEvents {
  // Server → Client
  'booking:accepted': { bookingId: string; cleanerId: string };
  'booking:declined': { bookingId: string };
  'booking:in_progress': { bookingId: string; startedAt: string };
  'booking:completed': { bookingId: string; completedAt: string };
  'cleaner:location': { bookingId: string; lat: number; lng: number; accuracy: number };
  'chat:message': ChatMessagePayload;
  'payment:confirmed': { bookingId: string; paymentId: string };
  'payment:failed': { bookingId: string; reason: string };
  'notification:new': PushPayload & { id: string; type: string };
  // Client → Server
  'booking:join': { bookingId: string };
  'cleaner:position': { bookingId: string; lat: number; lng: number; accuracy: number };
  'chat:send': { bookingId: string; body?: string; mediaUrl?: string };
}

export interface ChatMessagePayload {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  body: string | null;
  mediaUrl: string | null;
  createdAt: string;
}

// ─── ERROR CODES ─────────────────────────────────────────────────────────────
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORISED: 'UNAUTHORISED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  BOOKING_UNAVAILABLE: 'BOOKING_UNAVAILABLE',
  NO_CLEANERS_AVAILABLE: 'NO_CLEANERS_AVAILABLE',
  OTP_INVALID: 'OTP_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_MAX_ATTEMPTS: 'OTP_MAX_ATTEMPTS',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  VERIFICATION_REQUIRED: 'VERIFICATION_REQUIRED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
