'use client';
// Mama Fua — Notifications
// KhimTech | 2026

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell, CalendarDays, CheckCheck, ChevronRight,
  CreditCard, Loader2, MessageCircle, ShieldCheck, Sparkles, ArrowRight,
} from 'lucide-react';
import { userApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

type FilterKey = 'all' | 'unread' | 'read';

interface NotificationItem {
  id: string;
  type: 'BOOKING' | 'PAYMENT' | 'REVIEW' | 'CHAT' | 'SYSTEM' | 'PROMOTION';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, string> | null;
}

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all',    label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read',   label: 'Read' },
];

const TYPE_ICONS: Record<NotificationItem['type'], React.ReactNode> = {
  PAYMENT:   <CreditCard className="h-5 w-5" />,
  CHAT:      <MessageCircle className="h-5 w-5" />,
  REVIEW:    <Sparkles className="h-5 w-5" />,
  SYSTEM:    <ShieldCheck className="h-5 w-5" />,
  BOOKING:   <CalendarDays className="h-5 w-5" />,
  PROMOTION: <Sparkles className="h-5 w-5" />,
};

export default function NotificationsPage() {
  const user        = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterKey>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn:  async () => {
      const res = await userApi.notifications();
      return res.data.data as NotificationItem[];
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => userApi.markRead(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => userApi.markAllNotificationsRead(),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const dismiss = useMutation({
    mutationFn: (id: string) => userApi.dismissNotification(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const clearRead = useMutation({
    mutationFn: () => userApi.clearNotifications('read'),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white shadow-[var(--shadow-card)] overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-brand-400 to-brand-600" />
          <div className="px-8 py-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
              <Bell className="h-8 w-8 text-brand-600" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-ink-900">Sign in required</h2>
            <p className="mt-2 text-sm text-ink-500">Log in to see your notifications.</p>
            <Link href="/login" className="btn-primary mt-6 inline-flex">Go to login <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    );
  }

  const notifications = data ?? [];
  const unreadCount   = notifications.filter(n => !n.isRead).length;
  const filtered      = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read')   return n.isRead;
    return true;
  });

  const isMutating = markRead.isPending || markAllRead.isPending || clearRead.isPending || dismiss.isPending;

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">

        {/* ── HEADER ──────────────────────────────────────────── */}
        <header className="rounded-3xl overflow-hidden shadow-[var(--shadow-card)]">
          <div className="bg-ink-900 px-6 pt-7 pb-8 sm:px-8 sm:pt-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Inbox</p>
                <h1 className="mt-1.5 text-3xl font-extrabold text-white sm:text-4xl">Notifications</h1>
                <p className="mt-1.5 text-sm text-white/50">
                  {unreadCount > 0
                    ? `${unreadCount} unread update${unreadCount !== 1 ? 's' : ''}`
                    : 'All caught up'}
                </p>
              </div>
              {unreadCount > 0 && (
                <span className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-xs font-bold text-white">
                  <span className="h-2 w-2 rounded-full bg-white animate-ping-slow" />
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/5 border border-white/8 px-4 py-4">
                <p className="text-xs text-white/40 uppercase tracking-wide">Unread</p>
                <p className="mt-1.5 text-2xl font-extrabold text-white">{unreadCount}</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/8 px-4 py-4">
                <p className="text-xs text-white/40 uppercase tracking-wide">Total</p>
                <p className="mt-1.5 text-2xl font-extrabold text-white">{notifications.length}</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/8 px-4 py-4">
                <p className="text-xs text-white/40 uppercase tracking-wide">Latest</p>
                <p className="mt-1.5 text-base font-bold text-white truncate">
                  {notifications[0]
                    ? formatDistanceToNow(new Date(notifications[0].createdAt), { addSuffix: true })
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions strip */}
          <div className="bg-white px-6 py-3 sm:px-8 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => markAllRead.mutate()}
              disabled={unreadCount === 0 || markAllRead.isPending}
              className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
            <button
              onClick={() => clearRead.mutate()}
              disabled={notifications.filter(n => n.isRead).length === 0 || clearRead.isPending}
              className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-600 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Clear read
            </button>
            {isMutating && (
              <div className="ml-auto flex items-center gap-1.5 text-xs text-ink-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating…
              </div>
            )}
          </div>
        </header>

        {/* ── FILTER TABS ─────────────────────────────────────── */}
        <div className="pill-tabs">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`pill-tab ${filter === key ? 'pill-tab-active' : ''}`}
            >
              {label}
              {key === 'unread' && unreadCount > 0 && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  filter === key ? 'bg-brand-100 text-brand-700' : 'bg-ink-200 text-ink-600'
                }`}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── LIST ────────────────────────────────────────────── */}
        <section>
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="rounded-3xl bg-white shadow-[var(--shadow-card)] px-8 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100">
                <Bell className="h-8 w-8 text-ink-300" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-ink-900">Nothing here yet</h3>
              <p className="mt-2 text-sm text-ink-500 max-w-xs mx-auto">
                {filter !== 'all'
                  ? 'No notifications match this filter.'
                  : 'New booking, payment, and review events will appear here automatically.'}
              </p>
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="space-y-3">
              {filtered.map(notif => {
                const href = getHref(notif, user.role);
                return (
                  <div
                    key={notif.id}
                    className={`rounded-2xl border px-5 py-5 transition-all duration-200 ${
                      notif.isRead
                        ? 'bg-white border-ink-100 shadow-[var(--shadow-xs)]'
                        : 'bg-brand-50/50 border-brand-200 shadow-[var(--shadow-card)]'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
                        notif.isRead ? 'bg-surface-100 text-ink-400' : 'bg-white text-brand-600 shadow-[var(--shadow-xs)]'
                      }`}>
                        {TYPE_ICONS[notif.type] ?? <Bell className="h-5 w-5" />}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-ink-900">{notif.title}</p>
                          {!notif.isRead && (
                            <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              New
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-sm text-ink-500 leading-relaxed">{notif.body}</p>
                        <p className="mt-2 text-xs text-ink-400">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </p>

                        {/* Actions */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {!notif.isRead && (
                            <button
                              onClick={() => markRead.mutate(notif.id)}
                              className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-surface-50 transition-colors"
                            >
                              Mark read
                            </button>
                          )}
                          <button
                            onClick={() => dismiss.mutate(notif.id)}
                            className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-surface-50 transition-colors"
                          >
                            Dismiss
                          </button>
                          <Link
                            href={href}
                            className="flex items-center gap-1 rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-700 transition-colors"
                          >
                            Open <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function getHref(n: NotificationItem, role: string) {
  const screen    = n.data?.screen;
  const bookingId = n.data?.bookingId;
  if (screen === 'Wallet')                                                    return role === 'CLEANER' ? '/cleaner/wallet' : '/dashboard';
  if (screen === 'Chat'         && bookingId)                                 return `/bookings/${bookingId}?panel=chat`;
  if (screen === 'WriteReview'  && bookingId)                                 return `/bookings/${bookingId}?panel=review`;
  if (['BookingDetail','TrackCleaner','BrowseCleaners'].includes(screen ?? '') && bookingId) return `/bookings/${bookingId}`;
  if (bookingId)                                                              return `/bookings/${bookingId}`;
  return role === 'CLEANER' ? '/cleaner/dashboard' : '/dashboard';
}
