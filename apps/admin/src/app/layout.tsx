import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/layout/Providers';

export const metadata: Metadata = {
  title: 'Mama Fua Admin',
  description: 'Operations and analytics dashboard for Mama Fua platform operators.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
