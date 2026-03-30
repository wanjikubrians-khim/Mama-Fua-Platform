'use client';
// Mama Fua — Notification Center Component
// KhimTech | 2026

import { createElement, useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  BellRing, 
  CheckCheck, 
  Settings, 
  X, 
  Archive, 
  Trash2, 
  Star,
  MessageSquare,
  CreditCard,
  Users,
  Calendar,
  AlertTriangle,
  Info,
  ChevronDown,
  Search,
  Filter
} from 'lucide-react';
import { userApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatDistanceToNow } from 'date-fns';

type NotificationType = 
  | 'BOOKING' 
  | 'PAYMENT' 
  | 'REVIEW' 
  | 'CHAT' 
  | 'SYSTEM' 
  | 'PROMOTION' 
  | 'CLEANER_ASSIGNED' 
  | 'CLEANER_EN_ROUTE' 
  | 'CLEANER_ARRIVED' 
  | 'BOOKING_CANCELLED' 
  | 'PAYMENT_RECEIVED' 
  | 'DISPUTE_CREATED' 
  | 'DISPUTE_RESOLVED';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionText?: string;
}

interface NotificationCenterProps {
  className?: string;
  maxVisible?: number;
  showSettings?: boolean;
  onNotificationClick?: (notification: NotificationItem) => void;
}

