'use client';

import axios from 'axios';
import type { ApiResponse } from '@mama-fua/shared';
import type { AdminDashboardData } from './dashboard';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

const getStoredToken = () => {
  if (typeof window === 'undefined') return null;

  const rawKeys = ['mama-fua-admin-auth', 'mama-fua-auth', 'mama-fua-access-token'];

  for (const key of rawKeys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    if (key === 'mama-fua-access-token') return raw;

    try {
      const parsed = JSON.parse(raw);
      const token = parsed?.state?.accessToken ?? parsed?.accessToken ?? null;
      if (typeof token === 'string' && token.length > 0) {
        return token;
      }
    } catch {
      continue;
    }
  }

  return null;
};

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function fetchAdminDashboard() {
  const response = await api.get<ApiResponse<AdminDashboardData>>('/admin/dashboard');
  return response.data.data;
}
