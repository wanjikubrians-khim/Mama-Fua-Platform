'use client';
// Mama Fua — Navbar
// KhimTech | 2026

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Bell, Plus, LogOut, ChevronDown, User, Settings, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '@/components/ui';
import { userApi } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const homeHref = user?.role === 'CLEANER' ? '/cleaner/dashboard' : '/dashboard';

  const { data: notifRes } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => userApi.notifications(),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });

  const unreadCount = (notifRes?.data?.data ?? []).filter(
    (n: { isRead: boolean }) => !n.isRead
  ).length;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const hiddenPaths = ['/', '/login', '/register'];
  if (hiddenPaths.includes(pathname)) return null;

  return (
    <header className="top-nav">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">

        {/* Logo */}
        <Link href={isAuthenticated ? homeHref : '/'} className="flex items-center gap-2.5 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-extrabold text-white shadow-brand group-hover:bg-brand-700 transition-colors">
            MF
          </span>
          <span className="text-sm font-bold text-ink-900">Mama Fua</span>
        </Link>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-1.5">

            {/* Book CTA */}
            {user.role === 'CLIENT' && (
              <Link href="/book" className="btn-primary text-sm gap-1.5 hidden sm:inline-flex">
                <Plus className="h-3.5 w-3.5" />
                Book now
              </Link>
            )}

            {/* Notifications */}
            <Link href="/notifications" className="btn-icon relative">
              <Bell className="h-[18px] w-[18px] text-ink-500" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </Link>

            {/* User dropdown */}
            <div className="relative ml-1">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-2.5 transition-all duration-200 hover:bg-ink-100"
              >
                <Avatar
                  name={`${user.firstName} ${user.lastName}`}
                  src={user.avatarUrl}
                  size="sm"
                />
                <span className="hidden text-sm font-semibold text-ink-700 sm:block">
                  {user.firstName}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-ink-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-56 animate-scale-in rounded-2xl border border-ink-100 bg-white py-1.5 shadow-modal">
                    {/* User info */}
                    <div className="border-b border-ink-100 px-4 py-3 mb-1">
                      <p className="text-sm font-bold text-ink-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-ink-400 capitalize mt-0.5">{user.role.toLowerCase()}</p>
                    </div>

                    {/* Nav items */}
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 hover:bg-surface-50 hover:text-ink-900 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <User className="h-4 w-4 text-ink-400" />
                      My profile
                    </Link>

                    {user.role === 'CLIENT' && (
                      <Link
                        href="/wallet"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 hover:bg-surface-50 hover:text-ink-900 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="h-4 w-4 text-center text-xs">💳</span>
                        My wallet
                      </Link>
                    )}

                    {user.role === 'CLEANER' && (
                      <Link
                        href="/cleaner/wallet"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 hover:bg-surface-50 hover:text-ink-900 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="h-4 w-4 text-center text-xs">💰</span>
                        Earnings & wallet
                      </Link>
                    )}

                    {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                      <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 hover:bg-surface-50 hover:text-ink-900 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4 text-ink-400" />
                        Admin dashboard
                      </Link>
                    )}

                    <Link
                      href="/help"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 hover:bg-surface-50 hover:text-ink-900 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 text-ink-400" />
                      Help & settings
                    </Link>

                    <div className="mt-1 border-t border-ink-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost text-sm">Log in</Link>
            <Link href="/register" className="btn-primary text-sm">Get started</Link>
          </div>
        )}
      </div>
    </header>
  );
}
