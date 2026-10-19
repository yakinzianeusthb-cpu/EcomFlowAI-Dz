/**
 * Centralised API client — all server calls go through here.
 * Replaces direct localStorage access in components.
 */

async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Email / password auth (name + email + password + 6-digit OTP)
// ---------------------------------------------------------------------------
export interface OtpChallenge {
  ok: boolean;
  email: string;
  mode: "verification" | "login";
  dev?: boolean;
  expiresInSec: number;
}

export const authApi = {
  register: (name: string, email: string, password: string) =>
    api<OtpChallenge>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  login: (email: string, password: string) =>
    api<OtpChallenge>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  verifyOtp: (email: string, code: string) =>
    api<{ user: any }>("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }),
  resendOtp: (email: string, reason?: string) =>
    api<{ ok: boolean; email: string; expiresInSec: number }>("/api/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email, ...(reason ? { reason } : {}) }),
    }),
  forgotPassword: (email: string) =>
    api<{ ok: boolean; email: string; dev?: boolean; expiresInSec: number }>("/api/auth/forgot-password", {
      method: "POST", body: JSON.stringify({ email }),
    }),
  verifyResetOtp: (email: string, code: string) =>
    api<{ ok: boolean; email: string; resetToken: string; expiresInSec: number }>("/api/auth/verify-reset-otp", {
      method: "POST", body: JSON.stringify({ email, code }),
    }),
  resetPassword: (email: string, resetToken: string, password: string) =>
    api<{ ok: boolean }>("/api/auth/reset-password", {
      method: "POST", body: JSON.stringify({ email, resetToken, password }),
    }),
};

// ---------------------------------------------------------------------------
// Settings (ad-platform tokens)
// ---------------------------------------------------------------------------
export const settingsApi = {
  get: () => api<any>("/api/settings"),
  update: (data: Record<string, any>) =>
    api("/api/settings", { method: "PUT", body: JSON.stringify(data) }),
};

// ---------------------------------------------------------------------------
// User preferences (theme, language, tool order, widget config, last state)
// ---------------------------------------------------------------------------
// Several components read the preferences on mount. Share one recent/in-flight request instead of
// firing a GET per component; updates are merged into the cached copy so later reads stay consistent.
const PREFS_TTL_MS = 15_000;
let prefsCache: { at: number; promise: Promise<any> } | null = null;

export const preferencesApi = {
  get: (): Promise<any> => {
    if (prefsCache && Date.now() - prefsCache.at < PREFS_TTL_MS) return prefsCache.promise;
    const promise = api<any>("/api/preferences");
    prefsCache = { at: Date.now(), promise };
    promise.catch(() => {
      if (prefsCache?.promise === promise) prefsCache = null;
    });
    return promise;
  },
  update: (data: Record<string, any>) => {
    if (prefsCache) {
      prefsCache = { at: prefsCache.at, promise: prefsCache.promise.then((prefs) => ({ ...prefs, ...data })) };
      prefsCache.promise.catch(() => {});
    }
    return api("/api/preferences", { method: "PUT", body: JSON.stringify(data) });
  },
  /** Drop the cached copy (login/logout) so one user's preferences never reach the next. */
  invalidate: () => {
    prefsCache = null;
  },
};

// ---------------------------------------------------------------------------
// Generation history
// ---------------------------------------------------------------------------
export interface HistoryItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  previewText?: string | null;
  payload: any;
  metadata?: any;
  createdAt: string;
}

export const historyApi = {
  list: () => api<{ history: HistoryItem[] }>("/api/history"),
  create: (data: { type: string; title: string; previewText?: string; payload: any; metadata?: any }) =>
    api<{ item: HistoryItem }>("/api/history", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string) =>
    api(`/api/history/${id}`, { method: "DELETE" }),
  clear: () =>
    api("/api/history", { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Product catalog
// ---------------------------------------------------------------------------
export interface CatalogProduct {
  id: string;
  userId: string;
  name: string;
  category: string;
  purchasePrice: number | null;
  sellingPrice: number | null;
  targetCpa: number | null;
  stock: number;
  status: string | null;
  imageUrl: string | null;
  countries: string;
  description: string | null;
  sales: number;
  euroRate: number;
  confRate: number;
  delivRate: number;
  createdAt: string;
  updatedAt: string;
}

export const catalogApi = {
  list: () => api<{ products: CatalogProduct[] }>("/api/catalog"),
  create: (data: Partial<CatalogProduct>) =>
    api<{ product: CatalogProduct }>("/api/catalog", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CatalogProduct>) =>
    api<{ product: CatalogProduct }>(`/api/catalog/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    api(`/api/catalog/${id}`, { method: "DELETE" }),
  stats: () =>
    api<{ count: number; stockAlertCount: number }>("/api/catalog/stats"),
};

// ---------------------------------------------------------------------------
// Dashboard analytics (aggregated KPIs from product catalog)
// ---------------------------------------------------------------------------
export interface DashboardSummary {
  totalProducts: number;
  activeProducts: number;
  totalSales: number;
  stockAlertCount: number;
  estimatedRevenue: number;
  estimatedDeliveredRevenue: number;
  avgConfRate: number;
  avgDelivRate: number;
  topProducts: Array<{
    id: string;
    name: string;
    category: string;
    sales: number;
    sellingPrice: number;
    stock: number;
    estimatedRevenue: number;
  }>;
  salesByCategory: Array<{
    category: string;
    count: number;
    sales: number;
    revenue: number;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stock: number;
    category: string;
  }>;
}

/** Real usage counts for the sidebar AI tools (video / landing / assembler). */
export interface AiUsageSummary {
  videoScripts: number;
  landingPages: number;
  lpSessions: number;
  totalGenerations: number;
}

export const dashboardApi = {
  summary: () => api<DashboardSummary>("/api/dashboard/summary"),
  aiUsage: () => api<AiUsageSummary>("/api/dashboard/ai-usage"),
};

// ---------------------------------------------------------------------------
// LP Sessions
// ---------------------------------------------------------------------------
export interface LpSession {
  id: string;
  userId: string;
  title: string | null;
  state: any;
  updatedAt: string;
}

export const lpSessionsApi = {
  list: () => api<{ sessions: LpSession[] }>("/api/lp-sessions"),
  create: (data: { title?: string; state: any }) =>
    api<{ session: LpSession }>("/api/lp-sessions", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { title?: string; state?: any }) =>
    api<{ session: LpSession }>(`/api/lp-sessions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    api(`/api/lp-sessions/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Chat Sessions (Expert AI)
// ---------------------------------------------------------------------------
export interface ChatSession {
  id: string;
  userId: string;
  title: string | null;
  messages: any[];
  updatedAt: string;
}

export const chatSessionsApi = {
  list: () => api<{ sessions: ChatSession[] }>("/api/chat-sessions"),
  create: (data: { title?: string; messages: any[] }) =>
    api<{ session: ChatSession }>("/api/chat-sessions", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { title?: string; messages?: any[] }) =>
    api<{ session: ChatSession }>(`/api/chat-sessions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    api(`/api/chat-sessions/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Config (public — admin contacts)
// ---------------------------------------------------------------------------
export const configApi = {
  get: () => api<{ adminEmail: string; adminTelegram: string; whatsappNumber: string; metaPublishing?: boolean }>("/api/config"),
};

// ---------------------------------------------------------------------------
// Contact form
// ---------------------------------------------------------------------------
export const contactApi = {
  send: (body: { name: string; email: string; subject: string; message: string }) =>
    api<{ ok: boolean }>("/api/contact", { method: "POST", body: JSON.stringify(body) }),
};
