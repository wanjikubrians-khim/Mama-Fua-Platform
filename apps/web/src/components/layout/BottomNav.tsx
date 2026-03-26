'use client';
// Mama Fua — Bottom Navigation (mobile web)
// KhimTech | 2026
// Place in: apps/web/src/components/layout/BottomNav.tsx

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Home, Calendar, Bell, User, Wallet } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { userApi } from '@/lib/api';

export default function BottomNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const { data: notifRes } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => userApi.notifications(),
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Only show on authenticated pages, not landing/auth
  const hiddenPaths = ['/', '/login', '/register'];
  if (!user || hiddenPaths.includes(pathname)) return null;

  const unreadCount = (notifRes?.data?.data ?? []).filter(
    (notification: { isRead: boolean }) => !notification.isRead
  ).length;

  const isClient = user.role === 'CLIENT';
  const isCleaner = user.role === 'CLEANER';

  const clientLinks = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/bookings', icon: Calendar, label: 'Bookings' },
    { href: '/notifications', icon: Bell, label: 'Alerts' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  const cleanerLinks = [
    { href: '/cleaner/dashboard', icon: Home, label: 'Home' },
    { href: '/bookings', icon: Calendar, label: 'Jobs' },
    { href: '/cleaner/wallet', icon: Wallet, label: 'Wallet' },
    { href: '/notifications', icon: Bell, label: 'Alerts' },
  ];

  const links = isCleaner ? cleanerLinks : clientLinks;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 sm:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-0 ${
                active ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="relative">
                <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'stroke-[2.5px]' : ''}`} />
                {href === '/notifications' && unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </span>
              <span
                className={`text-[10px] font-semibold tracking-wide truncate ${active ? 'text-brand-600' : ''}`}
              >
                {label}
              </span>
              {active && (
                <span className="absolute -top-px left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-brand-600" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
