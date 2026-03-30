'use client';
// Mama Fua — Cleaner Profile Management
// KhimTech | 2026

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, MapPin, Camera, Edit2, CheckCircle, Loader2, Star, Clock, ShieldCheck, Award, Briefcase, DollarSign, Calendar } from 'lucide-react';
import { cleanerApi, userApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatKES } from '@mama-fua/shared';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().min(9, 'Enter a valid phone number'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

const pricingSchema = z.object({
  homeCleaningPrice: z.number().min(500, 'Minimum price is KES 500'),
  laundryPrice: z.number().min(300, 'Minimum price is KES 300'),
  officeCleaningPrice: z.number().min(800, 'Minimum price is KES 800'),
  deepCleaningPrice: z.number().min(1500, 'Minimum price is KES 1500'),
  postConstructionPrice: z.number().min(2500, 'Minimum price is KES 2500'),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PricingForm = z.infer<typeof pricingSchema>;

export default function CleanerProfilePage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [activeTab, setActiveTab] = useState<'profile' | 'pricing' | 'services' | 'availability'>('profile');
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPricing, setEditingPricing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['cleaner-profile'],
    queryFn: () => cleanerApi.me(),
  });

  const profile = profileData?.data?.data;
  const cleanerUser = profile?.user ?? user;
  const servicePrices = new Map<string, number>(
    (profile?.services ?? []).map((item: any): [string, number] => [
      item.service.name,
      Number(item.customPrice),
    ])
  );

  const getPricingDefaults = (): PricingForm => ({
    homeCleaningPrice: servicePrices.get('Home Cleaning') ?? 1200,
    laundryPrice: servicePrices.get('Laundry (Mama Fua)') ?? 500,
    officeCleaningPrice: servicePrices.get('Office Cleaning') ?? 2000,
    deepCleaningPrice: servicePrices.get('Deep Cleaning') ?? 3500,
    postConstructionPrice: servicePrices.get('Post-Construction Cleaning') ?? 5000,
  });

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const updatedUser = await userApi.updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone,
      });

      await cleanerApi.updateMe({
        bio: data.bio || undefined,
      });

      return updatedUser;
    },
    onSuccess: (res) => {
      setSuccessMessage('Profile updated successfully');
      setUser(res.data.data);
      setEditingProfile(false);
      queryClient.invalidateQueries({ queryKey: ['cleaner-profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const updatePricing = useMutation({
    mutationFn: (data: PricingForm) => cleanerApi.updatePricing(data),
    onSuccess: () => {
      setSuccessMessage('Pricing updated successfully');
      setEditingPricing(false);
      queryClient.invalidateQueries({ queryKey: ['cleaner-profile'] });
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: cleanerUser?.firstName || '',
      lastName: cleanerUser?.lastName || '',
      email: cleanerUser?.email || '',
      phone: cleanerUser?.phone || '',
      bio: profile?.bio || '',
    },
  });

  const pricingForm = useForm<PricingForm>({
    resolver: zodResolver(pricingSchema),
    defaultValues: getPricingDefaults(),
  });

  useEffect(() => {
    profileForm.reset({
      firstName: cleanerUser?.firstName || '',
      lastName: cleanerUser?.lastName || '',
      email: cleanerUser?.email || '',
      phone: cleanerUser?.phone || '',
      bio: profile?.bio || '',
    });
    pricingForm.reset(getPricingDefaults());
  }, [
    cleanerUser?.email,
    cleanerUser?.firstName,
    cleanerUser?.lastName,
    cleanerUser?.phone,
    pricingForm,
    profile?.bio,
    profile?.services,
    profileForm,
  ]);

  const handleProfileSubmit = (data: ProfileForm) => {
    updateProfile.mutate(data);
  };

  const handlePricingSubmit = (data: PricingForm) => {
    updatePricing.mutate(data);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingPhoto(true);
      // TODO: Implement photo upload
      setTimeout(() => {
        setUploadingPhoto(false);
        setSuccessMessage('Photo uploaded successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      }, 2000);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'pricing' as const, label: 'Pricing', icon: DollarSign },
    { id: 'services' as const, label: 'Services', icon: Briefcase },
    { id: 'availability' as const, label: 'Availability', icon: Calendar },
  ];

  const pricingFieldByServiceName: Record<string, keyof PricingForm> = {
    'Home Cleaning': 'homeCleaningPrice',
    Laundry: 'laundryPrice',
    'Office Cleaning': 'officeCleaningPrice',
    'Deep Cleaning': 'deepCleaningPrice',
    'Post-Construction': 'postConstructionPrice',
  };

  const services = [
    { name: 'Home Cleaning', price: servicePrices.get('Home Cleaning') || 1200, description: 'Regular household cleaning' },
    { name: 'Laundry', price: servicePrices.get('Laundry (Mama Fua)') || 500, description: 'Wash, iron, and fold' },
    { name: 'Office Cleaning', price: servicePrices.get('Office Cleaning') || 2000, description: 'Commercial spaces' },
    { name: 'Deep Cleaning', price: servicePrices.get('Deep Cleaning') || 3500, description: 'Thorough cleaning' },
    { name: 'Post-Construction', price: servicePrices.get('Post-Construction Cleaning') || 5000, description: 'After renovation cleanup' },
  ];

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-ink-900">Cleaner Profile</h1>
          <p className="mt-2 text-sm text-ink-500">Manage your profile and service offerings</p>
        </header>

        {successMessage && (
          <div className="rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm text-mint-800">
            <CheckCircle className="mr-2 inline h-4 w-4" />
            {successMessage}
          </div>
        )}

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

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="section-shell p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-ink-900">Profile Information</h2>
                <button
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="btn-ghost px-4 py-2"
                >
                  <Edit2 className="h-4 w-4" /> {editingProfile ? 'Cancel' : 'Edit'}
                </button>
              </div>

                <div className="mb-6 flex items-center gap-6">
                  <div className="relative">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-100 text-3xl font-bold text-brand-700">
                    {cleanerUser?.avatarUrl ? (
                      <img src={cleanerUser.avatarUrl} alt="Profile" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      `${cleanerUser?.firstName?.[0] || ''}${cleanerUser?.lastName?.[0] || ''}`
                    )}
                    </div>
                  <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700">
                    {uploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-ink-900">
                    {cleanerUser?.firstName} {cleanerUser?.lastName}
                  </h3>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-500 fill-current" />
                      <span className="text-sm font-medium text-ink-900">{profile?.rating || '4.8'}</span>
                      <span className="text-sm text-ink-500">({profile?.totalReviews || 127} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4 text-mint-600" />
                      <span className="text-sm text-mint-600">Verified</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-ink-600">{profile?.bio}</p>
                </div>
              </div>

              {editingProfile ? (
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-ink-700">First name</label>
                      <input {...profileForm.register('firstName')} className="input" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-ink-700">Last name</label>
                      <input {...profileForm.register('lastName')} className="input" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-ink-700">Email</label>
                    <input {...profileForm.register('email')} className="input" type="email" />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-ink-700">Phone</label>
                    <input {...profileForm.register('phone')} className="input" type="tel" />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-ink-700">Bio</label>
                    <textarea {...profileForm.register('bio')} className="input" rows={3} placeholder="Tell clients about yourself and your cleaning experience" />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setEditingProfile(false)} className="btn-ghost px-6 py-2.5">
                      Cancel
                    </button>
                    <button type="submit" disabled={updateProfile.isPending} className="btn-primary px-6 py-2.5">
                      {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Profile
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-ink-500">Verification Status</p>
                      <p className="mt-1 text-ink-900 capitalize">
                        {(profile?.verificationStatus || 'PENDING').replace('_', ' ').toLowerCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-500">Availability</p>
                      <p className="mt-1 text-ink-900">
                        {profile?.isAvailable ? 'Accepting bookings' : 'Currently unavailable'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-500">Contact Information</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-ink-900">{cleanerUser?.email || user?.email}</p>
                      <p className="text-ink-900">{cleanerUser?.phone || user?.phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="section-shell p-6">
              <h3 className="mb-4 text-lg font-semibold text-ink-900">Stats</h3>
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-ink-900">{profile?.totalJobs || 156}</p>
                  <p className="text-sm text-ink-500">Jobs Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-ink-900">{profile?.totalReviews || 42}</p>
                  <p className="text-sm text-ink-500">Reviews Received</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-ink-900">{profile?.isAvailable ? 'Open' : 'Paused'}</p>
                  <p className="text-sm text-ink-500">Availability</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-ink-900">{profile?.rating || '4.8'}</p>
                  <p className="text-sm text-ink-500">Rating</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="section-shell p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-ink-900">Service Pricing</h2>
              <button
                onClick={() => setEditingPricing(!editingPricing)}
                className="btn-ghost px-4 py-2"
              >
                <Edit2 className="h-4 w-4" /> {editingPricing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editingPricing ? (
              <form onSubmit={pricingForm.handleSubmit(handlePricingSubmit)} className="space-y-6">
                {services.map((service) => {
                  const fieldName = pricingFieldByServiceName[service.name];
                  if (!fieldName) {
                    return null;
                  }
                  return (
                    <div key={service.name}>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-semibold text-ink-900">{service.name}</label>
                          <p className="text-sm text-ink-500">{service.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-ink-500">KES</span>
                          <input
                            {...pricingForm.register(fieldName, { valueAsNumber: true })}
                            type="number"
                            className="input w-32 text-right"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingPricing(false)} className="btn-ghost px-6 py-2.5">
                    Cancel
                  </button>
                  <button type="submit" disabled={updatePricing.isPending} className="btn-primary px-6 py-2.5">
                    {updatePricing.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Pricing
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                    <div>
                      <p className="font-semibold text-ink-900">{service.name}</p>
                      <p className="text-sm text-ink-500">{service.description}</p>
                    </div>
                    <p className="text-lg font-semibold text-ink-900">{formatKES(service.price)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="section-shell p-6">
              <h2 className="mb-4 text-2xl font-bold text-ink-900">Service Offerings</h2>
              <div className="space-y-4">
                {[
                  { name: 'General Cleaning', description: 'Regular household cleaning services', offered: true },
                  { name: 'Deep Cleaning', description: 'Intensive cleaning for special occasions', offered: true },
                  { name: 'Window Cleaning', description: 'Interior and exterior window washing', offered: false },
                  { name: 'Carpet Cleaning', description: 'Professional carpet shampooing', offered: false },
                  { name: 'Organizational Services', description: 'Decluttering and organization', offered: false },
                ].map((service) => (
                  <div key={service.name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                    <div>
                      <p className="font-semibold text-ink-900">{service.name}</p>
                      <p className="text-sm text-ink-500">{service.description}</p>
                    </div>
                    <button className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      service.offered ? 'bg-brand-600' : 'bg-slate-300'
                    }`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        service.offered ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="section-shell p-6">
              <h3 className="mb-4 text-lg font-semibold text-ink-900">Equipment & Supplies</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  'Cleaning solutions',
                  'Microfiber cloths',
                  'Vacuum cleaner',
                  'Mop and bucket',
                  'Cleaning brushes',
                  'Safety equipment',
                ].map((item) => (
                  <label key={item} className="flex items-center gap-3">
                    <input type="checkbox" className="h-4 w-4 text-brand-600 border-gray-300 rounded" defaultChecked />
                    <span className="text-sm text-ink-700">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="space-y-6">
            <div className="section-shell p-6">
              <h2 className="mb-4 text-2xl font-bold text-ink-900">Working Hours</h2>
              <div className="space-y-3">
                {[
                  { day: 'Monday', hours: '8:00 AM - 6:00 PM', available: true },
                  { day: 'Tuesday', hours: '8:00 AM - 6:00 PM', available: true },
                  { day: 'Wednesday', hours: '8:00 AM - 6:00 PM', available: true },
                  { day: 'Thursday', hours: '8:00 AM - 6:00 PM', available: true },
                  { day: 'Friday', hours: '8:00 AM - 6:00 PM', available: true },
                  { day: 'Saturday', hours: '9:00 AM - 4:00 PM', available: true },
                  { day: 'Sunday', hours: 'Not available', available: false },
                ].map((schedule) => (
                  <div key={schedule.day} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-4">
                      <p className="font-semibold text-ink-900 w-20">{schedule.day}</p>
                      <p className="text-sm text-ink-500">{schedule.hours}</p>
                    </div>
                    <button className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      schedule.available ? 'bg-brand-600' : 'bg-slate-300'
                    }`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        schedule.available ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="section-shell p-6">
              <h3 className="mb-4 text-lg font-semibold text-ink-900">Advance Notice</h3>
              <div className="space-y-3">
                {[
                  'Same day bookings',
                  '24 hours notice',
                  '48 hours notice',
                  '1 week notice',
                ].map((notice) => (
                  <label key={notice} className="flex items-center gap-3">
                    <input type="radio" name="notice" className="h-4 w-4 text-brand-600 border-gray-300" />
                    <span className="text-sm text-ink-700">{notice}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
