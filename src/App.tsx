/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useTheme } from './lib/theme';
import { BrandMark } from './components/BrandMark';
import ErrorBoundary from './components/ErrorBoundary';

// Each area is its own chunk: visitors never download the logged-in app, and members never download the marketing page.
const AppShell = lazy(() => import('./AppShell'));
const LandingPage = lazy(() => import('./components/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const VerifyPage = lazy(() => import('./pages/VerifyPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const APP_PATHS = ['/projects/*', '/studio/*', '/brand', '/assets', '/tools/*', '/settings', '/support', '/lab/*'];

function FullScreenSplash() {
  return (
    <div className="grid h-dvh w-full place-items-center bg-bg text-fg">
      <div className="flex flex-col items-center gap-4">
        <BrandMark className="size-14" />
        <Loader2 className="size-5 animate-spin text-primary-ink" aria-hidden="true" />
        <p className="text-xs font-medium text-fg-faint">EcomFlow AI</p>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  useTheme(); // keeps the <html class="dark"> flag in sync on every page, signed in or not

  // Checking the session cookie → branded splash.
  if (loading) return <FullScreenSplash />;

  // Admin dashboard: reachable regardless of auth state (the page handles its own access check).
  if (window.location.pathname === '/admin') {
    return (
      <Suspense fallback={<FullScreenSplash />}>
        <AdminDashboard />
      </Suspense>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<FullScreenSplash />}>
        <Routes>
          {/* The legal pages are public: they open the same whether or not you are signed in. */}
          <Route path="/terms" element={<LegalPage doc="terms" />} />
          <Route path="/privacy" element={<LegalPage doc="privacy" />} />
          {user ? (
            <Route path="*" element={<AppShell />} />
          ) : (
            <>
              <Route path="/" element={<LandingPage />} />
              <Route path="/app" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              {/* app pages need an account: send visitors to the login page instead of a 404 */}
              {APP_PATHS.map((path) => <Route key={path} path={path} element={<Navigate to="/login" replace />} />)}
              <Route path="*" element={<NotFoundPage />} />
            </>
          )}
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
