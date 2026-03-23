// Mama Fua — Test Fixtures
// KhimTech | QA: Maryann Wanjiru | 2026
//
// Factory functions for creating test data.
// Use these in all tests — never hardcode raw data.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateBookingRef } from '@mama-fua/shared';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

// ── User fixtures ──────────────────────────────────────────────────────

export async function createTestClient(overrides: Partial<{
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
}> = {}) {
  const phone = overrides.phone ?? `+2547${Math.floor(10000000 + Math.random() * 89999999)}`;
  return prisma.user.create({
    data: {
      phone,
      firstName: overrides.firstName ?? 'Test',
      lastName: overrides.lastName ?? 'Client',
      email: overrides.email,
      role: 'CLIENT',
      status: 'ACTIVE',
      clientProfile: { create: {} },
    },
    include: { clientProfile: true },
  });
}

export async function createTestCleaner(overrides: Partial<{
  phone: string;
  firstName: string;
  rating: number;
  isAvailable: boolean;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  walletBalance: number;
}> = {}) {
  const phone = overrides.phone ?? `+2547${Math.floor(10000000 + Math.random() * 89999999)}`;
  return prisma.user.create({
    data: {
      phone,
      firstName: overrides.firstName ?? 'Test',
      lastName: 'Cleaner',
      role: 'CLEANER',
      status: 'ACTIVE',
      cleanerProfile: {
        create: {
          verificationStatus: overrides.verificationStatus ?? 'VERIFIED',
          rating: overrides.rating ?? 4.5,
          isAvailable: overrides.isAvailable ?? true,
          serviceAreaLat: -1.2921,
          serviceAreaLng: 36.8219,
          serviceAreaRadius: 10,
          walletBalance: overrides.walletBalance ?? 0,
          mpesaPhone: phone,
        },
      },
    },
    include: { cleanerProfile: true },
  });
}

export async function createTestAdmin() {
  const phone = `+2547${Math.floor(10000000 + Math.random() * 89999999)}`;
  return prisma.user.create({
    data: {
      phone,
      firstName: 'Test',
      lastName: 'Admin',
      email: `admin-${Date.now()}@test.com`,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
}

// ── Service fixtures ────────────────────────────────────────────────────

export async function createTestService(overrides: Partial<{
  name: string;
  basePrice: number;
  maxPrice: number;
}> = {}) {
  const name = overrides.name ?? `Test Service ${Date.now()}`;
  return prisma.service.create({
    data: {
      category: 'HOME_CLEANING',
      name,
      description: 'Test service description',
      basePrice: overrides.basePrice ?? 120000,
      maxPrice: overrides.maxPrice ?? 400000,
      durationMinutes: 180,
      isActive: true,
    },
  });
}

// ── Address fixtures ────────────────────────────────────────────────────

export async function createTestAddress(userId: string) {
  return prisma.address.create({
    data: {
      userId,
      label: 'Home',
      addressLine1: 'Test Road',
      area: 'Kilimani',
      city: 'Nairobi',
      lat: -1.2921,
      lng: 36.7823,
      isDefault: true,
    },
  });
}

// ── Booking fixtures ────────────────────────────────────────────────────

export async function createTestBooking(overrides: {
  clientId: string;
  cleanerId?: string;
  serviceId: string;
  addressId: string;
  status?: string;
  totalAmount?: number;
  platformFee?: number;
  cleanerEarnings?: number;
}) {
  const count = await prisma.booking.count();
  return prisma.booking.create({
    data: {
      bookingRef: generateBookingRef(count + 1),
      clientId: overrides.clientId,
      cleanerId: overrides.cleanerId,
      serviceId: overrides.serviceId,
      addressId: overrides.addressId,
      mode: 'AUTO_ASSIGN',
      status: (overrides.status as 'PENDING') ?? 'PENDING',
      bookingType: 'ONE_OFF',
      scheduledAt: new Date(Date.now() + 24 * 3_600_000), // tomorrow
      estimatedDuration: 180,
      baseAmount: overrides.totalAmount ?? 120000,
      platformFee: overrides.platformFee ?? 18000,
      totalAmount: overrides.totalAmount ?? 120000,
      cleanerEarnings: overrides.cleanerEarnings ?? 102000,
    },
    include: {
      client: true,
      cleaner: true,
      service: true,
      address: true,
    },
  });
}

// ── Payment fixtures ────────────────────────────────────────────────────

export async function createTestPayment(overrides: {
  bookingId: string;
  payerId: string;
  status?: string;
  method?: string;
  amount?: number;
  mpesaCheckoutId?: string;
  mpesaReceiptNumber?: string;
}) {
  return prisma.payment.create({
    data: {
      bookingId: overrides.bookingId,
      payerId: overrides.payerId,
      method: (overrides.method as 'MPESA') ?? 'MPESA',
      status: (overrides.status as 'PENDING') ?? 'PENDING',
      amount: overrides.amount ?? 120000,
      currency: 'KES',
      mpesaPhone: '+254712345678',
      mpesaCheckoutId: overrides.mpesaCheckoutId ?? `ws_CO_test_${Date.now()}`,
      mpesaReceiptNumber: overrides.mpesaReceiptNumber,
    },
  });
}

// ── OTP fixtures ────────────────────────────────────────────────────────

export async function createTestOtp(phone: string, code = '123456') {
  const codeHash = await bcrypt.hash(code, 8);
  return prisma.oTPToken.create({
    data: {
      phone,
      codeHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + 10 * 60_000),
    },
  });
}

// ── Cleanup ─────────────────────────────────────────────────────────────

export async function cleanupTestData() {
  // Delete in dependency order
  await prisma.chatMessage.deleteMany({});
  await prisma.dispute.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.walletTransaction.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.bid.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.payout.deleteMany({});
  await prisma.cleanerService.deleteMany({});
  await prisma.availabilitySlot.deleteMany({});
  await prisma.verificationDocument.deleteMany({});
  await prisma.cleanerProfile.deleteMany({});
  await prisma.clientProfile.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.oTPToken.deleteMany({});
  await prisma.adminAction.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.user.deleteMany({});
}

export { prisma };
