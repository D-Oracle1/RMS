'use client';

import Link from 'next/link';
import { Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { getImageUrl } from '@/lib/api';
import type { BrandingData } from './public-navbar';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FooterData {
  description?: string;
  quickLinks?: { label: string; href: string }[];
  services?: string[];
}

export function PublicFooter({ cmsData, branding: brandingProp }: { cmsData?: FooterData; branding?: BrandingData }) {
  const [branding, setBranding] = useState<BrandingData>(brandingProp || {});

  useEffect(() => {
    if (brandingProp) {
      setBranding(brandingProp);
      return;
    }
    fetch(`${API_BASE_URL}/api/v1/cms/public/branding`)
      .then((r) => r.ok ? r.json() : null)
      .then((raw) => {
        const d = raw?.data || raw;
        if (d && typeof d === 'object') setBranding(d);
      })
      .catch(() => {});
  }, [brandingProp]);

  const companyName = branding.companyName || 'RMS Platform';
  const logoUrl = branding.logo ? (branding.logo.startsWith('http') ? branding.logo : getImageUrl(branding.logo)) : '';
  const description = cmsData?.description || '';
  const quickLinks = cmsData?.quickLinks || [];
  const services = cmsData?.services || [];

  return (
    <footer className="py-12 px-4 bg-primary dark:bg-primary-950 border-t border-primary-600">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt={companyName} className="w-10 h-10 rounded-lg object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              )}
              <span className="text-xl font-bold text-white">{companyName}</span>
            </div>
            {description && <p className="text-white/70 text-sm">{description}</p>}
          </div>
          {quickLinks.length > 0 && (
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-white/70 hover:text-accent transition-colors text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {services.length > 0 && (
            <div>
              <h4 className="font-semibold text-white mb-4">Services</h4>
              <ul className="space-y-2">
                {services.map((service) => (
                  <li key={service}>
                    <Link href="#" className="text-white/70 hover:text-accent transition-colors text-sm">
                      {service}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h4 className="font-semibold text-white mb-4">Newsletter</h4>
            <p className="text-white/70 text-sm mb-4">Subscribe to get updates on new properties and offers.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
              />
              <Button className="bg-accent hover:bg-accent-600 text-white">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/70">
            &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((link) => (
              <Link key={link} href="#" className="text-white/70 hover:text-accent transition-colors text-sm">
                {link}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
