import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/sonner';
import { SupportChatWidget } from '@/components/support/support-chat-widget';
import { BrandingTitle } from '@/components/branding-title';
import { BrandingGate } from '@/components/branding-gate';
import { PWASplashScreen } from '@/components/pwa-splash-screen';

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
    title: 'Easyland',
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
    // Dynamic favicon resolves to the current tenant's company logo (by host),
    // with the static favicon as a fallback.
    icon: [
      { url: '/api/favicon', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: [{ url: '/api/favicon' }],
    apple: [
      { url: '/api/favicon' },
      { url: '/apple-touch-icon.png' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#22c55e' },
    { media: '(prefers-color-scheme: dark)', color: '#052e16' },
  ],
  width: 'device-width',
  initialScale: 1,
  // Do NOT set maximumScale=1 — iOS 10+ ignores it and Safari flags it as
  // an accessibility violation. Allow users to pinch-zoom freely.
  minimumScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-visual',
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
          <PWASplashScreen />
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
