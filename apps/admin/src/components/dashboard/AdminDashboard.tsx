'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Download,
  FileDown,
  LayoutDashboard,
  LockKeyhole,
  MapPinned,
  ShieldCheck,
  Sparkles,
  Users2,
  Wallet,
  XCircle,
} from 'lucide-react';
import { fetchAdminDashboard } from '../../lib/api';
import type {
  AdminDashboardData,
  DashboardBookingSummary,
  DashboardDisputeSummary,
  DashboardPayoutSummary,
  DashboardVerificationSummary,
} from '../../lib/dashboard';
import { dashboardFallback } from '../../lib/dashboard';

const permissionRows = [
  ['View all users', 'Yes', 'Yes'],
  ['Suspend / ban users', 'Yes', 'Yes'],
  ['Approve / reject cleaner verification', 'Yes', 'Yes'],
  ['Resolve disputes', 'Yes', 'Yes'],
  ['Approve payouts', 'Yes', 'Yes'],
  ['View financial reports', 'Yes', 'Yes'],
  ['Manage service categories', 'No', 'Yes'],
  ['Change commission rates', 'No', 'Yes'],
  ['Create / remove admin accounts', 'No', 'Yes'],
  ['View audit log', 'Read only', 'Full access'],
  ['System configuration', 'No', 'Yes'],
  ['Export raw data', 'No', 'Yes'],
];

const analyticsRows = [
  ['GMV', 'SUM(bookings.totalAmount) WHERE status = CONFIRMED', 'Real-time'],
  ['Revenue', 'SUM(bookings.platformFee) WHERE status = CONFIRMED', 'Real-time'],
  ['Take rate', 'Revenue / GMV * 100', 'Real-time'],
  ['Bookings count', 'COUNT(bookings) by status', 'Real-time'],
  ['Avg booking value', 'GMV / confirmed bookings count', 'Daily'],
  ['Cleaner utilisation', 'Booked hours / available hours per cleaner', 'Daily'],
  ['Client retention', '% of clients with 2+ bookings in 30 days', 'Weekly'],
  ['Avg rating', 'AVG(reviews.rating) platform-wide', 'Real-time'],
  ['Time to match', 'AVG(bookings.acceptedAt - bookings.createdAt)', 'Daily'],
  ['Dispute rate', 'Disputed bookings / total completed bookings', 'Daily'],
];

const geoAndCohortSignals = [
  'Heatmap of booking density by Nairobi sub-county and estate.',
  'Coverage gap analysis for high demand zones with low cleaner supply.',
  'Average cleaner travel time by area to spot local recruitment gaps.',
  'Weekly cohort retention for first-book week versus week-four activity.',
  'Cleaner earnings growth after 3, 6, and 12 months on the platform.',
  'Service mix movement to see which categories are accelerating fastest.',
];

const exportCards = [
  {
    title: 'Transaction report',
    body: 'Payments by date range with booking ref, method, amount, and status.',
  },
  {
    title: 'Payout report',
    body: 'Disbursement ledger with date, method, amount, and M-Pesa receipt.',
  },
  {
    title: 'Tax report',
    body: 'Cleaner earnings rollup for KRA compliance above KES 100,000/year.',
  },
  {
    title: 'Dispute report',
    body: 'Disputes with outcomes, notes, and refund amounts for audit review.',
  },
];

const securitySignals = [
  'Separate admin Next.js deployment from client and cleaner apps',
  'Whitelisted IP access required before sign-in',
  'Two-factor authentication enforced for every admin account',
  'Audit trail expected for verification, disputes, payouts, and overrides',
];

function formatKes(amount: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

function formatCompact(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: value > 999 ? 1 : 0,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatMethod(value: string) {
  if (value === 'MPESA') return 'M-Pesa';
  return formatStatus(value);
}

function getDelta(current: number, previous: number) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

function getAgeInHours(date: string) {
  return Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60)));
}

