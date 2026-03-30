'use client';
// Mama Fua — Push Notification Manager Component
// KhimTech | 2026

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  BellRing, 
  BellOff, 
  Smartphone, 
  Globe, 
  CheckCheck, 
  X, 
  AlertTriangle, 
  Info, 
  Send, 
  RefreshCw, 
  Settings, 
  Users, 
  Clock, 
  Zap,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  Plus
} from 'lucide-react';
import { userApi } from '@/lib/api';

interface DeviceToken {
  id: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceName: string;
  lastActiveAt: string;
  isActive: boolean;
}

interface PushCampaign {
  id: string;
  title: string;
  message: string;
  targetAudience: string;
  scheduledTime: string;
  status: 'draft' | 'scheduled' | 'sent' | 'delivered' | 'failed';
  sentCount: number;
  deliveryRate: number;
  createdAt: string;
}

interface PushNotificationManagerProps {
  className?: string;
}

export function PushNotificationManager({ className = '' }: PushNotificationManagerProps) {
  const [activeTab, setActiveTab] = useState<'devices' | 'campaigns' | 'templates'>('devices');
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: devicesData = [], isLoading: devicesLoading } = useQuery<DeviceToken[]>({
    queryKey: ['push-devices'],
    queryFn: async () => {
      const response = await userApi.getRegisteredDevices();
      return (response.data.data as DeviceToken[]) || [];
    },
  });

  const { data: campaignsData = [], isLoading: campaignsLoading } = useQuery<PushCampaign[]>({
    queryKey: ['push-campaigns'],
    queryFn: async () => {
      const response = await userApi.getPushCampaigns();
      return (response.data.data as PushCampaign[]) || [];
    },
  });

  const registerDevice = useMutation({
    mutationFn: userApi.registerDeviceToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-devices'] });
      setShowDeviceModal(false);
    },
  });

  const unregisterDevice = useMutation({
    mutationFn: userApi.unregisterDeviceToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-devices'] });
    },
  });

  const sendTestNotification = useMutation({
    mutationFn: (deviceToken: string) => userApi.sendTestPush(deviceToken),
    onSuccess: () => {
      // Show success message
    },
  });

  const campaignTemplates = [
    {
      name: 'Booking Reminder',
      title: 'Don\'t forget your appointment!',
      message: 'Your cleaning service is scheduled for tomorrow at {time}. We\'ll send you a reminder 1 hour before the appointment.',
      targetAudience: 'clients_with_bookings',
    },
    {
      name: 'Promotional Offer',
      title: 'Special Offer Inside!',
      message: 'Get 20% off your next booking with code CLEAN20. Limited time offer!',
      targetAudience: 'all_clients',
    },
    {
      name: 'Service Update',
      title: 'New Feature Available',
      message: 'Deep cleaning services are now available! Book now for a thorough cleaning experience.',
      targetAudience: 'all_users',
    },
    {
      name: 'Cleaner Alert',
      title: 'New Job Available',
      message: 'A new cleaning job is available in your area. Open the app to accept it quickly.',
      targetAudience: 'cleaners',
    },
  ];

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'ios':
        return '🍎';
      case 'android':
        return '🤖';
      case 'web':
        return '🌐';
      default:
        return '📱';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'inactive':
        return 'bg-slate-100 text-slate-700';
      case 'expired':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-700';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'sent':
        return 'bg-amber-100 text-amber-700';
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-ink-900">Push Notifications</h2>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowDeviceModal(true)}
            className="btn-primary px-4 py-2 text-sm"
          >
            <Smartphone className="mr-2 h-4 w-4" />
            Register Device
          </button>
          
          <button className="btn-secondary px-4 py-2 text-sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Status
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          {[
            { key: 'devices', label: 'Devices', icon: Smartphone },
            { key: 'campaigns', label: 'Campaigns', icon: BellRing },
            { key: 'templates', label: 'Templates', icon: Settings },
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

      {/* Devices Tab */}
      {activeTab === 'devices' && (
        <div className="space-y-4">
          {devicesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Smartphone className="mx-auto h-8 w-8 animate-spin text-brand-600 mb-3" />
                <p className="text-sm text-ink-600">Loading devices...</p>
              </div>
            </div>
          ) : devicesData?.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <Smartphone className="mx-auto h-12 w-12 text-ink-300 mb-4" />
              <h3 className="text-lg font-semibold text-ink-900 mb-2">No Registered Devices</h3>
              <p className="text-sm text-ink-600 mb-6">
                Register your devices to receive push notifications for bookings, promotions, and important updates.
              </p>
              <button
                onClick={() => setShowDeviceModal(true)}
                className="btn-primary px-6 py-3"
              >
                <Plus className="mr-2 h-4 w-4" />
                Register Your First Device
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {devicesData?.map((device: DeviceToken) => (
                <div key={device.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getPlatformIcon(device.platform)}</div>
                      <div>
                        <h4 className="font-semibold text-ink-900">{device.deviceName}</h4>
                        <p className="text-sm text-ink-600 capitalize">{device.platform}</p>
                        <p className="text-xs text-ink-500">
                          Last active: {new Date(device.lastActiveAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(device.isActive ? 'active' : 'inactive')}`}>
                        {device.isActive ? 'Active' : 'Inactive'}
                      </span>
                      
                      <button
                        onClick={() => sendTestNotification.mutate(device.token)}
                        disabled={sendTestNotification.isPending}
                        className="btn-ghost px-3 py-1 text-sm"
                        title="Send test notification"
                      >
                        <Send className="h-3 w-3" />
                      </button>
                      
                      <button
                        onClick={() => unregisterDevice.mutate(device.token)}
                        disabled={unregisterDevice.isPending}
                        className="btn-ghost px-3 py-1 text-sm text-red-600"
                        title="Unregister device"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-ink-900">Campaign History</h3>
            <button className="btn-primary px-4 py-2 text-sm">
              <BellRing className="mr-2 h-4 w-4" />
              Create Campaign
            </button>
          </div>

          {campaignsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <BellRing className="mx-auto h-8 w-8 animate-spin text-brand-600 mb-3" />
                <p className="text-sm text-ink-600">Loading campaigns...</p>
              </div>
            </div>
          ) : campaignsData?.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <BellRing className="mx-auto h-12 w-12 text-ink-300 mb-4" />
              <h3 className="text-lg font-semibold text-ink-900 mb-2">No Campaigns Yet</h3>
              <p className="text-sm text-ink-600 mb-6">
                Create your first push notification campaign to engage with users about promotions, updates, and important announcements.
              </p>
              <button className="btn-primary px-6 py-3">
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaignsData?.map((campaign: PushCampaign) => (
                <div key={campaign.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-ink-900">{campaign.title}</h4>
                      <p className="text-sm text-ink-600 mt-1">{campaign.message}</p>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-medium ${getCampaignStatusColor(campaign.status)}`}>
                      {campaign.status.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-ink-500">Target</p>
                      <p className="font-medium text-ink-900">{campaign.targetAudience}</p>
                    </div>
                    <div>
                      <p className="text-ink-500">Sent</p>
                      <p className="font-medium text-ink-900">{campaign.sentCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-ink-500">Delivery</p>
                      <p className="font-medium text-ink-900">{campaign.deliveryRate}%</p>
                    </div>
                    <div>
                      <p className="text-ink-500">Created</p>
                      <p className="font-medium text-ink-900">{new Date(campaign.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-ink-900">Campaign Templates</h3>
            <button className="btn-secondary px-4 py-2 text-sm">
              <Settings className="mr-2 h-4 w-4" />
              Manage Templates
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {campaignTemplates.map((template, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-300 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-ink-900">{template.name}</h4>
                    <p className="text-sm text-ink-600">{template.targetAudience}</p>
                  </div>
                </div>
                
                <div className="text-sm text-ink-700">
                  <p className="font-medium mb-2">Title:</p>
                  <p className="text-ink-900">{template.title}</p>
                </div>
                
                <div className="text-sm text-ink-700">
                  <p className="font-medium mb-2">Message:</p>
                  <p className="text-ink-600">{template.message}</p>
                </div>
                
                <button className="btn-ghost w-full mt-3 text-sm">
                  Use This Template
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Device Registration Modal */}
      {showDeviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white p-6 m-4 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-ink-900">Register Device</h3>
              <button
                onClick={() => setShowDeviceModal(false)}
                className="btn-ghost p-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Device Name</label>
                <input
                  type="text"
                  placeholder="My iPhone"
                  className="input"
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Platform</label>
                <select className="input">
                  <option value="">Select platform</option>
                  <option value="ios">iOS</option>
                  <option value="android">Android</option>
                  <option value="web">Web</option>
                </select>
              </div>
              
              <div className="text-sm text-ink-600">
                <Info className="inline h-4 w-4 mr-1" />
                Device tokens are automatically generated when you install the Mama Fua app and enable push notifications.
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeviceModal(false)}
                className="btn-ghost px-6 py-3"
              >
                Cancel
              </button>
              <button className="btn-primary px-6 py-3">
                Register Device
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
