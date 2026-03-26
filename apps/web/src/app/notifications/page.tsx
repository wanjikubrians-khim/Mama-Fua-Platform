'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  CalendarDays,
  CheckCheck,
  ChevronRight,
  CreditCard,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
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
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
];

export default function NotificationsPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterKey>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await userApi.notifications();
      return response.data.data as NotificationItem[];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => userApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = data ?? [];
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const filtered = notifications.filter((notification) => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const markAllRead = async () => {
    const unread = notifications.filter((notification) => !notification.isRead);
    if (unread.length === 0) return;
    await Promise.all(unread.map((notification) => userApi.markRead(notification.id)));
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="section-shell px-8 py-10 text-center">
          <Bell className="mx-auto h-10 w-10 text-brand-600" />
          <h1 className="mt-4 text-3xl text-ink-900">Sign in to view updates</h1>
          <p className="mt-3 text-sm leading-6 text-ink-500">
            Notifications are only available for authenticated accounts.
          </p>
          <Link href="/login" className="btn-primary mt-6 px-6 py-3">
            Open login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(24,95,165,0.12),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#f8fafc_50%,#ffffff_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 px-6 py-6 text-white shadow-card sm:px-8 sm:py-8">
            <p className="text-sm font-medium text-brand-100">Notifications</p>
            <h1 className="mt-2 text-3xl sm:text-4xl">Keep every job update in one place</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
              Booking changes, payment events, and review reminders land here with direct links to
              the right workflow.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <StatCard label="Unread" value={String(unreadCount)} dark />
              <StatCard label="Total updates" value={String(notifications.length)} dark />
              <StatCard
                label="Latest event"
                value={
                  notifications[0]
                    ? formatDistanceToNow(new Date(notifications[0].createdAt), {
                        addSuffix: true,
                      })
                    : 'No alerts'
                }
                dark
              />
            </div>
          </section>

          <section className="section-shell px-6 py-6">
            <p className="text-sm font-medium text-brand-700">Filters</p>
            <h2 className="mt-2 text-3xl text-ink-900">Inbox controls</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {FILTERS.map((option) => {
                const active = option.key === filter;
                return (
                  <button
                    key={option.key}
                    onClick={() => setFilter(option.key)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-brand-600 text-white shadow-soft'
                        : 'bg-slate-100 text-ink-600 hover:bg-slate-200'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </button>
          </section>
        </header>

        <section className="section-shell px-6 py-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-brand-700">Inbox</p>
              <h2 className="mt-1 text-3xl text-ink-900">
                {filter === 'all'
                  ? 'Recent updates'
                  : filter === 'unread'
                    ? 'Unread updates'
                    : 'Read updates'}
              </h2>
            </div>
            {markRead.isPending && (
              <div className="inline-flex items-center gap-2 text-sm text-ink-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-2xl text-ink-900">Nothing here yet</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-500">
                New booking, payment, and review events will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filtered.map((notification) => {
                const href = getNotificationHref(notification, user.role);
                const icon = getNotificationIcon(notification.type);

                return (
                  <div
                    key={notification.id}
                    className={`rounded-[1.7rem] border px-5 py-5 shadow-soft transition-colors ${
                      notification.isRead
                        ? 'border-slate-200 bg-white'
                        : 'border-brand-200 bg-brand-50/50'
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex gap-4">
                        <div
                          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${
                            notification.isRead
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-white text-brand-700'
                          }`}
                        >
                          {icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-ink-900">
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <span className="rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                                New
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-ink-500">{notification.body}</p>
                          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 lg:justify-end">
                        {!notification.isRead && (
                          <button
                            onClick={() => markRead.mutate(notification.id)}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-slate-50"
                          >
                            Mark read
                          </button>
                        )}
                        <Link
                          href={href}
                          className="inline-flex items-center gap-2 rounded-2xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-800"
                        >
                          Open
                          <ChevronRight className="h-4 w-4" />
                        </Link>
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

function StatCard({
  label,
  value,
  dark = false,
}: {
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.4rem] border px-4 py-4 ${
        dark ? 'border-white/10 bg-white/10 text-white' : 'border-slate-200 bg-white text-ink-900'
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-[0.16em] ${dark ? 'text-white/60' : 'text-ink-400'}`}
      >
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function getNotificationIcon(type: NotificationItem['type']) {
  if (type === 'PAYMENT') return <CreditCard className="h-5 w-5" />;
  if (type === 'CHAT') return <MessageCircle className="h-5 w-5" />;
  if (type === 'REVIEW') return <Sparkles className="h-5 w-5" />;
  if (type === 'SYSTEM') return <ShieldCheck className="h-5 w-5" />;
  return <CalendarDays className="h-5 w-5" />;
}

function getNotificationHref(
  notification: NotificationItem,
  role: 'CLIENT' | 'CLEANER' | 'ADMIN' | 'SUPER_ADMIN'
) {
  const screen = notification.data?.screen;
  const bookingId = notification.data?.bookingId;

  if (screen === 'Wallet') {
    return role === 'CLEANER' ? '/cleaner/wallet' : '/dashboard';
  }

  if (screen === 'Chat' && bookingId) {
    return `/bookings/${bookingId}?panel=chat`;
  }

  if (screen === 'WriteReview' && bookingId) {
    return `/bookings/${bookingId}?panel=review`;
  }

  if (
    (screen === 'BookingDetail' || screen === 'TrackCleaner' || screen === 'BrowseCleaners') &&
    bookingId
  ) {
    return `/bookings/${bookingId}`;
  }

  if (bookingId) {
    return `/bookings/${bookingId}`;
  }

  return role === 'CLEANER' ? '/cleaner/dashboard' : '/dashboard';
}
