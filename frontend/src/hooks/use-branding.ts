'use client';

import { useState, useEffect } from 'react';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').trim();

export interface BrandingData {
  companyName?: string;
  shortName?: string;
  logo?: string;
  whatsappNumber?: string;
  supportEmail?: string;
  supportPhone?: string;
  address?: string;
}

// Module-level cache so the API is called only once per page load
const cache: { data: BrandingData | null; promise: Promise<void> | null } = {
  data: null,
  promise: null,
};

function fetchBranding(): Promise<void> {
  if (!cache.promise) {
    cache.promise = fetch(`${API_BASE_URL}/api/v1/cms/public/branding`)
      .then((r) => (r.ok ? r.json() : null))
      .then((raw) => {
        const data = raw?.data || raw;
        cache.data = data && typeof data === 'object' ? data : {};
      })
      .catch(() => {
        cache.data = {};
      });
  }
  return cache.promise;
}

export function useBranding(): BrandingData {
  const [branding, setBranding] = useState<BrandingData>(cache.data || {});

  useEffect(() => {
    if (cache.data) {
      setBranding(cache.data);
      return;
    }
    fetchBranding().then(() => {
      if (cache.data) setBranding(cache.data);
    });
  }, []);

  return branding;
}

/** Helper to get the company name with fallback */
export function getCompanyName(branding: BrandingData): string {
  return branding.companyName || 'RMS Platform';
}

/** Helper to get the short name with fallback */
export function getShortName(branding: BrandingData): string {
  return branding.shortName || 'RMS';
}