function getSeverityTone(severity: DashboardDisputeSummary['severity']) {
  if (severity === 'CRITICAL') return 'admin-badge-danger';
  if (severity === 'HIGH') return 'admin-badge-warning';
  return 'admin-badge-brand';
}

function getStatusTone(status: string) {
  if (['VERIFIED', 'COMPLETED', 'CONFIRMED', 'ACTIVE'].includes(status)) return 'admin-badge-success';
  if (['OPEN', 'UNDER_REVIEW', 'PENDING', 'PROCESSING', 'IN_PROGRESS', 'ACCEPTED'].includes(status)) {
    return 'admin-badge-warning';
  }
  if (['REJECTED', 'ESCALATED', 'FAILED', 'DISPUTED', 'CANCELLED', 'BANNED', 'SUSPENDED'].includes(status)) {
    return 'admin-badge-danger';
  }
  return 'admin-badge-brand';
}

function DeltaPill({ current, previous }: { current: number; previous: number }) {
  const delta = getDelta(current, previous);

  if (delta === null) {
    return <span className="text-xs text-slate-500">No prior baseline</span>;
  }

  const positive = delta >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        positive ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(delta).toFixed(1)}% vs prior period
    </span>
  );
}

function QueueEmpty({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
      <p className="font-semibold text-slate-200">{title}</p>
      <p className="mt-1">{body}</p>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  tone = 'brand',
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  note: string;
  tone?: 'brand' | 'success' | 'warning' | 'danger';
}) {
  const toneClasses = {
    brand: 'bg-cyan-400/12 text-cyan-200 ring-cyan-300/20',
    success: 'bg-emerald-400/12 text-emerald-200 ring-emerald-300/20',
    warning: 'bg-amber-400/12 text-amber-100 ring-amber-300/20',
    danger: 'bg-rose-400/12 text-rose-100 ring-rose-300/20',
  };

  return (
    <div className="admin-card p-5 animate-float-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ring-1 ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-400">{note}</p>
    </div>
  );
}

function SidebarLink({ href, icon: Icon, label }: { href: string; icon: typeof Activity; label: string }) {
  return (
    <a
      href={href}
      className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-slate-300 transition hover:border-white/10 hover:bg-white/[0.08] hover:text-white"
    >
      <span className="flex items-center gap-3">
        <Icon className="h-[18px] w-[18px] text-cyan-200" />
        {label}
      </span>
      <ChevronRight className="h-4 w-4 opacity-50 transition group-hover:translate-x-0.5" />
    </a>
  );
}

function BookingRow({ booking }: { booking: DashboardBookingSummary }) {
  return (
    <div className="grid gap-3 rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4 md:grid-cols-[1.1fr_1fr_auto_auto] md:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-white">{booking.bookingRef}</p>
          <span className={`admin-badge ${getStatusTone(booking.status)}`}>{formatStatus(booking.status)}</span>
        </div>
        <p className="mt-1 text-sm text-slate-300">{booking.serviceName}</p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{booking.serviceCategory.replace(/_/g, ' ')}</p>
      </div>
      <div className="text-sm text-slate-300">
        <p>{booking.area}</p>
        <p className="mt-1 text-slate-500">
          {booking.clientName}
          {booking.cleanerName ? ` -> ${booking.cleanerName}` : ' -> Awaiting cleaner'}
        </p>
      </div>
      <div className="text-sm text-slate-400">
        <p>{format(new Date(booking.scheduledAt), 'MMM d')}</p>
        <p>{format(new Date(booking.scheduledAt), 'HH:mm')}</p>
      </div>
      <div className="text-right text-sm font-semibold text-white">{formatKes(booking.totalAmount)}</div>
    </div>
  );
}

