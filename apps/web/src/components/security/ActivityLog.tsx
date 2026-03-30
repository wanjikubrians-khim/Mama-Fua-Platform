'use client';
// Mama Fua — Activity Log Component
// KhimTech | 2026

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  ShieldCheck, 
  Key, 
  Smartphone, 
  Mail, 
  MapPin, 
  Calendar, 
  Filter, 
  Search, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  EyeOff,
  RefreshCw,
  Info,
  Loader2
} from 'lucide-react';

interface ActivityLogEntry {
  id: string;
  userId: string;
  action: string;
  category: 'AUTHENTICATION' | 'SECURITY' | 'PROFILE' | 'BOOKING' | 'PAYMENT' | 'ACCOUNT';
  description: string;
  ipAddress: string;
  userAgent: string;
  location: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  device: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  success: boolean;
  metadata?: Record<string, any>;
}

interface ActivityLogProps {
  className?: string;
  userId?: string;
  adminView?: boolean;
}

export function ActivityLog({ className = '', userId, adminView = false }: ActivityLogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const { data: logData, isLoading: logLoading } = useQuery({
    queryKey: ['activity-log', userId, categoryFilter, severityFilter, dateRange, currentPage, searchQuery],
    queryFn: async () => {
      // Mock API call - replace with actual implementation
      const mockLogs: ActivityLogEntry[] = [
        {
          id: '1',
          userId: userId || 'user1',
          action: 'LOGIN_SUCCESS',
          category: 'AUTHENTICATION',
          description: 'User logged in successfully',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: {
            country: 'Kenya',
            city: 'Nairobi',
            latitude: -1.2921,
            longitude: 36.8219,
          },
          device: 'Chrome on Windows',
          timestamp: '2024-03-15T14:30:00Z',
          severity: 'INFO',
          success: true,
          metadata: {
            method: 'OTP',
            sessionId: 'sess_123456',
          },
        },
        {
          id: '2',
          userId: userId || 'user1',
          action: 'PASSWORD_CHANGED',
          category: 'SECURITY',
          description: 'User changed their password',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: {
            country: 'Kenya',
            city: 'Nairobi',
            latitude: -1.2921,
            longitude: 36.8219,
          },
          device: 'Chrome on Windows',
          timestamp: '2024-03-15T10:15:00Z',
          severity: 'INFO',
          success: true,
          metadata: {
            previousPasswordHash: '***',
            sessionId: 'sess_123456',
          },
        },
        {
          id: '3',
          userId: userId || 'user1',
          action: 'LOGIN_FAILED',
          category: 'AUTHENTICATION',
          description: 'Failed login attempt - invalid OTP',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
          location: {
            country: 'Kenya',
            city: 'Mombasa',
            latitude: -4.0435,
            longitude: 39.6682,
          },
          device: 'Safari on iPhone',
          timestamp: '2024-03-14T18:45:00Z',
          severity: 'WARNING',
          success: false,
          metadata: {
            reason: 'INVALID_OTP',
            attempts: 3,
          },
        },
        {
          id: '4',
          userId: userId || 'user1',
          action: 'TWO_FACTOR_ENABLED',
          category: 'SECURITY',
          description: 'Two-factor authentication enabled',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: {
            country: 'Kenya',
            city: 'Nairobi',
            latitude: -1.2921,
            longitude: 36.8219,
          },
          device: 'Chrome on Windows',
          timestamp: '2024-03-13T16:20:00Z',
          severity: 'INFO',
          success: true,
          metadata: {
            method: 'TOTP',
          },
        },
        {
          id: '5',
          userId: userId || 'user1',
          action: 'PROFILE_UPDATED',
          category: 'PROFILE',
          description: 'User updated profile information',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: {
            country: 'Kenya',
            city: 'Nairobi',
            latitude: -1.2921,
            longitude: 36.8219,
          },
          device: 'Chrome on Windows',
          timestamp: '2024-03-12T09:30:00Z',
          severity: 'INFO',
          success: true,
          metadata: {
            fields: ['firstName', 'lastName', 'bio'],
          },
        },
        {
          id: '6',
          userId: userId || 'user1',
          action: 'BOOKING_CREATED',
          category: 'BOOKING',
          description: 'New booking created',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: {
            country: 'Kenya',
            city: 'Nairobi',
            latitude: -1.2921,
            longitude: 36.8219,
          },
          device: 'Chrome on Windows',
          timestamp: '2024-03-11T14:15:00Z',
          severity: 'INFO',
          success: true,
          metadata: {
            bookingId: 'BK001',
            serviceType: 'Home Cleaning',
            amount: 120000,
          },
        },
        {
          id: '7',
          userId: userId || 'user1',
          action: 'PAYMENT_SUCCESS',
          category: 'PAYMENT',
          description: 'Payment processed successfully',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: {
            country: 'Kenya',
            city: 'Nairobi',
            latitude: -1.2921,
            longitude: 36.8219,
          },
          device: 'Chrome on Windows',
          timestamp: '2024-03-11T14:20:00Z',
          severity: 'INFO',
          success: true,
          metadata: {
            paymentId: 'PAY001',
            method: 'MPESA',
            amount: 120000,
            bookingId: 'BK001',
          },
        },
        {
          id: '8',
          userId: userId || 'user1',
          action: 'ACCOUNT_LOCKED',
          category: 'SECURITY',
          description: 'Account temporarily locked due to multiple failed attempts',
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0',
          location: {
            country: 'Kenya',
            city: 'Kisumu',
            latitude: -0.1022,
            longitude: 34.7617,
          },
          device: 'Firefox on Android',
          timestamp: '2024-03-10T22:30:00Z',
          severity: 'ERROR',
          success: false,
          metadata: {
            reason: 'TOO_MANY_ATTEMPTS',
            lockoutDuration: 900,
          },
        },
      ];

      let filtered = mockLogs;

      // Filter by category
      if (categoryFilter !== 'all') {
        filtered = filtered.filter(log => log.category === categoryFilter);
      }

      // Filter by severity
      if (severityFilter !== 'all') {
        filtered = filtered.filter(log => log.severity === severityFilter);
      }

      // Filter by date range
      if (dateRange !== 'all') {
        const now = new Date();
        const cutoffDate = new Date();
        
        switch (dateRange) {
          case '7d':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case '30d':
            cutoffDate.setDate(now.getDate() - 30);
            break;
          case '90d':
            cutoffDate.setDate(now.getDate() - 90);
            break;
        }
        
        filtered = filtered.filter(log => new Date(log.timestamp) >= cutoffDate);
      }

      // Filter by search
      if (searchQuery) {
        filtered = filtered.filter(log => 
          log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.ipAddress.includes(searchQuery)
        );
      }

      // Sort by timestamp (newest first)
      filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return {
        logs: filtered,
        totalCount: filtered.length,
        totalPages: Math.ceil(filtered.length / 20),
        currentPage: currentPage,
      };
    },
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AUTHENTICATION':
        return <Key className="h-4 w-4" />;
      case 'SECURITY':
        return <ShieldCheck className="h-4 w-4" />;
      case 'PROFILE':
        return <Eye className="h-4 w-4" />;
      case 'BOOKING':
        return <Calendar className="h-4 w-4" />;
      case 'PAYMENT':
        return <Smartphone className="h-4 w-4" />;
      case 'ACCOUNT':
        return <Activity className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string, success: boolean) => {
    if (!success) {
      return 'bg-red-100 text-red-700';
    }
    
    switch (severity) {
      case 'INFO':
        return 'bg-blue-100 text-blue-700';
      case 'WARNING':
        return 'bg-amber-100 text-amber-700';
      case 'ERROR':
        return 'bg-red-100 text-red-700';
      case 'CRITICAL':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getSeverityIcon = (severity: string, success: boolean) => {
    if (!success) {
      return <XCircle className="h-4 w-4" />;
    }
    
    switch (severity) {
      case 'INFO':
        return <Info className="h-4 w-4" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4" />;
      case 'CRITICAL':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  const exportLogs = () => {
    // Mock export functionality
    const logs = logData?.logs || [];
    const csvContent = [
      'Timestamp,Action,Category,Description,Device,IP Address,Location,Severity,Success',
      ...logs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.action,
        log.category,
        log.description,
        log.device,
        log.ipAddress,
        `${log.location.city}, ${log.location.country}`,
        log.severity,
        log.success,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">Activity Log</h2>
          <p className="text-ink-600">
            {adminView ? 'System-wide activity monitoring' : 'Your account activity history'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={exportLogs}
            className="btn-secondary px-4 py-2"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </button>
          
          <button className="btn-ghost px-4 py-2">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-64"
          />
        </div>
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input"
        >
          <option value="all">All Categories</option>
          <option value="AUTHENTICATION">Authentication</option>
          <option value="SECURITY">Security</option>
          <option value="PROFILE">Profile</option>
          <option value="BOOKING">Booking</option>
          <option value="PAYMENT">Payment</option>
          <option value="ACCOUNT">Account</option>
        </select>
        
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="input"
        >
          <option value="all">All Severities</option>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="ERROR">Error</option>
          <option value="CRITICAL">Critical</option>
        </select>
        
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="input"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Activity List */}
      <div className="rounded-xl border border-slate-200 bg-white">
        {logLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600 mb-4" />
              <p className="text-sm text-ink-600">Loading activity log...</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logData?.logs.map((log) => (
              <div key={log.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`rounded-lg p-2 ${getSeverityColor(log.severity, log.success)}`}>
                      {getSeverityIcon(log.severity, log.success)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-ink-900">{log.action}</span>
                        <div className={`rounded-full px-2 py-1 text-xs font-medium ${getSeverityColor(log.severity, log.success)}`}>
                          {log.severity}
                        </div>
                        <div className="rounded-full px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700">
                          {log.category}
                        </div>
                      </div>
                      
                      <p className="text-sm text-ink-700 mb-2">{log.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-ink-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimestamp(log.timestamp)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Smartphone className="h-3 w-3" />
                          <span>{log.device}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{log.location.city}, {log.location.country}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span>IP: {log.ipAddress}</span>
                        </div>
                      </div>
                      
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-2">
                          <button
                            onClick={() => setShowDetails(showDetails === log.id ? null : log.id)}
                            className="btn-ghost px-3 py-1 text-xs"
                          >
                            {showDetails === log.id ? (
                              <>
                                <EyeOff className="mr-1 h-3 w-3" />
                                Hide Details
                              </>
                            ) : (
                              <>
                                <Eye className="mr-1 h-3 w-3" />
                                Show Details
                              </>
                            )}
                          </button>
                          
                          {showDetails === log.id && (
                            <div className="mt-2 rounded-lg bg-slate-50 p-3">
                              <h4 className="text-sm font-medium text-ink-900 mb-2">Metadata</h4>
                              <div className="space-y-1">
                                {Object.entries(log.metadata).map(([key, value]) => (
                                  <div key={key} className="flex justify-between text-xs">
                                    <span className="text-ink-600">{key}:</span>
                                    <span className="text-ink-900 font-mono">
                                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {logData && logData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-600">
            Showing {((logData.currentPage - 1) * 20) + 1} to{' '}
            {Math.min(logData.currentPage * 20, logData.totalCount)} of{' '}
            {logData.totalCount} activities
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn-ghost px-3 py-1 disabled:opacity-50"
            >
              Previous
            </button>
            
            <span className="text-sm text-ink-600">
              Page {currentPage} of {logData.totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(logData.totalPages, currentPage + 1))}
              disabled={currentPage === logData.totalPages}
              className="btn-ghost px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
