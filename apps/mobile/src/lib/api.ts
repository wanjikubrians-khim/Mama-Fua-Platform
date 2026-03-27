// Mama Fua Mobile — API Client
// KhimTech | 2026

import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';
import { useAuthStore } from '@/store/auth.store';
import { router } from 'expo-router';

const BASE_URL =
  Constants.expoConfig?.extra?.['apiUrl'] ?? 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue: Array<(t: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push((t) => { original.headers!['Authorization'] = `Bearer ${t}`; resolve(api(original)); });
        });
      }
      isRefreshing = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;
        useAuthStore.getState().setTokens(accessToken, newRefresh);
        queue.forEach((cb) => cb(accessToken));
        queue = [];
        original.headers!['Authorization'] = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
        router.replace('/login');
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  requestOtp: (phone: string) => api.post('/auth/request-otp', { phone }),
  verifyOtp: (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp }),
  register: (data: object) => api.post('/auth/register', data),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
};

export const bookingApi = {
  create: (data: object) => api.post('/bookings', data),
  list: (params?: object) => api.get('/bookings', { params }),
  get: (id: string) => api.get(`/bookings/${id}`),
  accept: (id: string) => api.post(`/bookings/${id}/accept`),
  decline: (id: string) => api.post(`/bookings/${id}/decline`),
  start: (id: string) => api.post(`/bookings/${id}/start`),
  complete: (id: string) => api.post(`/bookings/${id}/complete`),
  confirm: (id: string) => api.post(`/bookings/${id}/confirm`),
  cancel: (id: string, reason?: string) => api.patch(`/bookings/${id}/cancel`, { reason }),
  chat: (id: string) => api.get(`/bookings/${id}/chat`),
  bids: (id: string) => api.get(`/bookings/${id}/bids`),
  submitBid: (id: string, data: object) => api.post(`/bookings/${id}/bids`, data),
  acceptBid: (bookingId: string, bidId: string) => api.post(`/bookings/${bookingId}/bids/${bidId}/accept`),
};

export const cleanerApi = {
  me: () => api.get('/cleaners/me'),
  updateMe: (data: object) => api.patch('/cleaners/me', data),
  setAvailable: (isAvailable: boolean) => api.patch('/cleaners/me/available', { isAvailable }),
  wallet: () => api.get('/cleaners/me/wallet'),
  earnings: () => api.get('/cleaners/me/earnings'),
};

export const userApi = {
  me: () => api.get('/users/me'),
  notifications: () => api.get('/users/me/notifications'),
  markNotificationRead: (id: string) => api.patch(`/users/me/notifications/${id}/read`),
  markAllNotificationsRead: () => api.patch('/users/me/notifications/read-all'),
  clearNotifications: (scope: 'all' | 'read' = 'read') =>
    api.delete('/users/me/notifications', { data: { scope } }),
  registerDeviceToken: (data: { token: string; platform: 'ios' | 'android' | 'web' }) =>
    api.post('/users/me/device-tokens', data),
  unregisterDeviceToken: (token: string) =>
    api.delete('/users/me/device-tokens', { data: { token } }),
};

export const locationApi = {
  nearbyCleaners: (lat: number, lng: number, serviceId: string) =>
    api.get('/location/cleaners/nearby', { params: { lat, lng, serviceId } }),
  coverage: (lat: number, lng: number, serviceId: string) =>
    api.get('/location/coverage', { params: { lat, lng, serviceId } }),
};
