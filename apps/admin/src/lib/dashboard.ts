export interface DashboardBookingSummary {
  id: string;
  bookingRef: string;
  serviceName: string;
  serviceCategory: string;
  area: string;
  status: string;
  scheduledAt: string;
  totalAmount: number;
  clientName: string;
  cleanerName: string | null;
}

export interface DashboardDisputeSummary {
  id: string;
  bookingRef: string;
  serviceName: string;
  status: string;
  reason: string;
  raisedBy: string;
  clientName: string;
  cleanerName: string | null;
  createdAt: string;
  severity: 'STANDARD' | 'HIGH' | 'CRITICAL';
  resolutionTarget: string;
}

export interface DashboardVerificationSummary {
  id: string;
  userId: string;
  cleanerName: string;
  status: string;
  submittedAt: string;
  idNumber: string | null;
  rejectionReason: string | null;
}

export interface DashboardPayoutSummary {
  id: string;
  cleanerName: string;
  amount: number;
  method: string;
  requestedAt: string;
  walletBalance: number;
  status: string;
}

export interface AdminDashboardData {
  totalUsers: number;
  activeJobs: number;
  openDisputes: number;
  pendingPayouts: number;
  pendingPayoutAmount: number;
  overview: {
    totalUsers: number;
    activeJobs: number;
    openDisputes: number;
    pendingPayouts: number;
    bookingsToday: {
      total: number;
      completed: number;
      cancelled: number;
      disputed: number;
      inProgress: number;
    };
    finance: {
      gmvToday: number;
      revenueToday: number;
      gmvMonth: number;
      revenueMonth: number;
      gmvPreviousMonth: number;
      revenuePreviousMonth: number;
      takeRate: number;
    };
    registrationsToday: {
      clients: number;
      cleaners: number;
    };
    pendingVerification: number;
    oldestOpenDisputeHours: number | null;
    oldestVerificationHours: number | null;
  };
  queues: {
    recentBookings: DashboardBookingSummary[];
    disputes: DashboardDisputeSummary[];
    verification: DashboardVerificationSummary[];
    payouts: DashboardPayoutSummary[];
  };
  rules: {
    payoutManualReviewThreshold: number;
    verificationSlaHours: number;
  };
}