function VerificationRow({
  item,
  verificationSlaHours,
}: {
  item: DashboardVerificationSummary;
  verificationSlaHours: number;
}) {
  const age = getAgeInHours(item.submittedAt);
  const overdue = age >= verificationSlaHours;

  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-white">{item.cleanerName}</p>
            <span className={`admin-badge ${getStatusTone(item.status)}`}>{formatStatus(item.status)}</span>
            {overdue && <span className="admin-badge admin-badge-danger">Over SLA</span>}
          </div>
          <p className="mt-2 text-sm text-slate-300">
            ID: {item.idNumber ?? 'Awaiting capture'} · Submitted {format(new Date(item.submittedAt), 'MMM d, HH:mm')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Queue age</p>
          <p className={`mt-2 text-lg font-semibold ${overdue ? 'text-rose-200' : 'text-cyan-100'}`}>{age}h</p>
        </div>
      </div>
    </div>
  );
}

function DisputeRow({ dispute }: { dispute: DashboardDisputeSummary }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-white">{dispute.bookingRef}</p>
            <span className={`admin-badge ${getSeverityTone(dispute.severity)}`}>{dispute.severity}</span>
            <span className={`admin-badge ${getStatusTone(dispute.status)}`}>{formatStatus(dispute.status)}</span>
          </div>
          <p className="text-sm text-slate-300">{dispute.reason}</p>
          <p className="text-sm text-slate-500">
            {dispute.clientName}
            {dispute.cleanerName ? ` vs ${dispute.cleanerName}` : ' vs unassigned cleaner'}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="text-slate-400">Target</p>
          <p className="font-semibold text-white">{dispute.resolutionTarget}</p>
          <p className="mt-2 text-slate-500">{format(new Date(dispute.createdAt), 'MMM d, HH:mm')}</p>
        </div>
      </div>
    </div>
  );
}

function PayoutRow({
  payout,
  threshold,
}: {
  payout: DashboardPayoutSummary;
  threshold: number;
}) {
  return (
    <div className="grid gap-3 rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4 md:grid-cols-[1fr_auto_auto] md:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-white">{payout.cleanerName}</p>
          <span className={`admin-badge ${getStatusTone(payout.status)}`}>{formatStatus(payout.status)}</span>
        </div>
        <p className="mt-2 text-sm text-slate-300">
          {formatMethod(payout.method)} · Wallet balance {formatKes(payout.walletBalance)}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
          Manual review threshold {formatKes(threshold)}
        </p>
      </div>
      <div className="text-sm text-slate-400">
        <p>{format(new Date(payout.requestedAt), 'MMM d')}</p>
        <p>{format(new Date(payout.requestedAt), 'HH:mm')}</p>
      </div>
      <div className="text-right text-sm font-semibold text-white">{formatKes(payout.amount)}</div>
    </div>
  );
}

