'use client';
// Mama Fua — Client Wallet & Payment History
// KhimTech | 2026

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownRight, ArrowUpRight, CreditCard, Download,
  Search, TrendingUp, Wallet,
} from 'lucide-react';
import { paymentsApi, bookingApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatKES } from '@mama-fua/shared';
import { format } from 'date-fns';

type TabKey = 'overview' | 'transactions' | 'methods';

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-mint-50  text-mint-700',
  PENDING:   'bg-amber-50 text-amber-700',
  FAILED:    'bg-red-50   text-red-700',
  REFUNDED:  'bg-ink-100  text-ink-500',
};

const TABS: Array<{ id: TabKey; label: string }> = [
  { id: 'overview',      label: 'Overview' },
  { id: 'transactions',  label: 'Transactions' },
  { id: 'methods',       label: 'Payment methods' },
];

export default function WalletPage() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab]       = useState<TabKey>('overview');
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: transactionsData } = useQuery({
    queryKey: ['transactions'],
    queryFn:  () => paymentsApi.getTransactions({ limit: 100 }),
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['bookings'],
    queryFn:  () => bookingApi.list({ pageSize: 100 }),
  });

  const transactions: any[] = transactionsData?.data?.data ?? [];
  const bookings: any[]     = bookingsData?.data?.data ?? [];

  const totalSpent = bookings
    .filter((b) => ['COMPLETED', 'CONFIRMED'].includes(b.status))
    .reduce((s, b) => s + b.totalAmount, 0);

  const pendingAmt = bookings
    .filter((b) => ['PENDING', 'ACCEPTED'].includes(b.status))
    .reduce((s, b) => s + b.totalAmount, 0);

  const filtered = transactions.filter((t) => {
    const matchSearch = t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        t.reference?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">

        {/* ── HEADER ──────────────────────────────────────────── */}
        <header className="rounded-3xl overflow-hidden shadow-[var(--shadow-card)]">
          <div className="bg-ink-900 px-6 pt-7 pb-8 sm:px-8 sm:pt-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Payments</p>
            <h1 className="mt-1.5 text-3xl font-extrabold text-white sm:text-4xl">Wallet</h1>
            <p className="mt-1.5 text-sm text-white/50">Your full payment history and methods</p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/5 border border-white/8 px-4 py-4">
                <p className="text-xs text-white/40 uppercase tracking-wide">Total spent</p>
                <p className="mt-1.5 text-xl font-extrabold text-white">{formatKES(totalSpent)}</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/8 px-4 py-4">
                <p className="text-xs text-white/40 uppercase tracking-wide">Pending</p>
                <p className="mt-1.5 text-xl font-extrabold text-white">{formatKES(pendingAmt)}</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/8 px-4 py-4">
                <p className="text-xs text-white/40 uppercase tracking-wide">Method</p>
                <p className="mt-1.5 text-base font-extrabold text-white">M-Pesa</p>
                <p className="text-xs text-white/40">•••• {user?.phone?.slice(-4)}</p>
              </div>
            </div>
          </div>

          {/* Tab strip */}
          <div className="bg-white px-4 sm:px-8 border-b border-ink-100 overflow-x-auto scrollbar-hide">
            <div className="flex gap-0 min-w-max">
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`px-4 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === id
                      ? 'border-brand-600 text-brand-700'
                      : 'border-transparent text-ink-500 hover:text-ink-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ── OVERVIEW ────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white shadow-[var(--shadow-card)] p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">This month</p>
                    <p className="mt-2 text-2xl font-extrabold text-ink-900">{formatKES(totalSpent * 0.3)}</p>
                    <p className="mt-1 text-xs text-mint-600 font-semibold">+12% from last month</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint-50">
                    <TrendingUp className="h-5 w-5 text-mint-600" />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white shadow-[var(--shadow-card)] p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Avg booking</p>
                    <p className="mt-2 text-2xl font-extrabold text-ink-900">
                      {bookings.length > 0 ? formatKES(totalSpent / bookings.length) : formatKES(0)}
                    </p>
                    <p className="mt-1 text-xs text-ink-400">Per service</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
                    <CreditCard className="h-5 w-5 text-brand-600" />
                  </div>
                </div>
              </div>
            </div>

            <section className="rounded-3xl bg-white shadow-[var(--shadow-card)] px-6 py-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-ink-900">Recent transactions</h2>
              </div>

              {transactions.length === 0 ? (
                <div className="py-10 text-center">
                  <Wallet className="mx-auto h-10 w-10 text-ink-200" />
                  <p className="mt-3 text-sm text-ink-500">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx) => (
                    <TxRow key={tx.id} tx={tx} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ── TRANSACTIONS ────────────────────────────────────── */}
        {activeTab === 'transactions' && (
          <section className="rounded-3xl bg-white shadow-[var(--shadow-card)] px-6 py-6">
            <div className="mb-5">
              <h2 className="text-lg font-extrabold text-ink-900">Transaction history</h2>
              <p className="mt-1 text-sm text-ink-500">Complete history of all your payments</p>
            </div>

            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  placeholder="Search transactions…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="input px-4 py-2"
                >
                  <option value="all">All statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
                <button className="btn-ghost px-3 py-2">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-ink-500">No transactions match your search.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((tx) => <TxRow key={tx.id} tx={tx} showDate />)}
              </div>
            )}
          </section>
        )}

        {/* ── METHODS ─────────────────────────────────────────── */}
        {activeTab === 'methods' && (
          <section className="rounded-3xl bg-white shadow-[var(--shadow-card)] px-6 py-6">
            <div className="mb-5">
              <h2 className="text-lg font-extrabold text-ink-900">Payment methods</h2>
              <p className="mt-1 text-sm text-ink-500">Manage how you pay for bookings</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4 rounded-2xl border border-mint-200 bg-mint-50/50 px-5 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-mint-200">
                  <span className="text-lg font-extrabold text-mint-700">M</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink-900">M-Pesa</p>
                  <p className="text-xs text-ink-500 mt-0.5">•••• {user?.phone?.slice(-4)}</p>
                </div>
                <span className="badge bg-mint-100 text-mint-700">Default</span>
              </div>

              <button className="w-full rounded-2xl border-2 border-dashed border-ink-200 bg-white p-5 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40">
                <CreditCard className="mx-auto h-7 w-7 text-ink-300" />
                <p className="mt-2 text-sm font-bold text-ink-700">Add payment method</p>
                <p className="text-xs text-ink-400 mt-0.5">Card support coming soon</p>
              </button>
            </div>

            <div className="mt-6 pt-5 border-t border-ink-100">
              <h3 className="text-sm font-extrabold text-ink-900 mb-4">Payment settings</h3>
              <div className="space-y-3">
                {[
                  { title: 'Payment reminders',          desc: 'Get notified before payments are due' },
                  { title: 'Auto-save receipts',         desc: 'Automatically save receipts for transactions' },
                ].map((s, i) => (
                  <div key={s.title} className="flex items-center justify-between rounded-2xl border border-ink-100 bg-surface-50 px-5 py-4">
                    <div>
                      <p className="text-sm font-bold text-ink-900">{s.title}</p>
                      <p className="text-xs text-ink-500 mt-0.5">{s.desc}</p>
                    </div>
                    <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${i === 0 ? 'bg-brand-600' : 'bg-ink-200'}`}>
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${i === 0 ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function TxRow({ tx, showDate = false }: { tx: any; showDate?: boolean }) {
  const isPayment = tx.type === 'PAYMENT';
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-ink-100 bg-surface-50 px-4 py-4 hover:border-ink-200 transition-colors">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${isPayment ? 'bg-brand-50' : 'bg-mint-50'}`}>
        {isPayment
          ? <ArrowUpRight className="h-5 w-5 text-brand-600" />
          : <ArrowDownRight className="h-5 w-5 text-mint-600" />
        }
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink-900 truncate">{tx.description}</p>
        <p className="text-xs text-ink-400 mt-0.5">
          {showDate
            ? format(new Date(tx.createdAt), 'dd MMM yyyy, h:mm a')
            : format(new Date(tx.createdAt), 'dd MMM, h:mm a')
          }
          {tx.reference && <> · <span className="font-mono">{tx.reference}</span></>}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className={`text-sm font-extrabold ${isPayment ? 'text-red-600' : 'text-mint-700'}`}>
          {isPayment ? '−' : '+'}{formatKES(tx.amount)}
        </p>
        <span className={`badge mt-0.5 text-[10px] ${STATUS_STYLES[tx.status] ?? 'bg-ink-100 text-ink-500'}`}>
          {tx.status}
        </span>
      </div>
    </div>
  );
}
