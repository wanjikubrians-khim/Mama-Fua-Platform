import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '@mama-fua/database';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

const UNRESOLVED_DISPUTE_STATUSES = ['OPEN', 'UNDER_REVIEW', 'ESCALATED'] as const;
const PENDING_VERIFICATION_STATUSES = ['PENDING', 'UNDER_REVIEW'] as const;
const AUTO_APPROVE_PAYOUT_THRESHOLD = 500000; // KES 5,000 stored in cents

const startOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const addDays = (date: Date, days: number) => {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
};

const startOfMonth = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);

const hoursSince = (date?: Date | null) => {
  if (!date) return null;
  const diff = Date.now() - new Date(date).getTime();
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60)));
};

const inferDisputeSeverity = (reason: string, description: string) => {
  const text = `${reason} ${description}`.toLowerCase();

  if (/(theft|assault|violence|harassment|safety)/.test(text)) {
    return { severity: 'CRITICAL', resolutionTarget: '4 hours' };
  }

  if (/(no[- ]?show|safety|unsafe)/.test(text)) {
    return { severity: 'HIGH', resolutionTarget: '24 hours' };
  }

  return { severity: 'STANDARD', resolutionTarget: '72 hours' };
};

type BookingStatusCountRow = {
  status: string;
  _count: { _all: number };
};

type RecentBookingRow = {
  id: string;
  bookingRef: string;
  service: { name: string; category: string };
  address: { area: string };
  client: { firstName: string; lastName: string };
  cleaner: { firstName: string; lastName: string } | null;
  status: string;
  scheduledAt: Date;
  totalAmount: number;
};

type DisputeQueueRow = {
  id: string;
  status: string;
  reason: string;
  description: string;
  createdAt: Date;
  raisedBy: { firstName: string; lastName: string };
  booking: {
    bookingRef: string;
    service: { name: string };
    client: { firstName: string; lastName: string };
    cleaner: { firstName: string; lastName: string } | null;
  };
};

type VerificationQueueRow = {
  id: string;
  status: string;
  submittedAt: Date;
  rejectionReason: string | null;
  cleaner: {
    userId: string;
    nationalIdNumber: string | null;
    user: { firstName: string; lastName: string };
  };
};

type PayoutQueueRow = {
  id: string;
  amount: number;
  method: string;
  createdAt: Date;
  status: string;
  cleaner: {
    walletBalance: number;
    user: { firstName: string; lastName: string };
  };
};

