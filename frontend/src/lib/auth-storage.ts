/**
 * Auth storage utilities using sessionStorage for tab isolation.
 * Each browser tab gets its own independent auth session, preventing
 * cross-tab contamination when testing multiple accounts.
 */

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getUser(): { id: string; firstName: string; lastName: string; email: string; role: string; avatar?: string; companyId?: string; isSuperAdmin?: boolean; referralCode?: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = sessionStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: Record<string, any>): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function updateUser(updates: Record<string, any>): void {
  try {
    const stored = sessionStorage.getItem(USER_KEY);
    if (stored) {
      const user = JSON.parse(stored);
      const updated = { ...user, ...updates };
      sessionStorage.setItem(USER_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('user-updated'));
    }
  } catch {}
}

export function clearAuth(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}
