'use client';
// Mama Fua — Address Book Management
// KhimTech | 2026

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Plus, Edit2, Trash2, Home, Building, CheckCircle, Loader2, Search, Star } from 'lucide-react';
import { userApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const addressSchema = z.object({
  label: z.string().min(1, 'Address label is required'),
  addressLine1: z.string().min(5, 'Address is required'),
  area: z.string().min(2, 'Area is required'),
  city: z.string().min(2, 'City is required'),
  instructions: z.string().optional(),
  isDefault: z.boolean().optional(),
});

type AddressForm = z.infer<typeof addressSchema>;

export default function AddressesPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { data: addressesData, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => userApi.getAddresses(),
  });

  const createAddress = useMutation({
    mutationFn: (data: AddressForm) => userApi.createAddress(data),
    onSuccess: () => {
      setSuccessMessage('Address added successfully');
      setShowAddForm(false);
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const updateAddress = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddressForm }) => userApi.updateAddress(id, data),
    onSuccess: () => {
      setSuccessMessage('Address updated successfully');
      setEditingAddress(null);
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const deleteAddress = useMutation({
    mutationFn: (id: string) => userApi.deleteAddress(id),
    onSuccess: () => {
      setSuccessMessage('Address deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const addresses = addressesData?.data?.data ?? [];
  const filteredAddresses = addresses.filter((address: any) =>
    address.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    address.addressLine1.toLowerCase().includes(searchQuery.toLowerCase()) ||
    address.area.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const form = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: '',
      addressLine1: '',
      area: '',
      city: 'Nairobi',
      instructions: '',
      isDefault: false,
    },
  });

  const onSubmit = (data: AddressForm) => {
    if (editingAddress) {
      updateAddress.mutate({ id: editingAddress.id, data });
    } else {
      createAddress.mutate(data);
    }
    form.reset();
  };

  const handleEdit = (address: any) => {
    setEditingAddress(address);
    form.reset({
      label: address.label,
      addressLine1: address.addressLine1,
      area: address.area,
      city: address.city,
      instructions: address.instructions || '',
      isDefault: address.isDefault || false,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      deleteAddress.mutate(id);
    }
  };

  const getAddressIcon = (label: string) => {
    if (label.toLowerCase().includes('home') || label.toLowerCase().includes('house')) {
      return Home;
    }
    if (label.toLowerCase().includes('office') || label.toLowerCase().includes('work')) {
      return Building;
    }
    return MapPin;
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-ink-900">Address Book</h1>
          <p className="mt-2 text-sm text-ink-500">Manage your saved addresses for quick booking</p>
        </header>

        {successMessage && (
          <div className="rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm text-mint-800">
            <CheckCircle className="mr-2 inline h-4 w-4" />
            {successMessage}
          </div>
        )}

        <div className="section-shell p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                placeholder="Search addresses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary px-4 py-2"
            >
              <Plus className="h-4 w-4" /> Add Address
            </button>
          </div>
        </div>

        {(showAddForm || editingAddress) && (
          <div className="section-shell p-6">
            <h2 className="text-xl font-bold text-ink-900 mb-6">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-700">Label</label>
                  <input
                    {...form.register('label')}
                    className="input"
                    placeholder="e.g., Home, Office, Mom's House"
                  />
                  {form.formState.errors.label && (
                    <p className="mt-1 text-xs text-red-500">
                      {form.formState.errors.label.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-700">Area</label>
                  <input
                    {...form.register('area')}
                    className="input"
                    placeholder="e.g., Kilimani, Westlands"
                  />
                  {form.formState.errors.area && (
                    <p className="mt-1 text-xs text-red-500">
                      {form.formState.errors.area.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Address Line</label>
                <input
                  {...form.register('addressLine1')}
                  className="input"
                  placeholder="Street address, building name, etc."
                />
                {form.formState.errors.addressLine1 && (
                  <p className="mt-1 text-xs text-red-500">
                    {form.formState.errors.addressLine1.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-700">City</label>
                  <select {...form.register('city')} className="input">
                    <option value="Nairobi">Nairobi</option>
                    <option value="Mombasa">Mombasa</option>
                    <option value="Kisumu">Kisumu</option>
                    <option value="Nakuru">Nakuru</option>
                    <option value="Eldoret">Eldoret</option>
                  </select>
                  {form.formState.errors.city && (
                    <p className="mt-1 text-xs text-red-500">
                      {form.formState.errors.city.message}
                    </p>
                  )}
                </div>
                <div className="flex items-center">
                  <input
                    {...form.register('isDefault')}
                    type="checkbox"
                    className="mr-2 h-4 w-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                  />
                  <label className="text-sm font-medium text-ink-700">
                    Set as default address
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">
                  Access Instructions (optional)
                </label>
                <textarea
                  {...form.register('instructions')}
                  className="input"
                  rows={3}
                  placeholder="e.g., Gate code, floor number, nearby landmarks"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingAddress(null);
                    form.reset();
                  }}
                  className="btn-ghost px-6 py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAddress.isPending || updateAddress.isPending}
                  className="btn-primary px-6 py-2.5"
                >
                  {(createAddress.isPending || updateAddress.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingAddress ? 'Update Address' : 'Add Address'}
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="section-shell p-12 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-700" />
            <p className="mt-4 text-sm text-ink-500">Loading addresses...</p>
          </div>
        ) : filteredAddresses.length === 0 ? (
          <div className="section-shell p-12 text-center">
            <MapPin className="mx-auto h-12 w-12 text-ink-300" />
            <h2 className="mt-4 text-xl font-semibold text-ink-900">
              {searchQuery ? 'No addresses found' : 'No saved addresses'}
            </h2>
            <p className="mt-2 text-sm text-ink-500">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Add your first address to make booking faster'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary mt-6 px-6 py-2.5"
              >
                <Plus className="h-4 w-4" /> Add Address
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAddresses.map((address: any) => {
              const Icon = getAddressIcon(address.label);
              return (
                <div
                  key={address.id}
                  className="section-shell p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                        <Icon className="h-6 w-6 text-brand-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-ink-900">{address.label}</h3>
                          {address.isDefault && (
                            <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-700">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-ink-600">{address.addressLine1}</p>
                        <p className="text-sm text-ink-500">
                          {address.area}, {address.city}
                        </p>
                        {address.instructions && (
                          <p className="mt-2 text-xs text-ink-400 italic">
                            Instructions: {address.instructions}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(address)}
                        className="btn-ghost p-2"
                        title="Edit address"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(address.id)}
                        className="btn-ghost p-2 text-red-600 hover:bg-red-50"
                        title="Delete address"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="section-shell p-6">
          <h2 className="text-lg font-semibold text-ink-900 mb-4">Address Tips</h2>
          <div className="space-y-3">
            {[
              'Add detailed access instructions to help cleaners find you easily',
              'Set a default address for faster booking',
              'Include landmarks or gate codes in instructions',
              'Keep your addresses updated if you move or change locations',
            ].map((tip) => (
              <div key={tip} className="flex items-start gap-3">
                <Star className="h-4 w-4 text-amber-500 mt-0.5" />
                <p className="text-sm text-ink-600">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
