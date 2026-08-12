'use client';

import { useEffect } from 'react';

/**
 * One-time client cache/service-worker reset.
 *
 * The app ships a service worker (next-pwa) that precaches the app shell. When
 * a bad or outdated shell gets cached, users can get "stuck" on a broken load
 * that a normal refresh won't fix — only a manual cache clear does. This runs
 * that clear FOR them, automatically, on their next visit:
 *
 *   1. unregister any existing service workers (drops the stale controller)
 *   2. delete every Cache Storage bucket (drops the stale precache)
 *   3. reload ONCE so the page comes back fresh from the network
 *
 * It is guarded by RESET_VERSION in localStorage, so it fires exactly once per
 * user per version — no reload loops. To force another global reset in the
 * future, bump RESET_VERSION and redeploy.
 *
 * Deliberately does NOT touch cookies or auth state — users stay logged in.
 */

// Bump this string to trigger a fresh one-time reset for every user.
const RESET_VERSION = '2026-08-12';
const RESET_KEY = 'app_cache_reset';

export function CacheReset() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let already: string | null = null;
    try {
      already = localStorage.getItem(RESET_KEY);
    } catch {
      // localStorage blocked — skip; nothing we can safely do
      return;
    }
    if (already === RESET_VERSION) return;

    (async () => {
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
        }
      } catch {
        /* ignore */
      }

      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
        }
      } catch {
        /* ignore */
      }

      try {
        localStorage.setItem(RESET_KEY, RESET_VERSION);
      } catch {
        /* ignore */
      }

      // Come back clean from the network. Guard flag is already set, so this
      // reload will not re-trigger the reset.
      window.location.reload();
    })();
  }, []);

  return null;
}
