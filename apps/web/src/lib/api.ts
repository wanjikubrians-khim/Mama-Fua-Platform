// Mama Fua — API Client
// KhimTech | 2026

import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/store/auth.store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — try refresh, then logout
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers!['Authorization'] = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      const refreshToken = useAuthStore.getState().refreshToken;

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;
        useAuthStore.getState().setTokens(accessToken, newRefresh);
        refreshQueue.forEach((cb) => cb(accessToken));
        refreshQueue = [];
        original.headers!['Authorization'] = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Typed API helpers ──────────────────────────────────────────────────

export const authApi = {
  requestOtp: (phone: string) => api.post('/auth/request-otp', { phone }),
  verifyOtp: (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp }),
  register: (data: object) => api.post('/auth/register', data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
};

export const bookingApi = {
  create: (data: object) => api.post('/bookings', data),
  list: (params?: object) => api.get('/bookings', { params }),
  get: (id: string) => api.get(`/bookings/${id}`),
  tracking: (id: string) => api.get(`/bookings/${id}/tracking`),
  accept: (id: string) => api.post(`/bookings/${id}/accept`),
  decline: (id: string, reason?: string) => api.post(`/bookings/${id}/decline`, { reason }),
  start: (id: string) => api.post(`/bookings/${id}/start`),
  complete: (id: string) => api.post(`/bookings/${id}/complete`),
  confirm: (id: string) => api.post(`/bookings/${id}/confirm`),
  cancel: (id: string, reason?: string) => api.patch(`/bookings/${id}/cancel`, { reason }),
  dispute: (id: string, data: object) => api.post(`/bookings/${id}/dispute`, data),
  chat: (id: string) => api.get(`/bookings/${id}/chat`),
  bids: (id: string) => api.get(`/bookings/${id}/bids`),
  submitBid: (id: string, data: object) => api.post(`/bookings/${id}/bids`, data),
  acceptBid: (bookingId: string, bidId: string) =>
    api.post(`/bookings/${bookingId}/bids/${bidId}/accept`),
};

export const cleanerApi = {
  me: () => api.get('/cleaners/me'),
  get: (id: string) => api.get(`/cleaners/${id}`),
  updateMe: (data: object) => api.patch('/cleaners/me', data),
  setAvailable: (isAvailable: boolean) => api.patch('/cleaners/me/available', { isAvailable }),
  wallet: () => api.get('/cleaners/me/wallet'),
  services: () => api.get('/cleaners/me/services'),
  addService: (data: object) => api.post('/cleaners/me/services', data),
  availability: () => api.get('/cleaners/me/availability'),
};

export const locationApi = {
  autocomplete: (input: string, sessionToken: string) =>
    api.get('/location/autocomplete', { params: { input, sessiontoken: sessionToken } }),
  place: (placeId: string) => api.get('/location/place', { params: { place_id: placeId } }),
  coverage: (lat: number, lng: number, serviceId: string) =>
    api.get('/location/coverage', { params: { lat, lng, serviceId } }),
  nearbyCleaners: (params: {
    lat: number;
    lng: number;
    serviceId: string;
    scheduledAt?: string;
    minRating?: number;
    maxPrice?: number;
    radiusKm?: number;
    sort?: 'recommended' | 'distance' | 'rating' | 'price';
  }) => api.get('/location/cleaners/nearby', { params }),
};

export const reviewsApi = {
  forCleaner: (cleanerId: string) => api.get(`/reviews/cleaner/${cleanerId}`),
};

export const userApi = {
  me: () => api.get('/users/me'),
  update: (data: object) => api.patch('/users/me', data),
  registerDeviceToken: (data: { token: string; platform: 'ios' | 'android' | 'web' }) =>
    api.post('/users/me/device-tokens', data),
  unregisterDeviceToken: (token: string) =>
    api.delete('/users/me/device-tokens', { data: { token } }),
  notifications: () => api.get('/users/me/notifications'),
  markAllNotificationsRead: () => api.patch('/users/me/notifications/read-all'),
  markRead: (id: string) => api.patch(`/users/me/notifications/${id}/read`),
  dismissNotification: (id: string) => api.delete(`/users/me/notifications/${id}`),
  clearNotifications: (scope: 'all' | 'read' = 'read') =>
    api.delete('/users/me/notifications', { data: { scope } }),
};

export const paymentsApi = {
  initiateMpesa: (data: object) => api.post('/payments/mpesa/initiate', data),
  mpesaStatus: (checkoutId: string) => api.get(`/payments/mpesa/status/${checkoutId}`),
  walletPay: (bookingId: string) => api.post('/payments/wallet/pay', { bookingId }),
  payoutRequest: (data: object) => api.post('/payments/payout/request', data),
  walletTopup: (data: object) => api.post('/payments/wallet/topup', data),
};
