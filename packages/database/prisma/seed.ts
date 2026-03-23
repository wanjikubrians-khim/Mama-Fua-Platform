// Mama Fua — Database Seed
// KhimTech | 2026

import { PrismaClient, ServiceCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Mama Fua database...');

  // ── SERVICES ──────────────────────────────────────────────────────────────
  const services = await Promise.all([
    prisma.service.upsert({
      where: { name: 'Home Cleaning' },
      update: {},
      create: {
        category: ServiceCategory.HOME_CLEANING,
        name: 'Home Cleaning',
        nameSwahili: 'Kusafisha Nyumba',
        description: 'General residential cleaning including bedrooms, kitchen, living room, and bathrooms.',
        basePrice: 120000,   // KES 1,200
        maxPrice: 400000,    // KES 4,000
        durationMinutes: 180,
        sortOrder: 1,
      },
    }),
    prisma.service.upsert({
      where: { name: 'Laundry (Mama Fua)' },
      update: {},
      create: {
        category: ServiceCategory.LAUNDRY,
        name: 'Laundry (Mama Fua)',
        nameSwahili: 'Kufua Nguo',
        description: 'Hand washing, machine washing, ironing, and folding of clothes.',
        basePrice: 50000,    // KES 500
        maxPrice: 200000,    // KES 2,000
        durationMinutes: 120,
        sortOrder: 2,
      },
    }),
    prisma.service.upsert({
      where: { name: 'Office Cleaning' },
      update: {},
      create: {
        category: ServiceCategory.OFFICE_CLEANING,
        name: 'Office Cleaning',
        nameSwahili: 'Kusafisha Ofisi',
        description: 'Commercial cleaning for offices and small business premises up to 50 sqm.',
        basePrice: 200000,   // KES 2,000
        maxPrice: 800000,    // KES 8,000
        durationMinutes: 240,
        sortOrder: 3,
      },
    }),
    prisma.service.upsert({
      where: { name: 'Post-Construction Cleaning' },
      update: {},
      create: {
        category: ServiceCategory.POST_CONSTRUCTION,
        name: 'Post-Construction Cleaning',
        nameSwahili: 'Kusafisha Baada ya Ujenzi',
        description: 'Deep cleaning after renovation or construction work. Removal of debris, dust, and construction residue.',
        basePrice: 500000,   // KES 5,000
        maxPrice: 2000000,   // KES 20,000
        durationMinutes: 480,
        sortOrder: 4,
      },
    }),
    prisma.service.upsert({
      where: { name: 'Deep Cleaning' },
      update: {},
      create: {
        category: ServiceCategory.DEEP_CLEANING,
        name: 'Deep Cleaning',
        nameSwahili: 'Kusafisha kwa Kina',
        description: 'Intensive cleaning including carpets, windows, upholstery, and hard-to-reach areas.',
        basePrice: 350000,   // KES 3,500
        maxPrice: 1500000,   // KES 15,000
        durationMinutes: 360,
        sortOrder: 5,
      },
    }),
  ]);

  console.log(`✅ Seeded ${services.length} services`);

  // ── TEST ADMIN ─────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { phone: '+254700000001' },
    update: {},
    create: {
      phone: '+254700000001',
      email: 'admin@mamafua.co.ke',
      firstName: 'Brian',
      lastName: 'Wanjiku',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Seeded admin: ${admin.firstName} ${admin.lastName}`);

  // ── TEST CLIENT ────────────────────────────────────────────────────────────
  const client = await prisma.user.upsert({
    where: { phone: '+254700000002' },
    update: {},
    create: {
      phone: '+254700000002',
      email: 'client@test.com',
      firstName: 'Test',
      lastName: 'Client',
      role: 'CLIENT',
      status: 'ACTIVE',
      clientProfile: {
        create: {},
      },
    },
  });

  // Client address
  await prisma.address.upsert({
    where: { id: 'seed-address-001' },
    update: {},
    create: {
      id: 'seed-address-001',
      userId: client.id,
      label: 'Home',
      addressLine1: 'Kilimani Road',
      area: 'Kilimani',
      city: 'Nairobi',
      county: 'Nairobi',
      lat: -1.2921,
      lng: 36.7823,
      isDefault: true,
    },
  });

  console.log(`✅ Seeded test client: ${client.firstName} ${client.lastName}`);

  // ── TEST CLEANER ───────────────────────────────────────────────────────────
  const cleaner = await prisma.user.upsert({
    where: { phone: '+254700000003' },
    update: {},
    create: {
      phone: '+254700000003',
      email: 'cleaner@test.com',
      firstName: 'Grace',
      lastName: 'Muthoni',
      role: 'CLEANER',
      status: 'ACTIVE',
      cleanerProfile: {
        create: {
          bio: 'Experienced home cleaner with 5 years in Nairobi. I specialise in deep cleaning and laundry.',
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
          rating: 4.8,
          totalReviews: 42,
          totalJobs: 58,
          serviceAreaLat: -1.2921,
          serviceAreaLng: 36.8219,
          serviceAreaRadius: 10,
          isAvailable: true,
          mpesaPhone: '+254700000003',
        },
      },
    },
  });

  // Cleaner services
  const cleanerProfile = await prisma.cleanerProfile.findUnique({
    where: { userId: cleaner.id },
  });

  if (cleanerProfile) {
    const homeCleaning = services.find((s) => s.name === 'Home Cleaning');
    const laundry = services.find((s) => s.name === 'Laundry (Mama Fua)');

    if (homeCleaning) {
      await prisma.cleanerService.upsert({
        where: { cleanerId_serviceId: { cleanerId: cleanerProfile.id, serviceId: homeCleaning.id } },
        update: {},
        create: { cleanerId: cleanerProfile.id, serviceId: homeCleaning.id, customPrice: 150000 },
      });
    }
    if (laundry) {
      await prisma.cleanerService.upsert({
        where: { cleanerId_serviceId: { cleanerId: cleanerProfile.id, serviceId: laundry.id } },
        update: {},
        create: { cleanerId: cleanerProfile.id, serviceId: laundry.id, customPrice: 60000 },
      });
    }

    // Availability: Mon–Sat 8am–6pm
    for (let day = 1; day <= 6; day++) {
      await prisma.availabilitySlot.upsert({
        where: { id: `seed-slot-${cleaner.id}-${day}` },
        update: {},
        create: {
          id: `seed-slot-${cleaner.id}-${day}`,
          cleanerId: cleanerProfile.id,
          dayOfWeek: day,
          startTime: '08:00',
          endTime: '18:00',
          isRecurring: true,
        },
      });
    }
  }

  console.log(`✅ Seeded test cleaner: ${cleaner.firstName} ${cleaner.lastName}`);
  console.log('\n🎉 Seed complete! Test credentials:');
  console.log('   Admin:   +254700000001');
  console.log('   Client:  +254700000002');
  console.log('   Cleaner: +254700000003');
  console.log('   OTP for all: 123456 (dev only)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
