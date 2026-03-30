'use client';
// Mama Fua — Notification Settings Component
// KhimTech | 2026

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Bell, 
  BellRing, 
  BellOff, 
  Mail, 
  MessageSquare, 
  CreditCard, 
  Users, 
  Calendar, 
  Star, 
  CheckCheck, 
  Smartphone, 
  Globe, 
  Volume2,
  Settings,
  Save,
  X
} from 'lucide-react';
import { userApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  bookingReminders: z.boolean(),
  promotionEmails: z.boolean(),
  promotionPush: z.boolean(),
  reviewEmails: z.boolean(),
  reviewPush: z.boolean(),
  paymentEmails: z.boolean(),
  paymentPush: z.boolean(),
  chatEmails: z.boolean(),
  chatPush: z.boolean(),
  cleanerUpdates: z.boolean(),
  marketingEmails: z.boolean(),
  soundEnabled: z.boolean(),
  vibrationEnabled: z.boolean(),
  quietHoursStart: z.string(),
  quietHoursEnd: z.string(),
});

type NotificationSettings = z.infer<typeof notificationSettingsSchema>;

interface NotificationSettingsProps {
  className?: string;
  onSave?: () => void;
}

export function NotificationSettings({ className = '', onSave }: NotificationSettingsProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<'general' | 'booking' | 'payment' | 'marketing'>('general');
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: async () => {
      const response = await userApi.getNotificationSettings();
      return response.data.data || {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        bookingReminders: true,
        promotionEmails: false,
        promotionPush: false,
        reviewEmails: true,
        reviewPush: true,
        paymentEmails: true,
        paymentPush: true,
        chatEmails: true,
        chatPush: true,
        cleanerUpdates: false,
        marketingEmails: false,
        soundEnabled: true,
        vibrationEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
      };
    },
    enabled: !!user,
  });

  const updateSettings = useMutation({
    mutationFn: (data: NotificationSettings) => userApi.updateNotificationSettings(data),
    onSuccess: () => {
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      if (onSave) onSave();
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: userApi.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const form = useForm<NotificationSettings>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: settingsData || {},
  });

  // Watch for form changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      const currentSettings = settingsData || {};
      setHasChanges(JSON.stringify(value) !== JSON.stringify(currentSettings));
    });
    return subscription.unsubscribe;
  }, [form.watch, settingsData]);

  const handleSave = () => {
    const formData = form.getValues();
    updateSettings.mutate(formData);
  };

  const handleReset = () => {
    form.reset(settingsData || {});
    setHasChanges(false);
  };

  const generalSettings = [
    {
      key: 'emailNotifications',
      label: 'Email Notifications',
      description: 'Receive notifications via email',
      icon: Mail,
      category: 'general',
    },
    {
      key: 'pushNotifications',
      label: 'Push Notifications',
      description: 'Receive push notifications on your device',
      icon: Bell,
      category: 'general',
    },
    {
      key: 'smsNotifications',
      label: 'SMS Notifications',
      description: 'Receive text message alerts',
      icon: MessageSquare,
      category: 'general',
    },
    {
      key: 'soundEnabled',
      label: 'Notification Sound',
      description: 'Play sound for new notifications',
      icon: Volume2,
      category: 'general',
    },
    {
      key: 'vibrationEnabled',
      label: 'Vibration',
      description: 'Vibrate for new notifications',
      icon: Smartphone,
      category: 'general',
    },
  ];

  const bookingSettings = [
    {
      key: 'bookingReminders',
      label: 'Booking Reminders',
      description: 'Remind me before upcoming bookings',
      icon: Calendar,
      category: 'booking',
    },
    {
      key: 'cleanerUpdates',
      label: 'Cleaner Updates',
      description: 'Updates when cleaner is assigned/en route',
      icon: Users,
      category: 'booking',
    },
  ];

  const paymentSettings = [
    {
      key: 'paymentEmails',
      label: 'Payment Emails',
      description: 'Email confirmations for payments',
      icon: CreditCard,
      category: 'payment',
    },
    {
      key: 'paymentPush',
      label: 'Payment Push',
      description: 'Push notifications for payments',
      icon: BellRing,
      category: 'payment',
    },
  ];

  const marketingSettings = [
    {
      key: 'promotionEmails',
      label: 'Promotional Emails',
      description: 'Special offers and promotions',
      icon: BellRing,
      category: 'marketing',
    },
    {
      key: 'promotionPush',
      label: 'Promotional Push',
      description: 'Push notifications for promotions',
      icon: BellRing,
      category: 'marketing',
    },
    {
      key: 'marketingEmails',
      label: 'Marketing Emails',
      description: 'News and updates about Mama Fua',
      icon: Globe,
      category: 'marketing',
    },
  ];

  const getSettingsForTab = (tab: string) => {
    switch (tab) {
      case 'general':
        return generalSettings;
      case 'booking':
        return bookingSettings;
      case 'payment':
        return paymentSettings;
      case 'marketing':
        return marketingSettings;
      default:
        return generalSettings;
    }
  };

  const renderSettingItem = (setting: any) => {
    const Icon = setting.icon;
    const isChecked = form.watch(setting.key as keyof NotificationSettings);
    
    return (
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            isChecked ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-600'
          }`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-ink-900">{setting.label}</h4>
            <p className="text-sm text-ink-600">{setting.description}</p>
          </div>
        </div>
        
        <label className="relative inline-flex h-6 w-11 items-center cursor-pointer rounded-full border-2 border-slate-300 bg-slate-50 transition-colors peer-checked:bg-brand-600 peer-checked:border-transparent peer-checked:before:absolute peer-checked:before:h-5 peer-checked:before:w-5 peer-checked:before:bg-white peer-checked:before:content-[''] peer-checked:after:absolute peer-checked:after:h-2 peer-checked:after:w-3.5 peer-checked:after:border-l-2 peer-checked:after:border-t-2 peer-checked:after:border-r-2 peer-checked:after:border-b-2 peer-checked:after:border-l-transparent peer-checked:after:border-t-transparent peer-checked:after:border-r-transparent peer-checked:after:bg-brand-600 peer-checked:after:content-['']">
          <input
            {...form.register(setting.key as keyof NotificationSettings)}
            type="checkbox"
            className="sr-only"
          />
        </label>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-ink-900">Notification Settings</h2>
        
        {hasChanges && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-amber-600">You have unsaved changes</span>
            <button
              onClick={handleSave}
              disabled={updateSettings.isPending}
              className="btn-primary px-4 py-2 text-sm"
            >
              {updateSettings.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent border-r-transparent border-b-transparent border-l-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="btn-ghost px-4 py-2 text-sm"
            >
              <X className="mr-2 h-4 w-4" />
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          {[
            { key: 'general', label: 'General', icon: Settings },
            { key: 'booking', label: 'Bookings', icon: Calendar },
            { key: 'payment', label: 'Payments', icon: CreditCard },
            { key: 'marketing', label: 'Marketing', icon: BellRing },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-4 px-1 text-sm font-medium transition-colors border-b-2 border-transparent ${
                activeTab === tab.key 
                  ? 'text-brand-700 border-brand-600' 
                  : 'text-ink-600 border-transparent hover:text-ink-900 hover:border-slate-300'
              }`}
            >
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Settings className="mx-auto h-8 w-8 animate-spin text-brand-600 mb-3" />
            <p className="text-sm text-ink-600">Loading settings...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6 py-6">
          <div className="grid gap-6 md:grid-cols-2">
            {getSettingsForTab(activeTab).map((setting) => (
              <div key={setting.key}>
                {renderSettingItem(setting)}
              </div>
            ))}
          </div>

          {/* Quiet Hours (General Tab Only) */}
          {activeTab === 'general' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-ink-900 mb-4">Quiet Hours</h3>
              <p className="text-sm text-ink-600 mb-4">
                Don&apos;t receive notifications during these hours to avoid disturbances at night.
              </p>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-700">Start Time</label>
                  <input
                    {...form.register('quietHoursStart')}
                    type="time"
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-700">End Time</label>
                  <input
                    {...form.register('quietHoursEnd')}
                    type="time"
                    className="input"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-ink-600">
                <BellOff className="h-4 w-4" />
                <span>Notifications will be silenced between {form.watch('quietHoursStart')} and {form.watch('quietHoursEnd')}</span>
              </div>
            </div>
          )}

          {/* Device Registration Status */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-ink-900 mb-4">Device Registration</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink-900">Current Device</p>
                  <p className="text-xs text-ink-600">Last active: 2 hours ago</p>
                </div>
                <div className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  Registered
                </div>
              </div>
              
              <div className="text-sm text-ink-600">
                Push notifications are enabled on this device. You can manage device settings in your mobile app.
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Quick Actions */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="font-semibold text-ink-900 mb-3">Quick Actions</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => markAllAsRead.mutate()}
            className="btn-ghost px-4 py-2 text-sm"
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All as Read
          </button>
          
          <button
            onClick={() => {
              // Test notification
              if (user) {
                console.log('Test notification would be sent to', user.email);
              }
            }}
            className="btn-secondary px-4 py-2 text-sm"
          >
            <BellRing className="mr-2 h-4 w-4" />
            Test Notification
          </button>
        </div>
      </div>
    </div>
  );
}
