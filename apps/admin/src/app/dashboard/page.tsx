'use client';
// Mama Fua — Admin Dashboard
// KhimTech | 2026

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Users, ShoppingBag, AlertTriangle, Wallet, TrendingUp } from 'lucide-react';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1' });

interface DashboardData {
  totalUsers: number;
  activeJobs: number;
  openDisputes: number;
  pendingPayouts: number;
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data.data;
    },
    refetchInterval: 30_000,
  });

  const stats = [
    { label: 'Total users', value: data?.totalUsers ?? '—', icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Jobs in progress', value: data?.activeJobs ?? '—', icon: ShoppingBag, color: 'bg-teal-50 text-teal-600' },
    { label: 'Open disputes', value: data?.openDisputes ?? '—', icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
    { label: 'Pending payouts', value: data?.pendingPayouts ?? '—', icon: Wallet, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-60 bg-white border-r border-gray-100 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100">
          <p className="text-lg font-bold text-brand-600">Mama Fua</p>
          <p className="text-xs text-gray-400 mt-0.5">Admin · KhimTech</p>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {[
            { label: 'Dashboard', href: '/dashboard', active: true },
            { label: 'Users', href: '/users' },
            { label: 'Bookings', href: '/bookings' },
            { label: 'Cleaners', href: '/cleaners' },
            { label: 'Disputes', href: '/disputes' },
            { label: 'Payouts', href: '/payouts' },
            { label: 'Analytics', href: '/analytics' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                item.active
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">Brian Wanjiku · Admin</p>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Live platform overview · Auto-refreshes every 30s
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-6 shadow-card">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl mb-4 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? <span className="animate-pulse">…</span> : s.value}
              </p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Placeholder sections */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-600" />
              Recent bookings
            </h2>
            <p className="text-sm text-gray-400">Connect to /admin/bookings endpoint for live data.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Open disputes
            </h2>
            <p className="text-sm text-gray-400">Connect to /admin/disputes endpoint for live data.</p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 mt-12">
          KhimTech · Mama Fua Admin · Brian Wanjiku & Maryann Wanjiru · 2026
        </p>
      </main>
    </div>
  );
}
