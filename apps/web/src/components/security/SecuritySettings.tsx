'use client';
// Mama Fua — Security Settings Component
// KhimTech | 2026

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ShieldCheck, 
  Key, 
  Smartphone, 
  Mail, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Download, 
  Trash2, 
  Copy, 
  QrCode,
  Info,
  Loader2,
  Settings
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number and special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const sessionManagementSchema = z.object({
  maxSessions: z.number().min(1).max(10),
  sessionTimeout: z.number().min(15).max(1440),
});

type PasswordChangeData = z.infer<typeof passwordChangeSchema>;
type SessionManagementData = z.infer<typeof sessionManagementSchema>;

interface SecuritySettingsProps {
  className?: string;
}

export function SecuritySettings({ className = '' }: SecuritySettingsProps) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'password' | 'sessions' | 'privacy'>('overview');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [showSecret, setShowSecret] = useState(false);

  const { data: securityData, isLoading: securityLoading } = useQuery({
    queryKey: ['security-settings'],
    queryFn: async () => {
      // Mock API call - replace with actual implementation
      return {
        twoFactorEnabled: false,
        twoFactorMethod: null,
        lastPasswordChange: '2024-02-15T10:30:00Z',
        activeSessions: [
          {
            id: '1',
            device: 'Chrome on Windows',
            ip: '192.168.1.100',
            location: 'Nairobi, Kenya',
            lastActive: '2024-03-15T14:30:00Z',
            isCurrent: true,
          },
          {
            id: '2',
            device: 'Safari on iPhone',
            ip: '192.168.1.101',
            location: 'Nairobi, Kenya',
            lastActive: '2024-03-14T18:45:00Z',
            isCurrent: false,
          },
        ],
        loginAlerts: true,
        sessionTimeout: 120,
        maxSessions: 3,
        privacySettings: {
          profileVisibility: 'public',
          showPhone: false,
          showEmail: false,
          allowMarketing: false,
        },
      };
    },
  });

  const changePassword = useMutation({
    mutationFn: async (data: PasswordChangeData) => {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-settings'] });
      setShowPasswordForm(false);
    },
  });

  const revokeSession = useMutation({
    mutationFn: async (sessionId: string) => {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-settings'] });
    },
  });

  const updatePrivacySettings = useMutation({
    mutationFn: async (settings: any) => {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-settings'] });
    },
  });

  const passwordForm = useForm<PasswordChangeData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const sessionForm = useForm<SessionManagementData>({
    resolver: zodResolver(sessionManagementSchema),
    defaultValues: {
      maxSessions: securityData?.maxSessions || 3,
      sessionTimeout: securityData?.sessionTimeout || 120,
    },
  });

  const handlePasswordChange = (data: PasswordChangeData) => {
    changePassword.mutate(data);
  };

  const handleRevokeSession = (sessionId: string) => {
    revokeSession.mutate(sessionId);
  };

  const handlePrivacyUpdate = (settings: any) => {
    updatePrivacySettings.mutate(settings);
  };

  const getSessionIcon = (device: string) => {
    if (device.toLowerCase().includes('chrome')) return '🌐';
    if (device.toLowerCase().includes('safari')) return '🧭';
    if (device.toLowerCase().includes('firefox')) return '🦊';
    if (device.toLowerCase().includes('iphone') || device.toLowerCase().includes('android')) return '📱';
    return '💻';
  };

  const formatLastActive = (date: string) => {
    const now = new Date();
    const lastActive = new Date(date);
    const diffMs = now.getTime() - lastActive.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Active now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  if (securityLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600 mb-4" />
            <p className="text-sm text-ink-600">Loading security settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">Security Settings</h2>
          <p className="text-ink-600">Manage your account security and privacy</p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-ink-600">
          <ShieldCheck className="h-4 w-4" />
          <span>Security Level: Good</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-200">
        {[
          { key: 'overview', label: 'Overview', icon: ShieldCheck },
          { key: 'password', label: 'Password', icon: Key },
          { key: 'sessions', label: 'Sessions', icon: Clock },
          { key: 'privacy', label: 'Privacy', icon: Eye },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.key
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
      {activeTab === 'overview' && securityData && (
        <div className="space-y-6">
          {/* Security Status */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-ink-900 mb-4">Security Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    securityData.twoFactorEnabled ? 'bg-green-100' : 'bg-amber-100'
                  }`}>
                    <ShieldCheck className={`h-5 w-5 ${
                      securityData.twoFactorEnabled ? 'text-green-600' : 'text-amber-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-ink-900">Two-Factor Authentication</p>
                    <p className="text-sm text-ink-600">
                      {securityData.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShow2FASetup(true)}
                  className={`btn-secondary px-4 py-2 ${
                    securityData.twoFactorEnabled ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {securityData.twoFactorEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-100">
                    <Key className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-ink-900">Password Strength</p>
                    <p className="text-sm text-ink-600">
                      Last changed {new Date(securityData.lastPasswordChange).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="btn-secondary px-4 py-2"
                >
                  Change
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-purple-100">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-ink-900">Active Sessions</p>
                    <p className="text-sm text-ink-600">
                      {securityData.activeSessions.length} active sessions
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setActiveTab('sessions')}
                  className="btn-secondary px-4 py-2"
                >
                  Manage
                </button>
              </div>
            </div>
          </div>

          {/* Security Recommendations */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-ink-900 mb-4">Security Recommendations</h3>
            
            <div className="space-y-3">
              {!securityData.twoFactorEnabled && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <p className="font-medium">Enable Two-Factor Authentication</p>
                    <p>Add an extra layer of security to your account.</p>
                  </div>
                </div>
              )}

              {securityData.activeSessions.length > 3 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Review Active Sessions</p>
                    <p>You have multiple active sessions. Consider revoking unused ones.</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-sm text-green-700">
                  <p className="font-medium">Strong Password</p>
                  <p>Your password meets our security requirements.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="space-y-6">
          {!showPasswordForm ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-ink-900 mb-4">Password Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink-900">Current Password</p>
                    <p className="text-sm text-ink-600">
                      Last changed {new Date(securityData?.lastPasswordChange || '').toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="btn-secondary px-4 py-2"
                  >
                    Change Password
                  </button>
                </div>

                <div className="rounded-lg bg-blue-50 p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Password Requirements</h4>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li>• At least 8 characters long</li>
                    <li>• Contains uppercase letter</li>
                    <li>• Contains lowercase letter</li>
                    <li>• Contains number</li>
                    <li>• Contains special character</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-ink-900 mb-4">Change Password</h3>
              
              <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-700">Current Password</label>
                  <input
                    {...passwordForm.register('currentPassword')}
                    type="password"
                    className="input"
                    placeholder="Enter current password"
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="mt-1 text-xs text-red-500">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-700">New Password</label>
                  <input
                    {...passwordForm.register('newPassword')}
                    type="password"
                    className="input"
                    placeholder="Enter new password"
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="mt-1 text-xs text-red-500">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-700">Confirm New Password</label>
                  <input
                    {...passwordForm.register('confirmPassword')}
                    type="password"
                    className="input"
                    placeholder="Confirm new password"
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(false)}
                    className="btn-ghost px-6 py-3"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={changePassword.isPending}
                    className="btn-primary px-6 py-3"
                  >
                    {changePassword.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      <>
                        <Key className="mr-2 h-4 w-4" />
                        Change Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && securityData && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-ink-900 mb-4">Active Sessions</h3>
            
            <div className="space-y-4">
              {securityData.activeSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getSessionIcon(session.device)}
                    </div>
                    <div>
                      <p className="font-medium text-ink-900">{session.device}</p>
                      <p className="text-sm text-ink-600">{session.location}</p>
                      <p className="text-xs text-ink-500">IP: {session.ip}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-ink-600">Last active:</span>
                      <span className="text-sm font-medium text-ink-900">{formatLastActive(session.lastActive)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {session.isCurrent && (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                          Current
                        </span>
                      )}
                      
                      {!session.isCurrent && (
                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={revokeSession.isPending}
                          className="btn-ghost px-3 py-1 text-sm text-red-600"
                        >
                          {revokeSession.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session Settings */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-ink-900 mb-4">Session Settings</h3>
            
            <form onSubmit={sessionForm.handleSubmit((data) => handlePrivacyUpdate(data))} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-700">Maximum Sessions</label>
                  <input
                    {...sessionForm.register('maxSessions')}
                    type="number"
                    className="input"
                    min="1"
                    max="10"
                  />
                  <p className="mt-1 text-xs text-ink-500">Maximum number of concurrent sessions</p>
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-700">Session Timeout (minutes)</label>
                  <input
                    {...sessionForm.register('sessionTimeout')}
                    type="number"
                    className="input"
                    min="15"
                    max="1440"
                  />
                  <p className="mt-1 text-xs text-ink-500">Auto-logout after inactivity</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={updatePrivacySettings.isPending}
                className="btn-primary px-6 py-3"
              >
                {updatePrivacySettings.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Settings className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Privacy Tab */}
      {activeTab === 'privacy' && securityData && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-ink-900 mb-4">Privacy Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-900">Profile Visibility</p>
                  <p className="text-sm text-ink-600">Control who can see your profile</p>
                </div>
                <select
                  value={securityData.privacySettings.profileVisibility}
                  onChange={(e) => handlePrivacyUpdate({ 
                    ...securityData.privacySettings, 
                    profileVisibility: e.target.value 
                  })}
                  className="input"
                >
                  <option value="public">Public</option>
                  <option value="clients">Clients Only</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-900">Show Phone Number</p>
                  <p className="text-sm text-ink-600">Display your phone number on profile</p>
                </div>
                <input
                  type="checkbox"
                  checked={securityData.privacySettings.showPhone}
                  onChange={(e) => handlePrivacyUpdate({ 
                    ...securityData.privacySettings, 
                    showPhone: e.target.checked 
                  })}
                  className="h-4 w-4 text-brand-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-900">Show Email Address</p>
                  <p className="text-sm text-ink-600">Display your email on profile</p>
                </div>
                <input
                  type="checkbox"
                  checked={securityData.privacySettings.showEmail}
                  onChange={(e) => handlePrivacyUpdate({ 
                    ...securityData.privacySettings, 
                    showEmail: e.target.checked 
                  })}
                  className="h-4 w-4 text-brand-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-900">Marketing Communications</p>
                  <p className="text-sm text-ink-600">Receive promotional emails and notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={securityData.privacySettings.allowMarketing}
                  onChange={(e) => handlePrivacyUpdate({ 
                    ...securityData.privacySettings, 
                    allowMarketing: e.target.checked 
                  })}
                  className="h-4 w-4 text-brand-600 rounded"
                />
              </div>
            </div>
          </div>

          {/* Data Export */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-ink-900 mb-4">Data Management</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-900">Export Your Data</p>
                  <p className="text-sm text-ink-600">Download all your personal data</p>
                </div>
                <button className="btn-secondary px-4 py-2">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-900">Delete Account</p>
                  <p className="text-sm text-ink-600">Permanently delete your account and data</p>
                </div>
                <button className="btn-secondary px-4 py-2 text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white p-6 m-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-ink-900">Two-Factor Authentication</h3>
              <button
                onClick={() => setShow2FASetup(false)}
                className="btn-ghost p-2"
              >
                ×
              </button>
            </div>

            {/* Import TwoFactorAuth component here */}
            <div className="text-center py-8">
              <ShieldCheck className="mx-auto h-12 w-12 text-brand-600 mb-4" />
              <p className="text-ink-600">2FA setup component would be integrated here</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
