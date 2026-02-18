'use client';

import { useEffect } from 'react';
import { useBranding, getCompanyName } from '@/hooks/use-branding';

export function BrandingTitle() {
  const branding = useBranding();
  const companyName = getCompanyName(branding);

  useEffect(() => {
    if (branding.companyName) {
      document.title = document.title.replace(/RMS Platform/g, companyName);
    }
  }, [branding.companyName, companyName]);

  return null;
}