export function NotificationCenter({ 
  className = '',
  maxVisible = 10,
  showSettings = true,
  onNotificationClick
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: notificationsData = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: ['notifications', activeTab, searchQuery],
    queryFn: async () => {
      const response = await userApi.notifications();
      let notifications: NotificationItem[] = response.data.data || [];

      // Filter by tab
      if (activeTab === 'unread') {
        notifications = notifications.filter((n: NotificationItem) => !n.isRead);
      } else if (activeTab === 'archived') {
        notifications = notifications.filter((n: NotificationItem) => n.isRead && n.createdAt < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      }

      // Filter by search
      if (searchQuery) {
        notifications = notifications.filter((n: NotificationItem) => 
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.body.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Sort by priority and date
      notifications.sort((a: NotificationItem, b: NotificationItem) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const aPriority = priorityOrder[a.priority] || 3;
        const bPriority = priorityOrder[b.priority] || 3;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      return notifications.slice(0, maxVisible);
    },
    enabled: !!user,
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const promises = notificationIds.map(id => userApi.markRead(id));
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: userApi.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: userApi.dismissNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const clearAllNotifications = useMutation({
    mutationFn: () => userApi.clearNotifications('read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: NotificationType) => {
    const iconMap = {
      BOOKING: Calendar,
      PAYMENT: CreditCard,
      REVIEW: Star,
      CHAT: MessageSquare,
      SYSTEM: Info,
      PROMOTION: BellRing,
      CLEANER_ASSIGNED: Users,
      CLEANER_EN_ROUTE: AlertTriangle,
      CLEANER_ARRIVED: CheckCheck,
      BOOKING_CANCELLED: X,
      PAYMENT_RECEIVED: CreditCard,
      DISPUTE_CREATED: AlertTriangle,
      DISPUTE_RESOLVED: CheckCheck,
    };

    return iconMap[type] || Bell;
  };

  const getNotificationColor = (type: NotificationType, priority: string) => {
    if (priority === 'urgent') return 'border-red-200 bg-red-50';
    if (priority === 'high') return 'border-amber-200 bg-amber-50';
    
    const colorMap = {
      BOOKING: 'border-blue-200 bg-blue-50',
      PAYMENT: 'border-green-200 bg-green-50',
      REVIEW: 'border-purple-200 bg-purple-50',
      CHAT: 'border-mint-200 bg-mint-50',
      SYSTEM: 'border-slate-200 bg-slate-50',
      PROMOTION: 'border-brand-200 bg-brand-50',
      CLEANER_ASSIGNED: 'border-brand-200 bg-brand-50',
      CLEANER_EN_ROUTE: 'border-amber-200 bg-amber-50',
      CLEANER_ARRIVED: 'border-green-200 bg-green-50',
      BOOKING_CANCELLED: 'border-red-200 bg-red-50',
      PAYMENT_RECEIVED: 'border-green-200 bg-green-50',
      DISPUTE_CREATED: 'border-red-200 bg-red-50',
      DISPUTE_RESOLVED: 'border-green-200 bg-green-50',
    };

    return colorMap[type] || 'border-slate-200 bg-slate-50';
  };

  const getPriorityBadge = (priority: string) => {
    const badgeMap = {
      urgent: 'bg-red-600 text-white',
      high: 'bg-amber-600 text-white',
      medium: 'bg-blue-600 text-white',
      low: 'bg-slate-600 text-white',
    };

    return badgeMap[priority as keyof typeof badgeMap] || 'bg-slate-600 text-white';
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.isRead) {
      markAsRead.mutate([notification.id]);
    }
    
    if (notification.actionUrl && onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const handleSelectAll = () => {
    const allIds = notificationsData.map((n: NotificationItem) => n.id);
    setSelectedNotifications(new Set(allIds));
  };

  const handleMarkAllAsRead = () => {
    const unreadIds = notificationsData
      .filter((n: NotificationItem) => !n.isRead)
      .map((n: NotificationItem) => n.id);
    if (unreadIds.length > 0) {
      markAllAsRead.mutate();
    }
  };

  const unreadCount = notificationsData.filter((n: NotificationItem) => !n.isRead).length;

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg bg-white p-3 shadow-md hover:shadow-lg transition-shadow"
      >
        <Bell className="h-5 w-5 text-ink-600" />
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute right-0 top-full z-50 mt-2 w-96 rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <h3 className="font-semibold text-ink-900">Notifications</h3>
            
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 pr-4 text-sm"
                />
              </div>

              {/* Settings */}
              {showSettings && (
                <button className="btn-ghost p-2" title="Notification settings">
                  <Settings className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            {[
              { key: 'all', label: 'All', count: notificationsData.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'archived', label: 'Archived', count: 0 }, // Would need archived API
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key 
                    ? 'text-brand-700 border-b-2 border-brand-600 bg-brand-50' 
                    : 'text-ink-600 border-b-2 border-transparent hover:bg-slate-50'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Bulk Actions */}
          {activeTab === 'all' && (
            <div className="flex items-center justify-between border-b border-slate-200 p-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedNotifications.size === notificationsData.length}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-brand-600 rounded"
                />
                <span className="text-sm text-ink-700">Select all</span>
              </div>
              
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={markAllAsRead.isPending}
                    className="btn-ghost px-3 py-1 text-sm"
                  >
                    <CheckCheck className="mr-1 h-3 w-3" />
                    Mark all read
                  </button>
                )}
                
                <button
                  onClick={() => clearAllNotifications.mutate()}
                  disabled={clearAllNotifications.isPending}
                  className="btn-ghost px-3 py-1 text-sm text-red-600"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Clear all
                </button>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <Bell className="mx-auto h-8 w-8 animate-pulse text-brand-600 mb-3" />
                  <p className="text-sm text-ink-600">Loading notifications...</p>
                </div>
              </div>
            ) : notificationsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Bell className="mx-auto h-12 w-12 text-ink-300 mb-3" />
                <h3 className="text-lg font-semibold text-ink-900 mb-2">No notifications</h3>
                <p className="text-sm text-ink-600">
                  {activeTab === 'unread' ? 'No unread notifications' : 'No notifications'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notificationsData.map((notification: NotificationItem) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 p-4 transition-colors hover:bg-slate-50 ${
                      notification.isRead ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    {activeTab === 'all' && (
                      <input
                        type="checkbox"
                        checked={selectedNotifications.has(notification.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedNotifications);
                          if (e.target.checked) {
                            newSelected.add(notification.id);
                          } else {
                            newSelected.delete(notification.id);
                          }
                          setSelectedNotifications(newSelected);
                        }}
                        className="mt-1 h-4 w-4 text-brand-600 rounded"
                      />
                    )}

                    {/* Notification Icon */}
                    <div className={`flex-shrink-0 rounded-lg p-2 ${getNotificationColor(notification.type, notification.priority)}`}>
                      {createElement(getNotificationIcon(notification.type), { className: 'h-5 w-5' })}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-ink-900 text-sm">{notification.title}</h4>
                        
                        <div className="flex items-center gap-2">
                          {/* Priority Badge */}
                          {notification.priority !== 'low' && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityBadge(notification.priority)}`}>
                              {notification.priority.toUpperCase()}
                            </span>
                          )}
                          
                          {/* Time */}
                          <span className="text-xs text-ink-500">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                          
                          {/* Actions */}
                          <div className="flex gap-1">
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead.mutate([notification.id])}
                                disabled={markAsRead.isPending}
                                className="btn-ghost p-1"
                                title="Mark as read"
                              >
                                <CheckCheck className="h-3 w-3" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => deleteNotification.mutate(notification.id)}
                              disabled={deleteNotification.isPending}
                              className="btn-ghost p-1 text-red-600"
                              title="Delete notification"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-ink-600 line-clamp-2">{notification.body}</p>
                      
                      {/* Action Button */}
                      {notification.actionUrl && (
                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className="btn-primary mt-2 px-4 py-2 text-sm"
                        >
                          {notification.actionText || 'View Details'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notificationsData.length > 0 && (
            <div className="border-t border-slate-200 p-3">
              <button className="btn-ghost w-full text-sm text-ink-600">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
