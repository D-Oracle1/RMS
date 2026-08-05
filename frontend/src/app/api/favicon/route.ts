import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').trim();

/**
 * Dynamic favicon — serves the current tenant's company logo.
 *
 * The browser requests the favicon with the site's Host header, so we resolve
 * the tenant by domain (same mechanism as /api/manifest), then proxy the logo
 * bytes back same-origin (a redirect to a cross-origin blob URL is unreliable
 * for `rel="icon"` in some browsers). Falls back to the static favicon.
 */
export async function GET(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const domain = host.split(':')[0];

  let logoUrl: string | null = null;
  if (domain) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/companies/resolve?domain=${encodeURIComponent(domain)}`,
        { next: { revalidate: 300 } },
      );
      if (res.ok) {
        const raw = await res.json();
        const company = raw?.data || raw;
        logoUrl = company?.logo || company?.pwaSettings?.splashLogo || null;
      }
    } catch {
      // fall through to static fallback
    }
  }

  if (logoUrl) {
    try {
      const img = await fetch(logoUrl, { next: { revalidate: 300 } });
      if (img.ok) {
        const buf = await img.arrayBuffer();
        return new NextResponse(buf, {
          headers: {
            'Content-Type': img.headers.get('content-type') || 'image/png',
            'Cache-Control': 'public, max-age=300, s-maxage=300',
          },
        });
      }
    } catch {
      // fall through to static fallback
    }
  }

  return NextResponse.redirect(new URL('/favicon.ico', req.url));
}
