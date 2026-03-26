'use client';
// Mama Fua — Navbar
// KhimTech | 2026
// Place in: apps/web/src/components/layout/Navbar.tsx

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Plus, LogOut, ChevronDown, User } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '@/components/ui';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const homeHref = user?.role === 'CLEANER' ? '/cleaner/dashboard' : '/dashboard';

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Don't show on landing, login, register
  const hiddenPaths = ['/', '/login', '/register'];
  if (hiddenPaths.includes(pathname)) return null;

  return (
    <header className="top-nav">
      <div className="mx-auto max-w-4xl px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href={isAuthenticated ? homeHref : '/'} className="flex items-center gap-2">
          <span className="text-xl font-extrabold text-brand-600 tracking-tight">Mama Fua</span>
          <span className="hidden sm:block text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            KhimTech
          </span>
        </Link>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            {/* Book CTA */}
            {user.role === 'CLIENT' && (
              <Link href="/book" className="btn-primary text-sm gap-1.5 hidden sm:inline-flex">
                <Plus className="h-4 w-4" />
                Book
              </Link>
            )}

            {/* Notifications bell */}
            <Link href="/notifications" className="btn-icon relative">
              <Bell className="h-5 w-5 text-gray-500" />
              {/* Uncomment when unread count is wired: */}
              {/* <span className="notif-dot">3</span> */}
            </Link>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Avatar
                  name={`${user.firstName} ${user.lastName}`}
                  src={user.avatarUrl}
                  size="sm"
                />
                <span className="hidden sm:block text-sm font-semibold text-gray-700">
                  {user.firstName}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {menuOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white shadow-modal border border-gray-100 py-2 z-20 animate-scale-in">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{user.role.toLowerCase()}</p>
                    </div>

                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <User className="h-4 w-4 text-gray-400" />
                      My profile
                    </Link>

                    {user.role === 'CLEANER' && (
                      <Link
                        href="/cleaner/wallet"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        💰 My wallet
                      </Link>
                    )}

                    {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                      <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        🛠 Admin dashboard
                      </Link>
                    )}

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
            <Link href="/login" className="btn-ghost text-sm">
              Log in
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
