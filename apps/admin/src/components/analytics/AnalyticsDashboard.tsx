'use client';
// Mama Fua — Analytics Dashboard Component
// KhimTech | 2026

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar, 
  MapPin, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Activity,
  Download,
  Filter,
  RefreshCw,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2
} from 'lucide-react';
import { formatKES } from '@mama-fua/shared';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalCleaners: number;
    totalClients: number;
    totalBookings: number;
    totalRevenue: number;
    totalGMV: number;
    avgBookingValue: number;
    avgRating: number;
    disputeRate: number;
    retentionRate: number;
    growthRates: {
      users: number;
      bookings: number;
      revenue: number;
      cleaners: number;
    };
  };
  bookings: {
    daily: Array<{
      date: string;
      bookings: number;
      revenue: number;
      completed: number;
      cancelled: number;
      disputed: number;
    }>;
    monthly: Array<{
      month: string;
      bookings: number;
      revenue: number;
      newClients: number;
      newCleaners: number;
    }>;
    services: Array<{
      serviceType: string;
      count: number;
      revenue: number;
      avgRating: number;
    }>;
    cities: Array<{
      city: string;
      bookings: number;
      revenue: number;
      activeCleaners: number;
    }>;
  };
  financials: {
    monthly: Array<{
      month: string;
      revenue: number;
      expenses: number;
      profit: number;
      gmv: number;
      commission: number;
    }>;
    paymentMethods: Array<{
      method: string;
      count: number;
      amount: number;
      percentage: number;
    }>;
    payouts: Array<{
      month: string;
      amount: number;
      count: number;
      avgAmount: number;
    }>;
  };
  performance: {
    cleanerUtilization: number;
    avgResponseTime: number;
    avgCompletionTime: number;
    matchingSuccess: number;
    repeatClientRate: number;
    topCleaners: Array<{
      id: string;
      name: string;
      bookings: number;
      revenue: number;
      rating: number;
    }>;
  };
}

interface AnalyticsDashboardProps {
  className?: string;
}

