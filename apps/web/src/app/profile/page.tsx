'use client';
// Mama Fua — Profile & Settings
// KhimTech | 2026

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell, Camera, Check, ChevronRight, CreditCard, Edit2,
  HelpCircle, Loader2, LogOut, Mail, Phone,
  ShieldCheck, User,
} from 'lucide-react';
import { Avatar } from '@/components/ui';
import { userApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const profileSchema = z.object({
  firstName: z.string().min(2, 'At least 2 characters'),
  lastName:  z.string().min(2, 'At least 2 characters'),
  email:     z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone:     z.string().min(9, 'Enter a valid phone number'),
});

type ProfileForm = z.infer<typeof profileSchema>;
type TabId = 'profile' | 'security' | 'notifications' | 'payment' | 'help';

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: 'profile',       label: 'Profile',        icon: User },
  { id: 'security',      label: 'Security',        icon: ShieldCheck },
  { id: 'notifications', label: 'Notifications',   icon: Bell },
  { id: 'payment',       label: 'Payment',         icon: CreditCard },
  { id: 'help',          label: 'Help & Support',  icon: HelpCircle },
];

export default function ProfilePage() {
  const queryClient          = useQueryClient();
  const { user, setUser, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [successMsg, setSuccess]  = useState('');

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn:  () => userApi.getProfile(),
  });

  const profile = profileData?.data?.data ?? user;

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.firstName || '',
      lastName:  profile?.lastName  || '',
      email:     profile?.email     || '',
      phone:     profile?.phone     || '',
    },
  });

  useEffect(() => {
    form.reset({
      firstName: profile?.firstName || '',
      lastName:  profile?.lastName  || '',
      email:     profile?.email     || '',
      phone:     profile?.phone     || '',
    });
  }, [profile?.firstName, profile?.lastName, profile?.email, profile?.phone, form]);

  const updateProfile = useMutation({
    mutationFn: (data: ProfileForm) => userApi.updateProfile(data),
    onSuccess:  (res) => {
      setUser(res.data.data);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    },
  });

  const initials = `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}`;

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">

        {/* ── PROFILE HEADER ──────────────────────────────────── */}
        <header className="rounded-3xl overflow-hidden shadow-[var(--shadow-card)]">
          <div className="bg-ink-900 px-6 pt-8 pb-10 sm:px-8">
            <div className="flex items-end gap-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="h-20 w-20 rounded-2xl overflow-hidden ring-4 ring-white/20">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={profile?.firstName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-brand-600 text-2xl font-extrabold text-white">
                      {initials}
                    </div>
                  )}
                </div>
                <button className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg hover:bg-brand-600 transition-colors">
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Name + role */}
              <div className="pb-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Account</p>
                <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
                  {profile?.firstName} {profile?.lastName}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="badge bg-white/10 text-white border-0">
                    {profile?.role ?? user?.role}
                  </span>
                  {profile?.phone && (
                    <span className="badge bg-white/10 text-white border-0">
                      <Phone className="h-3 w-3" /> {profile.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Success strip */}
          {successMsg && (
            <div className="bg-mint-500 px-6 py-3 sm:px-8 flex items-center gap-2 text-sm font-semibold text-white">
              <Check className="h-4 w-4" /> {successMsg}
            </div>
          )}

          {/* Tab strip */}
          <div className="bg-white px-4 sm:px-8 border-b border-ink-100 overflow-x-auto scrollbar-hide">
            <div className="flex gap-0 min-w-max">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === id
                      ? 'border-brand-600 text-brand-700'
                      : 'border-transparent text-ink-500 hover:text-ink-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ── TAB CONTENT ─────────────────────────────────────── */}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <section className="rounded-3xl bg-white shadow-[var(--shadow-card)] px-6 py-6 sm:px-8">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-ink-900">Profile information</h2>
              <p className="mt-1 text-sm text-ink-500">Update your personal details</p>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1,2,3,4].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(d => updateProfile.mutate(d))} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="field-group mb-0">
                    <label className="label">First name</label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      <input {...form.register('firstName')} className={`input pl-10 ${form.formState.errors.firstName ? 'input-error' : ''}`} placeholder="Grace" />
                    </div>
                    {form.formState.errors.firstName && <p className="mt-1 text-xs text-red-500">{form.formState.errors.firstName.message}</p>}
                  </div>
                  <div className="field-group mb-0">
                    <label className="label">Last name</label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      <input {...form.register('lastName')} className={`input pl-10 ${form.formState.errors.lastName ? 'input-error' : ''}`} placeholder="Muthoni" />
                    </div>
                    {form.formState.errors.lastName && <p className="mt-1 text-xs text-red-500">{form.formState.errors.lastName.message}</p>}
                  </div>
                </div>

                <div className="field-group mb-0">
                  <label className="label">Email <span className="label-optional">(optional)</span></label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input {...form.register('email')} className="input pl-10" placeholder="grace@email.com" type="email" />
                  </div>
                </div>

                <div className="field-group mb-0">
                  <label className="label">Phone number</label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input {...form.register('phone')} className={`input pl-10 ${form.formState.errors.phone ? 'input-error' : ''}`} placeholder="+254 712 345 678" type="tel" />
                  </div>
                  {form.formState.errors.phone && <p className="mt-1 text-xs text-red-500">{form.formState.errors.phone.message}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => form.reset()} className="btn-ghost">Cancel</button>
                  <button type="submit" disabled={updateProfile.isPending} className="btn-primary">
                    {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Edit2 className="h-4 w-4" /> Save changes</>}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <section className="rounded-3xl bg-white shadow-[var(--shadow-card)] px-6 py-6 sm:px-8">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-ink-900">Security</h2>
              <p className="mt-1 text-sm text-ink-500">Manage authentication settings</p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-ink-100 bg-surface-50 px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-ink-900">Phone OTP login</p>
                  <p className="text-xs text-ink-500 mt-0.5">You sign in via a one-time code sent to your phone — no password needed.</p>
                </div>
                <span className="badge bg-mint-50 text-mint-700 flex-shrink-0">
                  <Check className="h-3.5 w-3.5" /> Active
                </span>
              </div>

              <div className="rounded-2xl border border-ink-100 bg-surface-50 px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-ink-900">Verified phone</p>
                  <p className="text-xs text-ink-500 mt-0.5">{profile?.phone || user?.phone || '—'}</p>
                </div>
                <span className="badge bg-brand-50 text-brand-700 flex-shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified
                </span>
              </div>
            </div>
          </section>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <section className="rounded-3xl bg-white shadow-[var(--shadow-card)] px-6 py-6 sm:px-8">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-ink-900">Notification preferences</h2>
              <p className="mt-1 text-sm text-ink-500">Control how you receive updates</p>
            </div>

            <div className="space-y-3">
              {[
                { title: 'Booking updates',   desc: 'Status changes to your bookings' },
                { title: 'Messages',          desc: 'Chat messages from cleaners or clients' },
                { title: 'Payment events',    desc: 'Confirmations, refunds, and payouts' },
                { title: 'Account & security',desc: 'Important account activity alerts' },
              ].map((item, i) => (
                <div key={item.title} className="rounded-2xl border border-ink-100 bg-surface-50 px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-ink-900">{item.title}</p>
                    <p className="text-xs text-ink-500 mt-0.5">{item.desc}</p>
                  </div>
                  <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${i < 3 ? 'bg-brand-600' : 'bg-ink-200'}`}>
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${i < 3 ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PAYMENT TAB */}
        {activeTab === 'payment' && (
          <section className="rounded-3xl bg-white shadow-[var(--shadow-card)] px-6 py-6 sm:px-8">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-ink-900">Payment methods</h2>
              <p className="mt-1 text-sm text-ink-500">Manage your payment options</p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-mint-200 bg-mint-50/50 px-5 py-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-mint-200">
                  <span className="text-lg font-extrabold text-mint-700">M</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink-900">M-Pesa</p>
                  <p className="text-xs text-ink-500 mt-0.5">{profile?.phone?.slice(-4) ? `•••• ${profile.phone.slice(-4)}` : user?.phone}</p>
                </div>
                <span className="badge bg-mint-100 text-mint-700 flex-shrink-0">Default</span>
              </div>
            </div>

            <p className="mt-4 text-xs text-ink-400">
              M-Pesa is the primary payment method on Mama Fua. Card payments coming soon.
            </p>
          </section>
        )}

        {/* HELP TAB */}
        {activeTab === 'help' && (
          <section className="rounded-3xl bg-white shadow-[var(--shadow-card)] px-6 py-6 sm:px-8">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-ink-900">Help & support</h2>
              <p className="mt-1 text-sm text-ink-500">Get assistance with your account or bookings</p>
            </div>

            <div className="space-y-3">
              {[
                { title: 'FAQs',             desc: 'Answers to common questions' },
                { title: 'Contact support',  desc: 'Get in touch with our team' },
                { title: 'Terms of service', desc: 'Read our terms and conditions' },
                { title: 'Privacy policy',   desc: 'How we handle your data' },
              ].map(item => (
                <button key={item.title} className="w-full rounded-2xl border border-ink-100 bg-surface-50 px-5 py-4 text-left flex items-center justify-between gap-4 hover:border-brand-200 hover:bg-brand-50/40 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-ink-900">{item.title}</p>
                    <p className="text-xs text-ink-500 mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ink-300 flex-shrink-0" />
                </button>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-ink-100">
              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
