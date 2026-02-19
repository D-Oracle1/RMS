import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/sonner';
import { SupportChatWidget } from '@/components/support/support-chat-widget';
import { BrandingTitle } from '@/components/branding-title';
import { BrandingGate } from '@/components/branding-gate';

const inter = Inter({ subsets: ['latin'] });

const APP_DESCRIPTION =
  'Enterprise-grade PropTech platform for managing realtors, properties, and clients';

export const metadata: Metadata = {
  title: {
    default: 'Loading...',
    template: '%s',
  },
  description: APP_DESCRIPTION,
  keywords: ['real estate', 'property management', 'realtors', 'proptech'],
  manifest: '/api/manifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    description: APP_DESCRIPTION,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0b5c46' },
    { media: '(prefers-color-scheme: dark)', color: '#031e19' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <BrandingGate>
            <BrandingTitle />
            {children}
            <SupportChatWidget />
          </BrandingGate>
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
