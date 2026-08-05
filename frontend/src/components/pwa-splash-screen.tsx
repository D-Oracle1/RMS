'use client';

import { useEffect, useState } from 'react';
import { useBranding } from '@/hooks/use-branding';
import { getImageUrl } from '@/lib/api';

/**
 * Branded launch splash for the installed PWA.
 *
 * Shows the company logo on the brand background when the app is opened in
 * standalone (installed) mode, then fades out once the page has loaded. On
 * repeat launches the logo is already in the branding cache (localStorage),
 * so it paints instantly with no flash. Plain web visits are left untouched.
 */
export function PWASplashScreen() {
  const branding = useBranding();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    // Only for the installed PWA, and only once per app session.
    if (!isStandalone || sessionStorage.getItem('pwa_splash_shown')) return;
    sessionStorage.setItem('pwa_splash_shown', '1');
    setVisible(true);

    const MIN_MS = 700; // keep the logo on screen long enough to register
    const FADE_MS = 400;
    const start = Date.now();

    const finish = () => {
      const wait = Math.max(0, MIN_MS - (Date.now() - start));
      window.setTimeout(() => {
        setLeaving(true);
        window.setTimeout(() => setVisible(false), FADE_MS);
      }, wait);
    };

    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });
    return () => window.removeEventListener('load', finish);
  }, []);

  if (!visible) return null;

  const logo = branding.logo
    ? branding.logo.startsWith('http')
      ? branding.logo
      : getImageUrl(branding.logo)
    : null;
  const accent = branding.primaryColor || '#22c55e';

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-gray-950 transition-opacity ease-out ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ transitionDuration: '400ms' }}
    >
      <style>{`
        @keyframes pwaSplashPop {
          0% { opacity: 0; transform: scale(.82); }
          60% { opacity: 1; transform: scale(1.04); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pwaSplashBar {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(320%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pwa-splash-logo { animation: none !important; }
          .pwa-splash-bar { animation: none !important; }
        }
      `}</style>

      <div className="flex flex-col items-center gap-9">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt=""
            className="pwa-splash-logo h-28 w-28 object-contain"
            style={{ animation: 'pwaSplashPop .6s ease-out both' }}
          />
        ) : (
          <div
            className="pwa-splash-logo h-28 w-28 rounded-3xl"
            style={{ background: accent, animation: 'pwaSplashPop .6s ease-out both' }}
          />
        )}

        <div className="h-1 w-24 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div
            className="pwa-splash-bar h-full w-1/3 rounded-full"
            style={{ background: accent, animation: 'pwaSplashBar 1.1s ease-in-out infinite' }}
          />
        </div>
      </div>
    </div>
  );
}
