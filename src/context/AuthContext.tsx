import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { preferencesApi, authApi, OtpChallenge } from '../services/api';
import { useLanguage } from './LanguageContext';

export type PlanId = 'monthly' | 'quarterly' | 'lifetime' | 'custom';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  /** Profile picture as returned by /api/auth/me (Prisma column). */
  avatarUrl?: string | null;
  isAdmin?: boolean;
  plan: PlanId | null;
  planStatus: 'pending' | 'active' | null;
  /** Prisma DateTime serialized as an ISO string over the wire. */
  planSelectedAt?: string | null;
  planActiveFrom?: string | null;
  planExpiresAt?: string | null;
  /** Granted duration in days (custom/admin grants); null = lifetime. */
  planDays?: number | null;
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isMock: boolean;
  /** Start Google OAuth (redirect). */
  login: () => void;
  /** Register with name + email + password → sends a verification OTP. */
  register: (name: string, email: string, password: string) => Promise<OtpChallenge>;
  /** Email + password → sends a 6-digit OTP to the inbox. */
  loginWithEmail: (email: string, password: string) => Promise<OtpChallenge>;
  /** Confirm the 6-digit OTP and open the session. */
  verifyOtp: (email: string, code: string) => Promise<void>;
  /** Request a fresh OTP (rate-limited server-side). */
  resendOtp: (email: string) => Promise<{ ok: boolean; email: string; expiresInSec: number }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  selectPlan: (plan: PlanId) => Promise<AuthUser>;
  /** Call after login to sync server-stored preferences → localStorage. */
  syncPreferences: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Sync server preferences into localStorage for instant UI effect. */
async function syncPrefsToLocal() {
  try {
    const preferences = await preferencesApi.get();
    if (!preferences) return;
    if (preferences.theme) {
      localStorage.setItem('theme', preferences.theme);
      // Tell mounted toggles/the document class to follow the server-side preference right away.
      window.dispatchEvent(new Event('dz_theme_changed'));
    }
    if (preferences.language) localStorage.setItem('dzads_language', preferences.language);
    if (preferences.toolsOrder) localStorage.setItem('dzads_tools_order', JSON.stringify(preferences.toolsOrder));
    if (preferences.dashboardConfig) localStorage.setItem('dashboard_config', JSON.stringify(preferences.dashboardConfig));
    if (preferences.dashboardWidgetOrder) localStorage.setItem('dashboard_widget_order', JSON.stringify(preferences.dashboardWidgetOrder));
    if (preferences.lastImage) localStorage.setItem('dzads_last_generated_image', JSON.stringify(preferences.lastImage));
    if (preferences.lastScript) localStorage.setItem('dzads_last_generated_script', JSON.stringify(preferences.lastScript));
    if (preferences.lastLpActiveId) localStorage.setItem('dzads_lp_last_active_id', preferences.lastLpActiveId);
    if (preferences.lastChatActiveId) localStorage.setItem('ecommerce_expert_last_active_session_id', preferences.lastChatActiveId);
  } catch (e) {
    console.warn('Failed to sync preferences from server:', e);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    try {
      // index.html starts the session check before this bundle runs; consume that result once.
      const w = window as unknown as { __dzMe?: Promise<{ ok: boolean; data?: any }> };
      const early = w.__dzMe;
      w.__dzMe = undefined;
      let ok: boolean;
      let data: any = null;
      if (early) {
        const result = await early;
        ok = result.ok;
        data = result.data;
      } else {
        const res = await fetch('/api/auth/me');
        ok = res.ok;
        if (ok) data = await res.json();
      }
      if (ok) {
        setUser(data.user);
        setIsMock(Boolean(data.isMock));
        // Remember that this browser has a session so the next visit can prefetch the app code early.
        try { localStorage.setItem('dz_returning', '1'); } catch { /* ignore */ }
        // Sync server preferences → localStorage on login.
        if (data.user) syncPrefsToLocal();
      } else {
        setUser(null);
        setIsMock(false);
        try { localStorage.removeItem('dz_returning'); } catch { /* ignore */ }
      }
    } catch {
      setUser(null);
      setIsMock(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(() => {
    window.location.href = '/api/auth/google';
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    return authApi.register(name, email, password);
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    return authApi.login(email, password);
  }, []);

  const verifyOtp = useCallback(async (email: string, code: string) => {
    preferencesApi.invalidate();
    const data = await authApi.verifyOtp(email, code);
    setUser(data.user);
    setIsMock(false);
    if (data.user) syncPrefsToLocal();
  }, []);

  const resendOtp = useCallback(async (email: string) => {
    return authApi.resendOtp(email);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setUser(null);
    setIsMock(false);
    preferencesApi.invalidate();
    try { localStorage.removeItem('dz_returning'); } catch { /* ignore */ }
    // Clear local preference cache on logout.
    localStorage.removeItem('dzads_last_generated_image');
    localStorage.removeItem('dzads_last_generated_script');
    localStorage.removeItem('dzads_tools_order');
    localStorage.removeItem('dashboard_config');
    localStorage.removeItem('dashboard_widget_order');
    localStorage.removeItem('dzads_lp_sessions');
    localStorage.removeItem('dzads_lp_last_active_id');
    localStorage.removeItem('dzads_lp_whatsapp'); // the order WhatsApp number of the landing publisher
    localStorage.removeItem('ecommerce_expert_sessions');
    localStorage.removeItem('ecommerce_expert_last_active_session_id');
    localStorage.removeItem('dzads_settings');
    localStorage.removeItem('dzads_generation_history');
  }, []);

  const selectPlan = useCallback(async (plan: PlanId) => {
    const res = await fetch('/api/auth/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || t('coImpossibleSelectionnerCePlan', 'Impossible de sélectionner ce plan.'));
    }
    const data = await res.json();
    setUser(data.user);
    return data.user as AuthUser;
  }, []);

  const syncPreferences = useCallback(async () => {
    await syncPrefsToLocal();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isMock, login, register, loginWithEmail, verifyOtp, resendOtp, logout, refresh, selectPlan, syncPreferences }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
