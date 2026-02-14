'use client';

import Link from 'next/link';
import { Building2, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/api';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').trim();

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/properties', label: 'Properties' },
  { href: '/features', label: 'Features' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
];

export interface BrandingData {
  companyName?: string;
  shortName?: string;
  logo?: string;
}

interface PublicNavbarProps {
  currentPage?: string;
  branding?: BrandingData;
}

export function PublicNavbar({ currentPage, branding: brandingProp }: PublicNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [branding, setBranding] = useState<BrandingData>(brandingProp || {});

  // Fetch branding if not passed as prop
  useEffect(() => {
    if (brandingProp) {
      setBranding(brandingProp);
      return;
    }
    fetch(`${API_BASE_URL}/api/v1/cms/public/branding`)
      .then((r) => r.ok ? r.json() : null)
      .then((raw) => {
        const data = raw?.data || raw;
        if (data && typeof data === 'object') setBranding(data);
      })
      .catch(() => {});
  }, [brandingProp]);

  const companyName = branding.companyName || 'RMS Platform';
  const logoUrl = branding.logo ? (branding.logo.startsWith('http') ? branding.logo : getImageUrl(branding.logo)) : '';

  return (
    <nav className="fixed top-0 w-full z-50 bg-primary/95 backdrop-blur-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="w-10 h-10 rounded-lg object-contain" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          )}
          <span className="text-xl font-bold text-white">{companyName}</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors',
                currentPage === link.href
                  ? 'text-accent'
                  : 'text-white/90 hover:text-accent',
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="hidden sm:block">
            <Button variant="ghost" className="text-white hover:text-accent hover:bg-white/10">
              Log in
            </Button>
          </Link>
          <Link href="/auth/register" className="hidden sm:block">
            <Button className="bg-accent hover:bg-accent-600 text-white shadow-accent">
              Get Started
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-primary/95 backdrop-blur-lg border-t border-white/10 px-4 py-4 space-y-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'block py-2 text-sm font-medium transition-colors',
                currentPage === link.href
                  ? 'text-accent'
                  : 'text-white/90 hover:text-accent',
              )}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2 border-t border-white/10">
            <Link href="/auth/login" className="flex-1">
              <Button variant="ghost" className="w-full text-white hover:text-accent hover:bg-white/10">
                Log in
              </Button>
            </Link>
            <Link href="/auth/register" className="flex-1">
              <Button className="w-full bg-accent hover:bg-accent-600 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