export function AdminDashboard() {
  const { data, error, isLoading, isFetching, dataUpdatedAt } = useQuery<AdminDashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: fetchAdminDashboard,
    refetchInterval: 30_000,
  });

  const dashboard = data ?? dashboardFallback;
  const usingFallback = !data || Boolean(error);
  const monthGmvDelta = getDelta(
    dashboard.overview.finance.gmvMonth,
    dashboard.overview.finance.gmvPreviousMonth
  );
  const monthRevenueDelta = getDelta(
    dashboard.overview.finance.revenueMonth,
    dashboard.overview.finance.revenuePreviousMonth
  );
  const completedShare = dashboard.overview.bookingsToday.total
    ? (dashboard.overview.bookingsToday.completed / dashboard.overview.bookingsToday.total) * 100
    : 0;
  const cancelledShare = dashboard.overview.bookingsToday.total
    ? (dashboard.overview.bookingsToday.cancelled / dashboard.overview.bookingsToday.total) * 100
    : 0;
  const disputedShare = dashboard.overview.bookingsToday.total
    ? (dashboard.overview.bookingsToday.disputed / dashboard.overview.bookingsToday.total) * 100
    : 0;
  const verificationOverdueCount = dashboard.queues.verification.filter(
    (item) => getAgeInHours(item.submittedAt) >= dashboard.rules.verificationSlaHours
  ).length;

  return (
    <div className="admin-shell">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="admin-card h-fit p-5 lg:sticky lg:top-4">
            <div className="rounded-[28px] border border-cyan-300/14 bg-cyan-400/8 p-5">
              <p className="admin-eyebrow">Mama Fua Admin</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Operations cockpit</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                MF-DOC-007 aligned workspace for verification, disputes, payouts, analytics, and role-aware controls.
              </p>
            </div>

            <div className="mt-5 space-y-2">
              <SidebarLink href="#overview" icon={LayoutDashboard} label="Overview KPIs" />
              <SidebarLink href="#queues" icon={ClipboardList} label="Operational queues" />
              <SidebarLink href="#analytics" icon={BarChart3} label="Analytics & exports" />
              <SidebarLink href="#permissions" icon={ShieldCheck} label="Permissions & controls" />
            </div>

            <div className="admin-divider my-5" />

            <div className="space-y-3">
              <p className="admin-eyebrow">Security envelope</p>
              {securitySignals.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="admin-divider my-5" />

            <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
              <p className="admin-eyebrow">Data mode</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={`admin-badge ${usingFallback ? 'admin-badge-warning' : 'admin-badge-success'}`}>
                  {usingFallback ? 'Spec snapshot' : 'Live API'}
                </span>
                <span className="admin-badge admin-badge-brand">{isFetching ? 'Syncing' : 'Stable'}</span>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                {usingFallback
                  ? 'Showing a doc-driven operational snapshot while live admin auth or API access is unavailable.'
                  : `Last refreshed ${format(new Date(dataUpdatedAt), 'MMM d, HH:mm:ss')}.`}
              </p>
            </div>
          </aside>

          <main className="space-y-6">
            <section className="admin-card-strong relative overflow-hidden p-6 md:p-8">
              <div className="absolute left-[-120px] top-[-80px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="absolute right-[-100px] top-6 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

              <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="admin-badge admin-badge-brand">
                      <Sparkles className="h-3.5 w-3.5" />
                      MF-DOC-007 aligned
                    </span>
                    <span className="admin-badge admin-badge-success">
                      <LockKeyhole className="h-3.5 w-3.5" />
                      2FA required
                    </span>
                    <span className="admin-badge admin-badge-warning">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      IP allowlist
                    </span>
                  </div>

                  <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
                    Control platform health before small issues become operational debt.
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                    Track live bookings, protect SLAs for cleaner verification and disputes, keep payout flow moving, and export finance-ready reports from one admin surface.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Live bookings</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{formatCompact(dashboard.activeJobs)}</p>
                    <p className="mt-2 text-sm text-slate-400">Real-time count and map-ready feed</p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Verification SLA</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{dashboard.rules.verificationSlaHours}h</p>
                    <p className="mt-2 text-sm text-slate-400">{verificationOverdueCount} applications need intervention</p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Pending payout value</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{formatKes(dashboard.pendingPayoutAmount)}</p>
                    <p className="mt-2 text-sm text-slate-400">Manual review plus auto-processed batches</p>
                  </div>
                </div>
              </div>
            </section>

            {usingFallback && (
              <section className="admin-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-amber-100">Live admin data is not available in this session.</p>
                  <p className="mt-1 text-sm text-slate-400">
                    The dashboard is rendering a spec-backed snapshot so design and workflow review can continue without blocking on admin auth.
                  </p>
                </div>
                <span className="admin-badge admin-badge-warning">
                  {error ? 'API unavailable or unauthenticated' : 'Waiting for first sync'}
                </span>
              </section>
            )}

            <section id="overview" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={Users2}
                label="Total users"
                value={isLoading && !data ? '...' : formatCompact(dashboard.totalUsers)}
                note={`${dashboard.overview.registrationsToday.clients} new clients and ${dashboard.overview.registrationsToday.cleaners} new cleaners today.`}
                tone="brand"
              />
              <MetricCard
                icon={Activity}
                label="Live jobs in progress"
                value={formatCompact(dashboard.activeJobs)}
                note={`${dashboard.overview.bookingsToday.total} bookings scheduled today across active areas.`}
                tone="success"
              />
              <MetricCard
                icon={AlertTriangle}
                label="Open disputes"
                value={formatCompact(dashboard.openDisputes)}
                note={
                  dashboard.overview.oldestOpenDisputeHours
                    ? `Oldest unresolved case has been waiting ${dashboard.overview.oldestOpenDisputeHours}h.`
                    : 'No unresolved disputes right now.'
                }
                tone="danger"
              />
              <MetricCard
                icon={Wallet}
                label="Pending payouts"
                value={formatCompact(dashboard.pendingPayouts)}
                note={`${formatKes(dashboard.pendingPayoutAmount)} awaiting disbursement or review.`}
                tone="warning"
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="admin-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="admin-eyebrow">Today&apos;s operations</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Booking throughput and commercial pulse</h2>
                  </div>
                  <span className="admin-badge admin-badge-brand">
                    <Clock3 className="h-3.5 w-3.5" />
                    Auto-refresh 30s
                  </span>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-400">Bookings today</p>
                        <p className="mt-3 text-4xl font-semibold text-white">{dashboard.overview.bookingsToday.total}</p>
                      </div>
                      <div className="text-right text-sm text-slate-400">
                        <p>Completed {dashboard.overview.bookingsToday.completed}</p>
                        <p>In progress {dashboard.overview.bookingsToday.inProgress}</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                          <span>Completion rate</span>
                          <span>{formatPercent(completedShare)}</span>
                        </div>
                        <div className="h-3 rounded-full bg-white/8">
                          <div className="h-3 rounded-full bg-emerald-400" style={{ width: `${completedShare}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                          <span>Cancellation rate</span>
                          <span>{formatPercent(cancelledShare)}</span>
                        </div>
                        <div className="h-3 rounded-full bg-white/8">
                          <div className="h-3 rounded-full bg-amber-300" style={{ width: `${cancelledShare}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                          <span>Dispute share</span>
                          <span>{formatPercent(disputedShare)}</span>
                        </div>
                        <div className="h-3 rounded-full bg-white/8">
                          <div className="h-3 rounded-full bg-rose-300" style={{ width: `${disputedShare}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-slate-400">GMV</p>
                          <p className="mt-2 text-3xl font-semibold text-white">{formatKes(dashboard.overview.finance.gmvMonth)}</p>
                        </div>
                        <DeltaPill
                          current={dashboard.overview.finance.gmvMonth}
                          previous={dashboard.overview.finance.gmvPreviousMonth}
                        />
                      </div>
                      <p className="mt-3 text-sm text-slate-400">Today {formatKes(dashboard.overview.finance.gmvToday)}</p>
                    </div>

                    <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-slate-400">Revenue</p>
                          <p className="mt-2 text-3xl font-semibold text-white">{formatKes(dashboard.overview.finance.revenueMonth)}</p>
                        </div>
                        <DeltaPill
                          current={dashboard.overview.finance.revenueMonth}
                          previous={dashboard.overview.finance.revenuePreviousMonth}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                        <span>Today {formatKes(dashboard.overview.finance.revenueToday)}</span>
                        <span>Take rate {formatPercent(dashboard.overview.finance.takeRate)}</span>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
                      <p className="text-sm text-slate-400">Immediate pressure points</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white/[0.04] p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Verification</p>
                          <p className="mt-2 text-2xl font-semibold text-white">{dashboard.overview.pendingVerification}</p>
                        </div>
                        <div className="rounded-2xl bg-white/[0.04] p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Dispute oldest</p>
                          <p className="mt-2 text-2xl font-semibold text-white">
                            {dashboard.overview.oldestOpenDisputeHours ? `${dashboard.overview.oldestOpenDisputeHours}h` : '0h'}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white/[0.04] p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Manual payout queue</p>
                          <p className="mt-2 text-2xl font-semibold text-white">{dashboard.queues.payouts.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-card p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="admin-eyebrow">Coverage signals</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Geo and demand watchlist</h2>
                  </div>
                  <MapPinned className="h-5 w-5 text-cyan-200" />
                </div>

                <div className="mt-6 space-y-3">
                  {geoAndCohortSignals.slice(0, 3).map((item) => (
                    <div
                      key={item}
                      className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-slate-300"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[28px] border border-cyan-300/12 bg-cyan-400/[0.05] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">Best next drill-down</p>
                  <p className="mt-3 text-lg font-semibold text-white">Overlay booking density, travel time, and cleaner availability by estate.</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    This is the fastest way to find growth pockets where onboarding more verified cleaners unlocks more same-day fulfilment.
                  </p>
                </div>
              </div>
            </section>

            <section id="queues" className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="admin-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="admin-eyebrow">Booking management</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Recent bookings</h2>
                  </div>
                  <span className="admin-badge admin-badge-brand">
                    <ClipboardList className="h-3.5 w-3.5" />
                    Full booking visibility
                  </span>
                </div>
                <p className="mt-3 max-w-2xl text-sm text-slate-400">
                  Admins should be able to inspect booking state transitions, payment records, chat history, reassignment, cancellation, and force-complete cases that remain stuck in progress.
                </p>
                <div className="mt-6 space-y-3">
                  {dashboard.queues.recentBookings.length > 0 ? (
                    dashboard.queues.recentBookings.map((booking) => <BookingRow key={booking.id} booking={booking} />)
                  ) : (
                    <QueueEmpty
                      title="No recent bookings"
                      body="Recent booking activity will appear here once the dashboard is connected to the admin booking feed."
                    />
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="admin-card p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="admin-eyebrow">Cleaner verification</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">Verification queue</h2>
                    </div>
                    <span className={`admin-badge ${verificationOverdueCount > 0 ? 'admin-badge-danger' : 'admin-badge-success'}`}>
                      {verificationOverdueCount > 0 ? `${verificationOverdueCount} over SLA` : 'Within SLA'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">
                    New cleaner applications should be reviewed within 48 hours, oldest first, including ID front/back, selfie match, blacklist checks, and explicit rejection reasons.
                  </p>
                  <div className="mt-6 space-y-3">
                    {dashboard.queues.verification.length > 0 ? (
                      dashboard.queues.verification.map((item) => (
                        <VerificationRow
                          key={item.id}
                          item={item}
                          verificationSlaHours={dashboard.rules.verificationSlaHours}
                        />
                      ))
                    ) : (
                      <QueueEmpty
                        title="Verification queue empty"
                        body="Pending verification applications will surface here when they exist."
                      />
                    )}
                  </div>
                </div>

                <div className="admin-card p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="admin-eyebrow">Admin notes</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">What not to miss</h2>
                    </div>
                    <BadgeCheck className="h-5 w-5 text-emerald-200" />
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-300">
                      Approve sends welcome push, SMS, and email, then publishes the cleaner profile live.
                    </div>
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-300">
                      Reject requires a reason such as blurry photo, ID expired, face mismatch, blacklisted, or other.
                    </div>
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-300">
                      Bans should prevent re-registration through flagged phone numbers and device IDs.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="admin-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="admin-eyebrow">Dispute management</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Resolution queue</h2>
                  </div>
                  <span className={`admin-badge ${dashboard.openDisputes > 0 ? 'admin-badge-warning' : 'admin-badge-success'}`}>
                    {dashboard.openDisputes > 0 ? `${dashboard.openDisputes} unresolved` : 'No unresolved cases'}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  Admins need booking context, chat history, evidence, outcome notes, and the correct refund or release decision, with automatic suspension review after repeated cleaner fault.
                </p>
                <div className="mt-6 space-y-3">
                  {dashboard.queues.disputes.length > 0 ? (
                    dashboard.queues.disputes.map((dispute) => <DisputeRow key={dispute.id} dispute={dispute} />)
                  ) : (
                    <QueueEmpty
                      title="No open disputes"
                      body="Standard, high, and critical disputes will appear here with their resolution target."
                    />
                  )}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Standard</p>
                    <p className="mt-2 text-lg font-semibold text-white">72 hours</p>
                    <p className="mt-2 text-sm text-slate-400">Quality complaints and routine service issues.</p>
                  </div>
                  <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">High</p>
                    <p className="mt-2 text-lg font-semibold text-white">24 hours</p>
                    <p className="mt-2 text-sm text-slate-400">No-show and safety concerns need same-day attention.</p>
                  </div>
                  <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Critical</p>
                    <p className="mt-2 text-lg font-semibold text-white">4 hours</p>
                    <p className="mt-2 text-sm text-slate-400">Escalate theft or assault allegations to Super Admin immediately.</p>
                  </div>
                </div>
              </div>

              <div className="admin-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="admin-eyebrow">Payout management</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Manual payout review</h2>
                  </div>
                  <span className="admin-badge admin-badge-brand">
                    <Wallet className="h-3.5 w-3.5" />
                    Threshold {formatKes(dashboard.rules.payoutManualReviewThreshold)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  Auto-approved payouts below the threshold are processed out of band. This queue is for high-value withdrawals that require a human decision before disbursement.
                </p>
                <div className="mt-6 space-y-3">
                  {dashboard.queues.payouts.length > 0 ? (
                    dashboard.queues.payouts.map((payout) => (
                      <PayoutRow
                        key={payout.id}
                        payout={payout}
                        threshold={dashboard.rules.payoutManualReviewThreshold}
                      />
                    ))
                  ) : (
                    <QueueEmpty
                      title="Manual payout queue empty"
                      body="Payout requests above the manual review threshold will appear here."
                    />
                  )}
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Bulk payout windows</p>
                    <p className="mt-3 text-lg font-semibold text-white">10:00 and 16:00 daily</p>
                    <p className="mt-2 text-sm text-slate-400">Batch M-Pesa B2C and bank instructions should advance queued payouts to processing.</p>
                  </div>
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Rejection path</p>
                    <p className="mt-3 text-lg font-semibold text-white">Return funds to wallet</p>
                    <p className="mt-2 text-sm text-slate-400">Rejected payouts must restore balance and notify the cleaner with a reason.</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="analytics" className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="admin-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="admin-eyebrow">Analytics & reporting</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Platform metric contract</h2>
                  </div>
                  <span className="admin-badge admin-badge-success">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Reporting ready
                  </span>
                </div>

                <div className="mt-6 overflow-hidden rounded-[26px] border border-white/8">
                  <div className="grid grid-cols-[1fr_1.1fr_auto] gap-4 border-b border-white/8 bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    <span>Metric</span>
                    <span>Calculation</span>
                    <span>Cadence</span>
                  </div>
                  <div className="divide-y divide-white/8">
                    {analyticsRows.map(([metric, calculation, cadence]) => (
                      <div key={metric} className="grid grid-cols-[1fr_1.1fr_auto] gap-4 px-4 py-3 text-sm">
                        <span className="font-semibold text-white">{metric}</span>
                        <span className="text-slate-300">{calculation}</span>
                        <span className="text-slate-500">{cadence}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-400">Current month signal</p>
                      <p className="mt-2 text-3xl font-semibold text-white">{formatKes(dashboard.overview.finance.gmvMonth)}</p>
                    </div>
                    {monthGmvDelta === null ? (
                      <span className="text-sm text-slate-500">No baseline</span>
                    ) : (
                      <span className={`admin-badge ${monthGmvDelta >= 0 ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                        {monthGmvDelta >= 0 ? '+' : '-'}
                        {Math.abs(monthGmvDelta).toFixed(1)}% GMV
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">
                    <span>Revenue {formatKes(dashboard.overview.finance.revenueMonth)}</span>
                    <span>Take rate {formatPercent(dashboard.overview.finance.takeRate)}</span>
                    <span>
                      Revenue delta {monthRevenueDelta === null ? 'N/A' : `${monthRevenueDelta.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="admin-card p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="admin-eyebrow">Geography & cohorts</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">Growth diagnostics</h2>
                    </div>
                    <MapPinned className="h-5 w-5 text-cyan-200" />
                  </div>
                  <div className="mt-6 space-y-3">
                    {geoAndCohortSignals.map((item) => (
                      <div
                        key={item}
                        className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-slate-300"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-card p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="admin-eyebrow">Exports</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">CSV and PDF outputs</h2>
                    </div>
                    <Download className="h-5 w-5 text-cyan-200" />
                  </div>
                  <div className="mt-6 grid gap-3">
                    {exportCards.map((card) => (
                      <div
                        key={card.title}
                        className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{card.title}</p>
                            <p className="mt-2 text-sm text-slate-300">{card.body}</p>
                          </div>
                          <FileDown className="mt-1 h-[18px] w-[18px] text-slate-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section id="permissions" className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="admin-card p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="admin-eyebrow">Permissions</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Admin versus Super Admin</h2>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-cyan-200" />
                </div>

                <div className="mt-6 overflow-hidden rounded-[26px] border border-white/8">
                  <div className="grid grid-cols-[1.3fr_0.7fr_0.7fr] gap-4 border-b border-white/8 bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    <span>Capability</span>
                    <span>Admin</span>
                    <span>Super Admin</span>
                  </div>
                  <div className="divide-y divide-white/8">
                    {permissionRows.map(([capability, admin, superAdmin]) => (
                      <div key={capability} className="grid grid-cols-[1.3fr_0.7fr_0.7fr] gap-4 px-4 py-3 text-sm">
                        <span className="text-white">{capability}</span>
                        <span className="text-slate-300">{admin}</span>
                        <span className="text-slate-300">{superAdmin}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="admin-card p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="admin-eyebrow">Audit posture</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">High-risk actions</h2>
                    </div>
                    <LockKeyhole className="h-5 w-5 text-cyan-200" />
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                        <p className="font-semibold text-white">Verification decisions</p>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">Capture reviewer, timestamp, decision, and rejection reason for every application.</p>
                    </div>
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-300" />
                        <p className="font-semibold text-white">Dispute overrides and refunds</p>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">Refund amount, notes, and party notification should always be recorded together.</p>
                    </div>
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-3">
                        <Wallet className="h-5 w-5 text-cyan-200" />
                        <p className="font-semibold text-white">Payout approval and rejection</p>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">Every payout outcome needs processor identity, callback state, and cleaner communication trace.</p>
                    </div>
                  </div>
                </div>

                <div className="admin-card p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="admin-eyebrow">Workflow outcomes</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">Resolution actions</h2>
                    </div>
                    <Sparkles className="h-5 w-5 text-cyan-200" />
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                      <XCircle className="h-5 w-5 text-rose-300" />
                      <p className="mt-3 font-semibold text-white">Full or partial refund</p>
                      <p className="mt-2 text-sm text-slate-400">Dispute outcomes can return funds fully or partially to the client.</p>
                    </div>
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                      <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                      <p className="mt-3 font-semibold text-white">Cleaner paid in full</p>
                      <p className="mt-2 text-sm text-slate-400">Rejected disputes should release funds cleanly and notify both parties.</p>
                    </div>
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                      <BadgeCheck className="h-5 w-5 text-cyan-200" />
                      <p className="mt-3 font-semibold text-white">Profile activation</p>
                      <p className="mt-2 text-sm text-slate-400">Verified cleaners should move live immediately with a welcome notification sequence.</p>
                    </div>
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                      <Users2 className="h-5 w-5 text-amber-200" />
                      <p className="mt-3 font-semibold text-white">Repeat fault review</p>
                      <p className="mt-2 text-sm text-slate-400">Three disputes attributed to cleaner fault should trigger suspension review.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
