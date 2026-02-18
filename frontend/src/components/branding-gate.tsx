'use client';

import { useState, useEffect } from 'react';
import { hasBrandingData, ensureBranding } from '@/hooks/use-branding';

const TIMEOUT_MS = 3000; // Safety net — never block longer than 3s

/**
 * Gates rendering of children until branding data is available.
 *
 * - Repeat visits / refreshes: localStorage was read synchronously on module init,
 *   so hasBrandingData() returns true immediately → children render on first paint,
 *   zero flash of fallback values.
 *
 * - First visit ever (no localStorage): shows a brief spinner while the API
 *   responds (~200-500ms). Falls back after TIMEOUT_MS to avoid blocking forever.
 */
export function BrandingGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // If localStorage had data, ready instantly (common case — refresh / repeat visit)
    if (hasBrandingData()) {
      setReady(true);
      // Still fetch fresh data in background to pick up CMS changes
      ensureBranding();
      return;
    }

    // First visit — wait for API, with timeout safety net
    const timeout = setTimeout(() => setReady(true), TIMEOUT_MS);
    ensureBranding().then(() => {
      clearTimeout(timeout);
      setReady(true);
    });

    return () => clearTimeout(timeout);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