export function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'overview' | 'bookings' | 'financials' | 'performance'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', dateRange],
    queryFn: async () => {
      // Mock API call - replace with actual implementation
      const mockData: AnalyticsData = {
        overview: {
          totalUsers: 15420,
          totalCleaners: 3420,
          totalClients: 12000,
          totalBookings: 45678,
          totalRevenue: 8923400, // KES 89,234.00
          totalGMV: 44567000, // KES 445,670.00
          avgBookingValue: 97550, // KES 975.50
          avgRating: 4.7,
          disputeRate: 0.03, // 3%
          retentionRate: 0.68, // 68%
          growthRates: {
            users: 0.12, // 12%
            bookings: 0.18, // 18%
            revenue: 0.22, // 22%
            cleaners: 0.15, // 15%
          },
        },
        bookings: {
          daily: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            bookings: Math.floor(Math.random() * 50) + 20,
            revenue: (Math.floor(Math.random() * 20000) + 10000) * 100,
            completed: Math.floor(Math.random() * 45) + 15,
            cancelled: Math.floor(Math.random() * 5) + 1,
            disputed: Math.floor(Math.random() * 2),
          })),
          monthly: Array.from({ length: 12 }, (_, i) => ({
            month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
            bookings: Math.floor(Math.random() * 1500) + 800,
            revenue: (Math.floor(Math.random() * 300000) + 200000) * 100,
            newClients: Math.floor(Math.random() * 200) + 100,
            newCleaners: Math.floor(Math.random() * 50) + 20,
          })),
          services: [
            { serviceType: 'Home Cleaning', count: 23456, revenue: 23456000, avgRating: 4.6 },
            { serviceType: 'Deep Cleaning', count: 8765, revenue: 15678000, avgRating: 4.8 },
            { serviceType: 'Office Cleaning', count: 5432, revenue: 12345000, avgRating: 4.5 },
            { serviceType: 'Laundry', count: 3210, revenue: 5678000, avgRating: 4.7 },
            { serviceType: 'Post-Construction', count: 1234, revenue: 4567000, avgRating: 4.9 },
          ],
          cities: [
            { city: 'Nairobi', bookings: 28765, revenue: 34567000, activeCleaners: 1234 },
            { city: 'Mombasa', bookings: 8765, revenue: 9876000, activeCleaners: 456 },
            { city: 'Kisumu', bookings: 4321, revenue: 5432000, activeCleaners: 234 },
            { city: 'Nakuru', bookings: 3210, revenue: 3456000, activeCleaners: 189 },
            { city: 'Eldoret', bookings: 2178, revenue: 2345000, activeCleaners: 145 },
          ],
        },
        financials: {
          monthly: Array.from({ length: 12 }, (_, i) => ({
            month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
            revenue: (Math.floor(Math.random() * 200000) + 100000) * 100,
            expenses: (Math.floor(Math.random() * 50000) + 30000) * 100,
            profit: (Math.floor(Math.random() * 150000) + 50000) * 100,
            gmv: (Math.floor(Math.random() * 500000) + 300000) * 100,
            commission: (Math.floor(Math.random() * 100000) + 50000) * 100,
          })),
          paymentMethods: [
            { method: 'MPESA', count: 34567, amount: 34567000, percentage: 0.78 },
            { method: 'STRIPE_CARD', count: 8765, amount: 8765000, percentage: 0.18 },
            { method: 'WALLET', count: 2345, amount: 1234000, percentage: 0.04 },
          ],
          payouts: Array.from({ length: 12 }, (_, i) => ({
            month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
            amount: (Math.floor(Math.random() * 100000) + 50000) * 100,
            count: Math.floor(Math.random() * 200) + 100,
            avgAmount: (Math.floor(Math.random() * 5000) + 2500) * 100,
          })),
        },
        performance: {
          cleanerUtilization: 0.72, // 72%
          avgResponseTime: 180, // 3 minutes
          avgCompletionTime: 120, // 2 hours
          matchingSuccess: 0.85, // 85%
          repeatClientRate: 0.68, // 68%
          topCleaners: [
            { id: '1', name: 'Grace Wanjiru', bookings: 156, revenue: 234500, rating: 4.9 },
            { id: '2', name: 'Mary Njoroge', bookings: 134, revenue: 198700, rating: 4.8 },
            { id: '3', name: 'Susan Muriuki', bookings: 123, revenue: 187600, rating: 4.7 },
            { id: '4', name: 'Jane Kamau', bookings: 112, revenue: 165400, rating: 4.8 },
            { id: '5', name: 'Lucy Wanjiku', bookings: 98, revenue: 143200, rating: 4.9 },
          ],
        },
      };

      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockData;
    },
  });

  const formatCompact = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: value > 999 ? 1 : 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getGrowthIcon = (rate: number) => {
    return rate > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getGrowthColor = (rate: number) => {
    return rate > 0 ? 'text-green-600' : 'text-red-600';
  };

  const exportData = () => {
    // Mock export functionality
    const dataStr = JSON.stringify(analyticsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">Analytics Dashboard</h2>
          <p className="text-ink-600">Platform performance and insights</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="input"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <button
            onClick={exportData}
            className="btn-secondary px-4 py-2"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </button>
          
          <button
            onClick={() => setIsLoading(true)}
            className="btn-ghost px-4 py-2"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Tabs */}
      <div className="flex space-x-1 border-b border-slate-200">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'bookings', label: 'Bookings', icon: Calendar },
          { key: 'financials', label: 'Financials', icon: DollarSign },
          { key: 'performance', label: 'Performance', icon: Activity },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedMetric(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              selectedMetric === tab.key
                ? 'text-brand-700 border-brand-600 bg-brand-50'
                : 'text-ink-600 border-transparent hover:text-ink-900 hover:border-slate-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedMetric === 'overview' && analyticsData && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className={`flex items-center gap-1 ${getGrowthColor(analyticsData.overview.growthRates.users)}`}>
                  {getGrowthIcon(analyticsData.overview.growthRates.users)}
                  <span className="text-sm font-medium">
                    {formatPercent(analyticsData.overview.growthRates.users)}
                  </span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-ink-900">{formatCompact(analyticsData.overview.totalUsers)}</h3>
              <p className="text-sm text-ink-600">Total Users</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div className={`flex items-center gap-1 ${getGrowthColor(analyticsData.overview.growthRates.bookings)}`}>
                  {getGrowthIcon(analyticsData.overview.growthRates.bookings)}
                  <span className="text-sm font-medium">
                    {formatPercent(analyticsData.overview.growthRates.bookings)}
                  </span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-ink-900">{formatCompact(analyticsData.overview.totalBookings)}</h3>
              <p className="text-sm text-ink-600">Total Bookings</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div className={`flex items-center gap-1 ${getGrowthColor(analyticsData.overview.growthRates.revenue)}`}>
                  {getGrowthIcon(analyticsData.overview.growthRates.revenue)}
                  <span className="text-sm font-medium">
                    {formatPercent(analyticsData.overview.growthRates.revenue)}
                  </span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-ink-900">{formatKES(analyticsData.overview.totalRevenue)}</h3>
              <p className="text-sm text-ink-600">Total Revenue</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Excellent</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-ink-900">{analyticsData.overview.avgRating.toFixed(1)}</h3>
              <p className="text-sm text-ink-600">Average Rating</p>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink-600">Total Cleaners</p>
                  <p className="text-lg font-bold text-ink-900">{formatCompact(analyticsData.overview.totalCleaners)}</p>
                </div>
                <div className={`flex items-center gap-1 ${getGrowthColor(analyticsData.overview.growthRates.cleaners)}`}>
                  {getGrowthIcon(analyticsData.overview.growthRates.cleaners)}
                  <span className="text-sm font-medium">
                    {formatPercent(analyticsData.overview.growthRates.cleaners)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink-600">Total Clients</p>
                  <p className="text-lg font-bold text-ink-900">{formatCompact(analyticsData.overview.totalClients)}</p>
                </div>
                <Users className="h-5 w-5 text-slate-400" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink-600">Avg Booking Value</p>
                  <p className="text-lg font-bold text-ink-900">{formatKES(analyticsData.overview.avgBookingValue)}</p>
                </div>
                <DollarSign className="h-5 w-5 text-slate-400" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink-600">Retention Rate</p>
                  <p className="text-lg font-bold text-ink-900">{formatPercent(analyticsData.overview.retentionRate)}</p>
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Good</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Indicators */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-ink-900 mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-600">Cleaner Utilization</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500"
                        style={{ width: `${analyticsData.performance.cleanerUtilization * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-ink-900">
                      {formatPercent(analyticsData.performance.cleanerUtilization)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-600">Matching Success</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500"
                        style={{ width: `${analyticsData.performance.matchingSuccess * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-ink-900">
                      {formatPercent(analyticsData.performance.matchingSuccess)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-600">Repeat Client Rate</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500"
                        style={{ width: `${analyticsData.performance.repeatClientRate * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-ink-900">
                      {formatPercent(analyticsData.performance.repeatClientRate)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-600">Dispute Rate</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${analyticsData.overview.disputeRate > 0.05 ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(analyticsData.overview.disputeRate * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${analyticsData.overview.disputeRate > 0.05 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatPercent(analyticsData.overview.disputeRate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-ink-900 mb-4">Top Performers</h3>
              <div className="space-y-3">
                {analyticsData.performance.topCleaners.map((cleaner, index) => (
                  <div key={cleaner.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink-900">{cleaner.name}</p>
                        <p className="text-xs text-ink-500">{cleaner.bookings} bookings</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-ink-900">{formatKES(cleaner.revenue)}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current text-amber-500" />
                        <span className="text-xs text-ink-600">{cleaner.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {selectedMetric === 'bookings' && analyticsData && (
        <div className="space-y-6">
          {/* Service Performance */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-ink-900 mb-4">Service Performance</h3>
            <div className="space-y-4">
              {analyticsData.bookings.services.map((service) => (
                <div key={service.serviceType} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-ink-900">{service.serviceType}</span>
                      <span className="text-sm text-ink-600">{service.count.toLocaleString()} bookings</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-500"
                        style={{ width: `${(service.count / Math.max(...analyticsData.bookings.services.map(s => s.count))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm font-medium text-ink-900">{formatKES(service.revenue)}</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current text-amber-500" />
                      <span className="text-xs text-ink-600">{service.avgRating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Geographic Distribution */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-ink-900 mb-4">Geographic Distribution</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {analyticsData.bookings.cities.map((city) => (
                <div key={city.city} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="font-medium text-ink-900">{city.city}</p>
                      <p className="text-xs text-ink-500">{city.activeCleaners} active cleaners</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-ink-900">{city.bookings.toLocaleString()}</p>
                    <p className="text-xs text-ink-600">{formatKES(city.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Financials Tab */}
      {selectedMetric === 'financials' && analyticsData && (
        <div className="space-y-6">
          {/* Payment Methods */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-ink-900 mb-4">Payment Methods</h3>
            <div className="space-y-4">
              {analyticsData.financials.paymentMethods.map((method) => (
                <div key={method.method} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-ink-900">{method.method.replace('_', ' ')}</span>
                      <span className="text-sm text-ink-600">{method.count.toLocaleString()} transactions</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500"
                        style={{ width: `${method.percentage * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm font-medium text-ink-900">{formatKES(method.amount)}</p>
                    <p className="text-xs text-ink-600">{formatPercent(method.percentage)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-ink-600">Total GMV</p>
                  <p className="text-lg font-bold text-ink-900">{formatKES(analyticsData.overview.totalGMV)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-ink-600">Platform Revenue</p>
                  <p className="text-lg font-bold text-ink-900">{formatKES(analyticsData.overview.totalRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-ink-600">Take Rate</p>
                  <p className="text-lg font-bold text-ink-900">
                    {formatPercent(analyticsData.overview.totalRevenue / analyticsData.overview.totalGMV)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {selectedMetric === 'performance' && analyticsData && (
        <div className="space-y-6">
          {/* Key Performance Indicators */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-ink-600">Avg Response Time</p>
                  <p className="text-lg font-bold text-ink-900">
                    {Math.floor(analyticsData.performance.avgResponseTime / 60)}m {analyticsData.performance.avgResponseTime % 60}s
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-ink-600">Avg Completion Time</p>
                  <p className="text-lg font-bold text-ink-900">
                    {Math.floor(analyticsData.performance.avgCompletionTime / 60)}h {analyticsData.performance.avgCompletionTime % 60}m
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-ink-600">Matching Success</p>
                  <p className="text-lg font-bold text-ink-900">{formatPercent(analyticsData.performance.matchingSuccess)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <Users className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-ink-600">Cleaner Utilization</p>
                  <p className="text-lg font-bold text-ink-900">{formatPercent(analyticsData.performance.cleanerUtilization)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-ink-900 mb-4">Performance Alerts</h3>
            <div className="space-y-3">
              {analyticsData.overview.disputeRate > 0.05 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">High Dispute Rate</p>
                    <p className="text-sm text-red-700">
                      Dispute rate is {formatPercent(analyticsData.overview.disputeRate)} which exceeds the 5% threshold.
                    </p>
                  </div>
                </div>
              )}

              {analyticsData.performance.cleanerUtilization < 0.6 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50">
                  <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Low Cleaner Utilization</p>
                    <p className="text-sm text-amber-700">
                      Cleaner utilization is {formatPercent(analyticsData.performance.cleanerUtilization)} which is below optimal levels.
                    </p>
                  </div>
                </div>
              )}

              {analyticsData.performance.matchingSuccess < 0.8 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50">
                  <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Matching Success Issues</p>
                    <p className="text-sm text-amber-700">
                      Matching success rate is {formatPercent(analyticsData.performance.matchingSuccess)} which may indicate algorithm issues.
                    </p>
                  </div>
                </div>
              )}

              {analyticsData.overview.disputeRate <= 0.05 && analyticsData.performance.cleanerUtilization >= 0.6 && analyticsData.performance.matchingSuccess >= 0.8 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">All Metrics Healthy</p>
                    <p className="text-sm text-green-700">
                      All key performance indicators are within acceptable ranges.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {analyticsLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600 mb-4" />
            <p className="text-sm text-ink-600">Loading analytics data...</p>
          </div>
        </div>
      )}
    </div>
  );
}
