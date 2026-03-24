// Mama Fua — Root Layout
// KhimTech | 2026

import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/layout/Providers';

export const metadata: Metadata = {
  title: { default: 'Mama Fua', template: '%s | Mama Fua' },
  description: 'Trusted cleaning & home services marketplace in Kenya — by KhimTech',
  keywords: ['cleaning', 'mama fua', 'home services', 'Kenya', 'Nairobi'],
  openGraph: {
    title: 'Mama Fua',
    description: 'Book trusted cleaners near you',
    type: 'website',
    locale: 'en_KE',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased text-ink-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