router.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const todayStart = startOfDay();
    const tomorrowStart = addDays(todayStart, 1);
    const monthStart = startOfMonth();
    const nextMonthStart = addMonths(monthStart, 1);
    const previousMonthStart = addMonths(monthStart, -1);

    const [
      totalUsers,
      activeJobs,
      openDisputes,
      pendingPayouts,
      pendingPayoutAmount,
      pendingVerification,
      clientRegistrationsToday,
      cleanerRegistrationsToday,
      bookingsToday,
      confirmedToday,
      confirmedMonth,
      confirmedPreviousMonth,
      recentBookings,
      disputeQueue,
      verificationQueue,
      payoutQueue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.dispute.count({ where: { status: { in: [...UNRESOLVED_DISPUTE_STATUSES] } } }),
      prisma.payout.count({ where: { status: 'PENDING' } }),
      prisma.payout.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
      }),
      prisma.cleanerProfile.count({
        where: { verificationStatus: { in: [...PENDING_VERIFICATION_STATUSES] } },
      }),
      prisma.user.count({
        where: {
          role: 'CLIENT',
          createdAt: { gte: todayStart, lt: tomorrowStart },
        },
      }),
      prisma.user.count({
        where: {
          role: 'CLEANER',
          createdAt: { gte: todayStart, lt: tomorrowStart },
        },
      }),
      prisma.booking.groupBy({
        by: ['status'],
        where: { scheduledAt: { gte: todayStart, lt: tomorrowStart } },
        _count: { _all: true },
      }),
      prisma.booking.aggregate({
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: todayStart, lt: tomorrowStart },
        },
        _sum: { totalAmount: true, platformFee: true },
      }),
      prisma.booking.aggregate({
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: monthStart, lt: nextMonthStart },
        },
        _sum: { totalAmount: true, platformFee: true },
      }),
      prisma.booking.aggregate({
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: previousMonthStart, lt: monthStart },
        },
        _sum: { totalAmount: true, platformFee: true },
      }),
      prisma.booking.findMany({
        orderBy: { scheduledAt: 'desc' },
        take: 6,
        include: {
          service: { select: { name: true, category: true } },
          address: { select: { area: true } },
          client: { select: { firstName: true, lastName: true } },
          cleaner: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.dispute.findMany({
        where: { status: { in: [...UNRESOLVED_DISPUTE_STATUSES] } },
        orderBy: { createdAt: 'asc' },
        take: 5,
        include: {
          booking: {
            select: {
              bookingRef: true,
              service: { select: { name: true } },
              client: { select: { firstName: true, lastName: true } },
              cleaner: { select: { firstName: true, lastName: true } },
            },
          },
          raisedBy: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.verificationDocument.findMany({
        where: { status: { in: [...PENDING_VERIFICATION_STATUSES] } },
        orderBy: { submittedAt: 'asc' },
        take: 5,
        include: {
          cleaner: {
            select: {
              userId: true,
              nationalIdNumber: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.payout.findMany({
        where: {
          status: 'PENDING',
          amount: { gte: AUTO_APPROVE_PAYOUT_THRESHOLD },
        },
        orderBy: { createdAt: 'asc' },
        take: 5,
        include: {
          cleaner: {
            select: {
              walletBalance: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
    ]);

    const bookingStatusCounts = (bookingsToday as BookingStatusCountRow[]).reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = item._count._all;
      return acc;
    }, {});

    const oldestOpenDisputeHours = hoursSince(disputeQueue[0]?.createdAt);
    const oldestVerificationHours = hoursSince(verificationQueue[0]?.submittedAt);
    const monthGmv = confirmedMonth._sum.totalAmount ?? 0;
    const monthRevenue = confirmedMonth._sum.platformFee ?? 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        activeJobs,
        openDisputes,
        pendingPayouts,
        pendingPayoutAmount: pendingPayoutAmount._sum.amount ?? 0,
        overview: {
          totalUsers,
          activeJobs,
          openDisputes,
          pendingPayouts,
          bookingsToday: {
            total: (bookingsToday as BookingStatusCountRow[]).reduce((sum: number, item: BookingStatusCountRow) => sum + item._count._all, 0),
            completed: bookingStatusCounts['COMPLETED'] ?? 0,
            cancelled: bookingStatusCounts['CANCELLED'] ?? 0,
            disputed: bookingStatusCounts['DISPUTED'] ?? 0,
            inProgress: bookingStatusCounts['IN_PROGRESS'] ?? 0,
          },
          finance: {
            gmvToday: confirmedToday._sum.totalAmount ?? 0,
            revenueToday: confirmedToday._sum.platformFee ?? 0,
            gmvMonth: monthGmv,
            revenueMonth: monthRevenue,
            gmvPreviousMonth: confirmedPreviousMonth._sum.totalAmount ?? 0,
            revenuePreviousMonth: confirmedPreviousMonth._sum.platformFee ?? 0,
            takeRate: monthGmv > 0 ? Number(((monthRevenue / monthGmv) * 100).toFixed(1)) : 0,
          },
          registrationsToday: {
            clients: clientRegistrationsToday,
            cleaners: cleanerRegistrationsToday,
          },
          pendingVerification,
          oldestOpenDisputeHours,
          oldestVerificationHours,
        },
        queues: {
          recentBookings: (recentBookings as RecentBookingRow[]).map((booking) => ({
            id: booking.id,
            bookingRef: booking.bookingRef,
            serviceName: booking.service.name,
            serviceCategory: booking.service.category,
            area: booking.address.area,
            status: booking.status,
            scheduledAt: booking.scheduledAt,
            totalAmount: booking.totalAmount,
            clientName: `${booking.client.firstName} ${booking.client.lastName}`.trim(),
            cleanerName: booking.cleaner
              ? `${booking.cleaner.firstName} ${booking.cleaner.lastName}`.trim()
              : null,
          })),
          disputes: (disputeQueue as DisputeQueueRow[]).map((dispute) => ({
            id: dispute.id,
            bookingRef: dispute.booking.bookingRef,
            serviceName: dispute.booking.service.name,
            status: dispute.status,
            reason: dispute.reason,
            raisedBy: `${dispute.raisedBy.firstName} ${dispute.raisedBy.lastName}`.trim(),
            clientName: `${dispute.booking.client.firstName} ${dispute.booking.client.lastName}`.trim(),
            cleanerName: dispute.booking.cleaner
              ? `${dispute.booking.cleaner.firstName} ${dispute.booking.cleaner.lastName}`.trim()
              : null,
            createdAt: dispute.createdAt,
            ...inferDisputeSeverity(dispute.reason, dispute.description),
          })),
          verification: (verificationQueue as VerificationQueueRow[]).map((record) => ({
            id: record.id,
            userId: record.cleaner.userId,
            cleanerName: `${record.cleaner.user.firstName} ${record.cleaner.user.lastName}`.trim(),
            status: record.status,
            submittedAt: record.submittedAt,
            idNumber: record.cleaner.nationalIdNumber,
            rejectionReason: record.rejectionReason,
          })),
          payouts: (payoutQueue as PayoutQueueRow[]).map((payout) => ({
            id: payout.id,
            cleanerName: `${payout.cleaner.user.firstName} ${payout.cleaner.user.lastName}`.trim(),
            amount: payout.amount,
            method: payout.method,
            requestedAt: payout.createdAt,
            walletBalance: payout.cleaner.walletBalance,
            status: payout.status,
          })),
        },
        rules: {
          payoutManualReviewThreshold: AUTO_APPROVE_PAYOUT_THRESHOLD,
          verificationSlaHours: 48,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, status, page = '1', pageSize = '20' } = req.query as Record<string, string>;
    const where: Record<string, string> = {};
    if (role) where['role'] = role;
    if (status) where['status'] = status;
    const users = await prisma.user.findMany({
      where,
      skip: (parseInt(page) - 1) * parseInt(pageSize),
      take: parseInt(pageSize),
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

router.get('/disputes', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const disputes = await prisma.dispute.findMany({
      where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } },
      include: {
        booking: true,
        raisedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: disputes });
  } catch (err) {
    next(err);
  }
});

router.patch('/cleaners/:userId/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, rejectionReason } = req.body;
    const profile = await prisma.cleanerProfile.update({
      where: { userId: req.params['userId'] },
      data: {
        verificationStatus: status,
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
        verifiedById: req.user!.sub,
      },
    });
    await prisma.adminAction.create({
      data: {
        adminId: req.user!.sub,
        action: `CLEANER_${status}`,
        targetType: 'user',
        targetId: req.params['userId']!,
        notes: rejectionReason,
      },
    });
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

export default router;
