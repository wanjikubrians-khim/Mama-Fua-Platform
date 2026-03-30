'use client';
// Mama Fua — Profile & Settings
// KhimTech | 2026

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone, MapPin, ShieldCheck, Bell, CreditCard, HelpCircle, LogOut, Loader2, Camera, Edit2, Check } from 'lucide-react';
import { userApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().min(9, 'Enter a valid phone number'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { user, setUser, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'payment' | 'help'>('profile');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingPhoto, setEditingPhoto] = useState(false);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userApi.getProfile(),
  });

  const profile = profileData?.data?.data ?? user;

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    profileForm.reset({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
    });
  }, [profile?.email, profile?.firstName, profile?.lastName, profile?.phone, profileForm]);

  const updateProfile = useMutation({
    mutationFn: (data: ProfileForm) => userApi.updateProfile(data),
    onSuccess: (res) => {
      setSuccessMessage('Profile updated successfully');
      setUser(res.data.data);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const updatePassword = useMutation({
    mutationFn: (data: PasswordForm) => userApi.updatePassword(data),
    onSuccess: () => {
      setSuccessMessage('Password updated successfully');
      setShowPasswordForm(false);
      passwordForm.reset();
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const handleProfileSubmit = (data: ProfileForm) => {
    updateProfile.mutate(data);
  };

  const handlePasswordSubmit = (data: PasswordForm) => {
    updatePassword.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    });
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'security' as const, label: 'Security', icon: ShieldCheck },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'payment' as const, label: 'Payment', icon: CreditCard },
    { id: 'help' as const, label: 'Help', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-ink-900">Profile & Settings</h1>
          <p className="mt-2 text-sm text-ink-500">Manage your account information and preferences</p>
        </header>

        {successMessage && (
          <div className="mb-6 rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm text-mint-800">
            <Check className="mr-2 inline h-4 w-4" />
            {successMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.25fr_1fr]">
          <nav className="lg:sticky lg:top-6 lg:h-fit">
            <div className="section-shell p-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-600 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>

          <main className="space-y-6">
            {activeTab === 'profile' && (
              <div className="section-shell p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-ink-900">Profile Information</h2>
                  <p className="mt-1 text-sm text-ink-500">Update your personal information</p>
                </div>

                <div className="mb-6 flex items-center gap-4">
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
                      {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                    </div>
                    <button
                      onClick={() => setEditingPhoto(!editingPhoto)}
                      className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700"
                    >
                      <Camera className="h-3 w-3" />
                    </button>
                  </div>
                  <div>
                    <p className="font-semibold text-ink-900">
                      {profile?.firstName} {profile?.lastName}
                    </p>
                    <p className="text-sm text-ink-500">{profile?.role}</p>
                  </div>
                </div>

                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-ink-700">First name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                        <input
                          {...profileForm.register('firstName')}
                          className="input pl-10"
                          placeholder="First name"
                        />
                      </div>
                      {profileForm.formState.errors.firstName && (
                        <p className="mt-1 text-xs text-red-500">
                          {profileForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-ink-700">Last name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                        <input
                          {...profileForm.register('lastName')}
                          className="input pl-10"
                          placeholder="Last name"
                        />
                      </div>
                      {profileForm.formState.errors.lastName && (
                        <p className="mt-1 text-xs text-red-500">
                          {profileForm.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-ink-700">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      <input
                        {...profileForm.register('email')}
                        className="input pl-10"
                        placeholder="email@example.com"
                        type="email"
                      />
                    </div>
                    {profileForm.formState.errors.email && (
                      <p className="mt-1 text-xs text-red-500">
                        {profileForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-ink-700">Phone number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      <input
                        {...profileForm.register('phone')}
                        className="input pl-10"
                        placeholder="+254 712 345 678"
                        type="tel"
                      />
                    </div>
                    {profileForm.formState.errors.phone && (
                      <p className="mt-1 text-xs text-red-500">
                        {profileForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3">
                    <button type="button" className="btn-ghost px-6 py-2.5">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateProfile.isPending}
                      className="btn-primary px-6 py-2.5"
                    >
                      {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="section-shell p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-ink-900">Security</h2>
                    <p className="mt-1 text-sm text-ink-500">Manage your password and security settings</p>
                  </div>

                  {!showPasswordForm ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                        <div>
                          <p className="font-semibold text-ink-900">Password</p>
                          <p className="text-sm text-ink-500">Last updated recently</p>
                        </div>
                        <button
                          onClick={() => setShowPasswordForm(true)}
                          className="btn-ghost px-4 py-2"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-ink-700">Current password</label>
                        <input
                          {...passwordForm.register('currentPassword')}
                          className="input"
                          type="password"
                          placeholder="Enter current password"
                        />
                        {passwordForm.formState.errors.currentPassword && (
                          <p className="mt-1 text-xs text-red-500">
                            {passwordForm.formState.errors.currentPassword.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-ink-700">New password</label>
                        <input
                          {...passwordForm.register('newPassword')}
                          className="input"
                          type="password"
                          placeholder="Enter new password"
                        />
                        {passwordForm.formState.errors.newPassword && (
                          <p className="mt-1 text-xs text-red-500">
                            {passwordForm.formState.errors.newPassword.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-ink-700">Confirm new password</label>
                        <input
                          {...passwordForm.register('confirmPassword')}
                          className="input"
                          type="password"
                          placeholder="Confirm new password"
                        />
                        {passwordForm.formState.errors.confirmPassword && (
                          <p className="mt-1 text-xs text-red-500">
                            {passwordForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordForm(false);
                            passwordForm.reset();
                          }}
                          className="btn-ghost px-6 py-2.5"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={updatePassword.isPending}
                          className="btn-primary px-6 py-2.5"
                        >
                          {updatePassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Update password
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="section-shell p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-ink-900">Notification Preferences</h2>
                  <p className="mt-1 text-sm text-ink-500">Control how you receive notifications</p>
                </div>

                <div className="space-y-4">
                  {[
                    { title: 'Booking updates', description: 'Get notified about booking status changes' },
                    { title: 'Messages', description: 'Receive messages from cleaners and clients' },
                    { title: 'Promotions', description: 'Get updates about special offers and new features' },
                    { title: 'Account updates', description: 'Important updates about your account' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                      <div>
                        <p className="font-semibold text-ink-900">{item.title}</p>
                        <p className="text-sm text-ink-500">{item.description}</p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-brand-600">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="section-shell p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-ink-900">Payment Methods</h2>
                  <p className="mt-1 text-sm text-ink-500">Manage your payment options</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                        <span className="text-sm font-bold text-green-700">M</span>
                      </div>
                      <div>
                        <p className="font-semibold text-ink-900">M-Pesa</p>
                        <p className="text-sm text-ink-500">•••• {profile?.phone?.slice(-4)}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Default
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'help' && (
              <div className="section-shell p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-ink-900">Help & Support</h2>
                  <p className="mt-1 text-sm text-ink-500">Get help with your account and bookings</p>
                </div>

                <div className="space-y-4">
                  {[
                    { title: 'FAQs', description: 'Find answers to common questions' },
                    { title: 'Contact Support', description: 'Get in touch with our support team' },
                    { title: 'Terms of Service', description: 'Read our terms and conditions' },
                    { title: 'Privacy Policy', description: 'Learn about your privacy' },
                  ].map((item) => (
                    <button
                      key={item.title}
                      className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                    >
                      <p className="font-semibold text-ink-900">{item.title}</p>
                      <p className="text-sm text-ink-500">{item.description}</p>
                    </button>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={logout}
                    className="btn-ghost px-6 py-2.5 text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
