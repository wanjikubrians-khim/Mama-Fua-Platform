'use client';
// Mama Fua — Client Wallet & Payment History
// KhimTech | 2026

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Download, ArrowUpRight, ArrowDownRight, Calendar, Filter, Search, Wallet, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { paymentsApi, bookingApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatKES } from '@mama-fua/shared';
import { format } from 'date-fns';

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-mint-100 text-mint-800',
  PENDING: 'bg-amber-100 text-amber-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-slate-100 text-slate-600',
};

const TRANSACTION_TYPE_STYLES: Record<string, string> = {
  PAYMENT: 'bg-brand-100 text-brand-800',
  REFUND: 'bg-green-100 text-green-800',
  WITHDRAWAL: 'bg-red-100 text-red-800',
  DEPOSIT: 'bg-mint-100 text-mint-800',
};

export default function WalletPage() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'methods'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => paymentsApi.getWallet(),
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => paymentsApi.getTransactions({ limit: 100 }),
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingApi.list({ pageSize: 100 }),
  });

  const wallet = walletData?.data?.data;
  const transactions = transactionsData?.data?.data ?? [];
  const bookings = bookingsData?.data?.data ?? [];

  const filteredTransactions = transactions.filter((transaction: any) => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.reference?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalSpent = bookings
    .filter((b: any) => ['COMPLETED', 'CONFIRMED'].includes(b.status))
    .reduce((sum: number, b: any) => sum + b.totalAmount, 0);

  const pendingPayments = bookings
    .filter((b: any) => ['PENDING', 'ACCEPTED'].includes(b.status))
    .reduce((sum: number, b: any) => sum + b.totalAmount, 0);

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Wallet },
    { id: 'transactions' as const, label: 'Transactions', icon: CreditCard },
    { id: 'methods' as const, label: 'Payment Methods', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-ink-900">Wallet & Payments</h1>
          <p className="mt-2 text-sm text-ink-500">Manage your payments and view transaction history</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="dark-panel px-6 py-6">
            <p className="text-sm font-medium text-brand-100">Total spent</p>
            <p className="mt-2 text-3xl font-semibold text-white">{formatKES(totalSpent)}</p>
            <p className="mt-2 text-sm text-white/65">
              {bookings.filter((b: any) => ['COMPLETED', 'CONFIRMED'].includes(b.status)).length} completed bookings
            </p>
          </div>
          <div className="stat-chip px-5 py-5">
            <p className="text-sm font-medium text-ink-500">Pending payments</p>
            <p className="mt-2 text-2xl font-semibold text-ink-900">{formatKES(pendingPayments)}</p>
            <p className="mt-1 text-xs text-ink-400">
              {bookings.filter((b: any) => ['PENDING', 'ACCEPTED'].includes(b.status)).length} active bookings
            </p>
          </div>
          <div className="stat-chip px-5 py-5">
            <p className="text-sm font-medium text-ink-500">Payment method</p>
            <p className="mt-2 text-2xl font-semibold text-ink-900">M-Pesa</p>
            <p className="mt-1 text-xs text-ink-400">•••• {user?.phone?.slice(-4)}</p>
          </div>
        </div>

        <div className="section-shell p-4">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-600 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="section-shell p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-ink-900">Payment Summary</h2>
                <p className="mt-1 text-sm text-ink-500">Overview of your payment activity</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink-500">This month</p>
                      <p className="mt-2 text-2xl font-bold text-ink-900">{formatKES(totalSpent * 0.3)}</p>
                      <p className="mt-1 text-xs text-mint-600">+12% from last month</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-mint-50">
                      <TrendingUp className="h-6 w-6 text-mint-600" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink-500">Average booking</p>
                      <p className="mt-2 text-2xl font-bold text-ink-900">
                        {bookings.length > 0 ? formatKES(totalSpent / bookings.length) : formatKES(0)}
                      </p>
                      <p className="mt-1 text-xs text-ink-400">Per service</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                      <CreditCard className="h-6 w-6 text-brand-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="section-shell p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-ink-900">Recent Transactions</h2>
                <button className="btn-ghost px-4 py-2 text-sm">
                  View all
                </button>
              </div>

              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        transaction.type === 'PAYMENT' ? 'bg-brand-50' : 'bg-green-50'
                      }`}>
                        {transaction.type === 'PAYMENT' ? (
                          <ArrowUpRight className="h-5 w-5 text-brand-600" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-ink-900">{transaction.description}</p>
                        <p className="text-sm text-ink-500">{format(new Date(transaction.createdAt), 'dd MMM, h:mm a')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'PAYMENT' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.type === 'PAYMENT' ? '-' : '+'}{formatKES(transaction.amount)}
                      </p>
                      <span className={`badge mt-1 ${STATUS_STYLES[transaction.status]}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="section-shell p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-ink-900">Transaction History</h2>
              <p className="mt-1 text-sm text-ink-500">Complete history of all your payments</p>
            </div>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input px-4 py-2"
                >
                  <option value="all">All statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
                <button className="btn-ghost px-4 py-2">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredTransactions.map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      transaction.type === 'PAYMENT' ? 'bg-brand-50' : 'bg-green-50'
                    }`}>
                      {transaction.type === 'PAYMENT' ? (
                        <ArrowUpRight className="h-5 w-5 text-brand-600" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-ink-900">{transaction.description}</p>
                      <p className="text-sm text-ink-500">
                        {format(new Date(transaction.createdAt), 'dd MMM yyyy, h:mm a')} · {transaction.reference}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'PAYMENT' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.type === 'PAYMENT' ? '-' : '+'}{formatKES(transaction.amount)}
                      </p>
                      <span className={`badge mt-1 ${STATUS_STYLES[transaction.status]}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'methods' && (
          <div className="section-shell p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-ink-900">Payment Methods</h2>
              <p className="mt-1 text-sm text-ink-500">Manage your payment options</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                    <span className="text-lg font-bold text-green-700">M</span>
                  </div>
                  <div>
                    <p className="font-semibold text-ink-900">M-Pesa</p>
                    <p className="text-sm text-ink-500">•••• {user?.phone?.slice(-4)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Default
                  </span>
                  <button className="btn-ghost px-3 py-1.5 text-sm">
                    Edit
                  </button>
                </div>
              </div>

              <button className="w-full rounded-xl border-2 border-dashed border-slate-300 bg-white p-5 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40">
                <CreditCard className="mx-auto h-8 w-8 text-ink-400" />
                <p className="mt-3 font-semibold text-ink-900">Add Payment Method</p>
                <p className="text-sm text-ink-500">Add a new payment option</p>
              </button>
            </div>

            <div className="mt-8">
              <h3 className="mb-4 text-lg font-semibold text-ink-900">Payment Settings</h3>
              <div className="space-y-3">
                {[
                  { title: 'Auto-pay for recurring bookings', description: 'Automatically process payments for recurring services' },
                  { title: 'Payment reminders', description: 'Get notified before payments are due' },
                  { title: 'Save payment receipts', description: 'Automatically save receipts for all transactions' },
                ].map((setting) => (
                  <div key={setting.title} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                    <div>
                      <p className="font-semibold text-ink-900">{setting.title}</p>
                      <p className="text-sm text-ink-500">{setting.description}</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-brand-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