export const dashboardFallback: AdminDashboardData = {
  totalUsers: 1284,
  activeJobs: 37,
  openDisputes: 6,
  pendingPayouts: 14,
  pendingPayoutAmount: 2875000,
  overview: {
    totalUsers: 1284,
    activeJobs: 37,
    openDisputes: 6,
    pendingPayouts: 14,
    bookingsToday: {
      total: 96,
      completed: 58,
      cancelled: 8,
      disputed: 6,
      inProgress: 24,
    },
    finance: {
      gmvToday: 1984000,
      revenueToday: 317400,
      gmvMonth: 43120000,
      revenueMonth: 6899200,
      gmvPreviousMonth: 39860000,
      revenuePreviousMonth: 6294000,
      takeRate: 16.0,
    },
    registrationsToday: {
      clients: 19,
      cleaners: 7,
    },
    pendingVerification: 11,
    oldestOpenDisputeHours: 19,
    oldestVerificationHours: 43,
  },
  queues: {
    recentBookings: [
      {
        id: 'fallback-booking-1',
        bookingRef: 'MF-3108',
        serviceName: 'Deep Cleaning',
        serviceCategory: 'DEEP_CLEANING',
        area: 'Kilimani',
        status: 'IN_PROGRESS',
        scheduledAt: '2026-03-27T09:00:00.000Z',
        totalAmount: 420000,
        clientName: 'Ann Wambui',
        cleanerName: 'Grace Muthoni',
      },
      {
        id: 'fallback-booking-2',
        bookingRef: 'MF-3107',
        serviceName: 'Home Cleaning',
        serviceCategory: 'HOME_CLEANING',
        area: 'Westlands',
        status: 'COMPLETED',
        scheduledAt: '2026-03-27T08:30:00.000Z',
        totalAmount: 185000,
        clientName: 'Peter Kariuki',
        cleanerName: 'Mercy Achieng',
      },
      {
        id: 'fallback-booking-3',
        bookingRef: 'MF-3105',
        serviceName: 'Laundry (Mama Fua)',
        serviceCategory: 'LAUNDRY',
        area: 'South B',
        status: 'DISPUTED',
        scheduledAt: '2026-03-27T07:45:00.000Z',
        totalAmount: 96000,
        clientName: 'Faith Njeri',
        cleanerName: 'Lucy Wairimu',
      },
      {
        id: 'fallback-booking-4',
        bookingRef: 'MF-3098',
        serviceName: 'Office Cleaning',
        serviceCategory: 'OFFICE_CLEANING',
        area: 'Upper Hill',
        status: 'ACCEPTED',
        scheduledAt: '2026-03-27T13:00:00.000Z',
        totalAmount: 560000,
        clientName: 'Apex Office Hub',
        cleanerName: 'John Mwangi',
      },
      {
        id: 'fallback-booking-5',
        bookingRef: 'MF-3093',
        serviceName: 'Home Cleaning',
        serviceCategory: 'HOME_CLEANING',
        area: 'Kasarani',
        status: 'CANCELLED',
        scheduledAt: '2026-03-27T10:00:00.000Z',
        totalAmount: 175000,
        clientName: 'Sharon Atieno',
        cleanerName: null,
      },
      {
        id: 'fallback-booking-6',
        bookingRef: 'MF-3087',
        serviceName: 'Post-Construction Cleaning',
        serviceCategory: 'POST_CONSTRUCTION',
        area: 'Runda',
        status: 'PENDING',
        scheduledAt: '2026-03-28T06:30:00.000Z',
        totalAmount: 1250000,
        clientName: 'Ndungu Holdings',
        cleanerName: null,
      },
    ],
    disputes: [
      {
        id: 'fallback-dispute-1',
        bookingRef: 'MF-3105',
        serviceName: 'Laundry (Mama Fua)',
        status: 'UNDER_REVIEW',
        reason: 'No-show and garment damage',
        raisedBy: 'Faith Njeri',
        clientName: 'Faith Njeri',
        cleanerName: 'Lucy Wairimu',
        createdAt: '2026-03-26T12:10:00.000Z',
        severity: 'HIGH',
        resolutionTarget: '24 hours',
      },
      {
        id: 'fallback-dispute-2',
        bookingRef: 'MF-3079',
        serviceName: 'Home Cleaning',
        status: 'OPEN',
        reason: 'Quality complaint',
        raisedBy: 'Kevin Musyoka',
        clientName: 'Kevin Musyoka',
        cleanerName: 'Grace Muthoni',
        createdAt: '2026-03-26T20:15:00.000Z',
        severity: 'STANDARD',
        resolutionTarget: '72 hours',
      },
      {
        id: 'fallback-dispute-3',
        bookingRef: 'MF-3068',
        serviceName: 'Office Cleaning',
        status: 'ESCALATED',
        reason: 'Safety concern reported on site',
        raisedBy: 'Apex Office Hub',
        clientName: 'Apex Office Hub',
        cleanerName: 'John Mwangi',
        createdAt: '2026-03-27T03:40:00.000Z',
        severity: 'CRITICAL',
        resolutionTarget: '4 hours',
      },
    ],
    verification: [
      {
        id: 'fallback-verification-1',
        userId: 'cleaner-001',
        cleanerName: 'Joy Mutheu',
        status: 'PENDING',
        submittedAt: '2026-03-25T07:15:00.000Z',
        idNumber: '29876543',
        rejectionReason: null,
      },
      {
        id: 'fallback-verification-2',
        userId: 'cleaner-002',
        cleanerName: 'Esther Anyango',
        status: 'UNDER_REVIEW',
        submittedAt: '2026-03-26T05:05:00.000Z',
        idNumber: '31240987',
        rejectionReason: null,
      },
      {
        id: 'fallback-verification-3',
        userId: 'cleaner-003',
        cleanerName: 'Naomi Wairimu',
        status: 'PENDING',
        submittedAt: '2026-03-26T15:40:00.000Z',
        idNumber: '30115624',
        rejectionReason: null,
      },
    ],
    payouts: [
      {
        id: 'fallback-payout-1',
        cleanerName: 'Grace Muthoni',
        amount: 680000,
        method: 'MPESA',
        requestedAt: '2026-03-27T06:20:00.000Z',
        walletBalance: 1120000,
        status: 'PENDING',
      },
      {
        id: 'fallback-payout-2',
        cleanerName: 'John Mwangi',
        amount: 950000,
        method: 'MPESA',
        requestedAt: '2026-03-27T07:05:00.000Z',
        walletBalance: 1435000,
        status: 'PENDING',
      },
      {
        id: 'fallback-payout-3',
        cleanerName: 'Mercy Achieng',
        amount: 530000,
        method: 'MPESA',
        requestedAt: '2026-03-27T08:12:00.000Z',
        walletBalance: 860000,
        status: 'PENDING',
      },
    ],
  },
  rules: {
    payoutManualReviewThreshold: 500000,
    verificationSlaHours: 48,
  },
};
