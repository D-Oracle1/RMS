'use client';

import { useEffect } from 'react';
import { useBranding } from '@/hooks/use-branding';

/**
 * Replaces hardcoded "RMS Platform" in the browser tab title with the
 * CMS company name. Also watches for title changes (route transitions)
 * and re-applies the replacement automatically.
 */
export function BrandingTitle() {
  const branding = useBranding();

  useEffect(() => {
    if (!branding.companyName) return;

    const name = branding.companyName;

    const applyTitle = () => {
      if (document.title.includes('RMS Platform')) {
        document.title = document.title.replace(/RMS Platform/g, name);
      }
    };

    // Apply immediately
    applyTitle();

    // Watch for title changes from Next.js route transitions
    const titleEl = document.querySelector('title');
    if (!titleEl) return;

    const observer = new MutationObserver(applyTitle);
    observer.observe(titleEl, { childList: true, characterData: true, subtree: true });

    return () => observer.disconnect();
  }, [branding.companyName]);

  return null;
}
