import { NextResponse } from 'next/server';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').trim();

export async function GET() {
  let companyName = 'RMS Platform';
  let shortName = 'RMS';
  let description = 'Enterprise-grade PropTech platform for managing realtors, properties, and clients';

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/cms/public/branding`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const raw = await res.json();
      const data = raw?.data || raw;
      if (data?.companyName) companyName = data.companyName;
      if (data?.shortName) shortName = data.shortName;
    }
  } catch {
    // Use defaults
  }

  const manifest = {
    name: companyName,
    short_name: shortName,
    description,
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: '#0b5c46',
    icons: [
      { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
      { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
    categories: ['business', 'productivity'],
    lang: 'en',
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
