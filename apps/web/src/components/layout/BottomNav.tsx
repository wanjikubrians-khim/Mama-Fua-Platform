'use client';
// Mama Fua — Bottom Navigation (mobile)
// KhimTech | 2026

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Home, Calendar, Bell, User, Wallet } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { userApi } from '@/lib/api';

export default function BottomNav() {
  const pathname = usePathname();
  const user     = useAuthStore((s) => s.user);

  const { data: notifRes } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => userApi.notifications(),
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const hiddenPaths = ['/', '/login', '/register'];
  if (!user || hiddenPaths.includes(pathname)) return null;

  const unreadCount = (notifRes?.data?.data ?? []).filter(
    (n: { isRead: boolean }) => !n.isRead
  ).length;

  const isCleaner = user.role === 'CLEANER';

  const clientLinks = [
    { href: '/dashboard',      icon: Home,     label: 'Home' },
    { href: '/bookings',       icon: Calendar, label: 'Bookings' },
    { href: '/notifications',  icon: Bell,     label: 'Alerts',  badge: unreadCount },
    { href: '/profile',        icon: User,     label: 'Profile' },
  ];

  const cleanerLinks = [
    { href: '/cleaner/dashboard', icon: Home,     label: 'Home' },
    { href: '/bookings',          icon: Calendar, label: 'Jobs' },
    { href: '/cleaner/wallet',    icon: Wallet,   label: 'Wallet' },
    { href: '/notifications',     icon: Bell,     label: 'Alerts', badge: unreadCount },
  ];

  const links = isCleaner ? cleanerLinks : clientLinks;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 sm:hidden bg-white/98 backdrop-blur-xl border-t border-ink-100">
      {/* iOS safe area */}
      <div className="flex items-center justify-around px-2 pb-safe pt-1">
        {links.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href || (href !== '/dashboard' && href !== '/cleaner/dashboard' && pathname.startsWith(href + '/'));
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-0 ${
                active ? 'text-brand-600' : 'text-ink-400 hover:text-ink-700'
              }`}
            >
              {/* Active dot indicator */}
              {active && (
                <span className="absolute -top-px left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-brand-600" />
              )}

              <span className={`relative flex h-6 w-6 items-center justify-center transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {badge != null && badge > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold text-white ring-2 ring-white">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>

              <span className={`text-[10px] font-semibold tracking-wide ${active ? 'text-brand-600' : ''}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
