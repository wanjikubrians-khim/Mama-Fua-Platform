'use client';
// Mama Fua — Bottom Navigation (mobile web)
// KhimTech | 2026
// Place in: apps/web/src/components/layout/BottomNav.tsx

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Bell, User, Wallet } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export default function BottomNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  // Only show on authenticated pages, not landing/auth
  const hiddenPaths = ['/', '/login', '/register'];
  if (!user || hiddenPaths.includes(pathname)) return null;

  const isClient  = user.role === 'CLIENT';
  const isCleaner = user.role === 'CLEANER';

  const clientLinks = [
    { href: '/dashboard',      icon: Home,     label: 'Home' },
    { href: '/bookings',       icon: Calendar, label: 'Bookings' },
    { href: '/notifications',  icon: Bell,     label: 'Alerts' },
    { href: '/profile',        icon: User,     label: 'Profile' },
  ];

  const cleanerLinks = [
    { href: '/cleaner/dashboard', icon: Home,     label: 'Home' },
    { href: '/bookings',          icon: Calendar, label: 'Jobs' },
    { href: '/cleaner/wallet',    icon: Wallet,   label: 'Wallet' },
    { href: '/profile',           icon: User,     label: 'Profile' },
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
                active
                  ? 'text-brand-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'stroke-[2.5px]' : ''}`} />
              <span className={`text-[10px] font-semibold tracking-wide truncate ${active ? 'text-brand-600' : ''}`}>
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