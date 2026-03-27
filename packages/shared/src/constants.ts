// Mama Fua — Shared Constants
// KhimTech | 2026

// ─── COMMISSION RATES ────────────────────────────────────────────────────────
export const COMMISSION = {
  STANDARD: 0.15,           // 15% — default
  PREMIUM_CLEANER: 0.12,    // 12% — cleaners rated 4.8+
  AGENCY: 0.18,             // 18% — agency accounts
  RECURRING: 0.10,          // 10% — recurring bookings (3rd+)
  CASH: 0.05,               // 5%  — cash bookings
} as const;

// ─── BOOKING ─────────────────────────────────────────────────────────────────
export const BOOKING = {
  AUTO_ASSIGN_TIMEOUT_MS: 5 * 60 * 1000,       // 5 minutes to accept
  BROWSE_PICK_TIMEOUT_MS: 30 * 60 * 1000,      // 30 minutes to accept
  BID_EXPIRY_HOURS: 24,
  DISPUTE_WINDOW_HOURS: 24,                     // 24hr to raise after completion
  ESCROW_RELEASE_HOURS: 24,
  MAX_MATCH_CANDIDATES: 10,
  MIN_CLEANER_RATING_FOR_MATCH: 3.5,
  DEFAULT_SEARCH_RADIUS_KM: 10,
  MAX_SEARCH_RADIUS_KM: 20,
} as const;

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
export const PAYMENT = {
  MIN_WALLET_TOPUP: 50000,       // KES 500 in cents
  MAX_WALLET_BALANCE: 5000000,   // KES 50,000 in cents
  MIN_WITHDRAWAL: 20000,         // KES 200 in cents
  MAX_WITHDRAWAL: 7000000,       // KES 70,000 in cents (M-Pesa B2C limit)
  AUTO_APPROVE_PAYOUT_LIMIT: 500000, // KES 5,000 — above this needs admin
  MAX_WITHDRAWALS_PER_DAY: 3,
  MIN_RATING_FOR_CASH: 4.5,
} as const;

// ─── OTP ─────────────────────────────────────────────────────────────────────
export const OTP = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS: 5,
  LOCKOUT_MINUTES: 15,
  DEV_CODE: '123456',           // Only used when NODE_ENV=development
} as const;

// ─── COMMUNICATIONS ─────────────────────────────────────────────────────────
export const CHAT = {
  MAX_MESSAGE_LENGTH: 1000,
  RETENTION_DAYS: 90,
  ROOM_MEMBERSHIP_TTL_SECONDS: 2 * 60 * 60,
  ALLOWED_MEDIA_EXTENSIONS: ['.jpg', '.jpeg', '.png'],
  ACTIVE_STATUSES: ['ACCEPTED', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'CONFIRMED'],
  CLOSED_STATUSES: ['CANCELLED', 'REFUNDED'],
} as const;

export const NOTIFICATIONS = {
  MAX_TITLE_LENGTH: 120,
  MAX_BODY_LENGTH: 500,
  MAX_DATA_ITEMS: 16,
  MAX_DATA_VALUE_LENGTH: 256,
  DEFAULT_POLL_INTERVAL_MS: 30_000,
} as const;

// ─── PAGINATION ──────────────────────────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// ─── RATE LIMITS ─────────────────────────────────────────────────────────────
export const RATE_LIMIT = {
  GLOBAL_PER_MIN: 100,
  AUTH_PER_MIN: 10,
  OTP_PER_HOUR: 5,
} as const;

// ─── STORAGE ─────────────────────────────────────────────────────────────────
export const STORAGE = {
  MAX_AVATAR_SIZE_BYTES: 5 * 1024 * 1024,    // 5MB
  MAX_JOB_PHOTO_BYTES: 10 * 1024 * 1024,     // 10MB
  MAX_ID_SCAN_BYTES: 8 * 1024 * 1024,        // 8MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  SIGNED_URL_EXPIRY_SECONDS: 900,             // 15 minutes for ID docs
} as const;

// ─── SURGE PRICING ───────────────────────────────────────────────────────────
export const SURGE = {
  MIN_MULTIPLIER: 1.0,
  MAX_MULTIPLIER: 1.5,
} as const;

// ─── BOOKING REF ─────────────────────────────────────────────────────────────
export function generateBookingRef(sequence: number): string {
  const year = new Date().getFullYear();
  const padded = String(sequence).padStart(5, '0');
  return `MF-${year}-${padded}`;
}

// ─── MONEY HELPERS ───────────────────────────────────────────────────────────
/** Convert KES cents integer to formatted string e.g. 120000 → "KES 1,200.00" */
export function formatKES(cents: number): string {
  return `KES ${(cents / 100).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
}

/** Calculate platform fee and cleaner earnings from total amount */
export function calculateCommission(
  totalCents: number,
  rate: number
): { platformFee: number; cleanerEarnings: number } {
  const platformFee = Math.round(totalCents * rate);
  const cleanerEarnings = totalCents - platformFee;
  return { platformFee, cleanerEarnings };
}

// ─── PHONE HELPERS ───────────────────────────────────────────────────────────
/** Normalise Kenyan phone numbers to +254 format */
export function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('254')) return `+${digits}`;
  if (digits.startsWith('0')) return `+254${digits.slice(1)}`;
  if (digits.startsWith('7') || digits.startsWith('1')) return `+254${digits}`;
  return phone;
}

/** Mask phone for logs e.g. +254712345678 → +2547****678 */
export function maskPhone(phone: string): string {
  if (phone.length < 8) return '****';
  return `${phone.slice(0, 6)}****${phone.slice(-3)}`;
}
