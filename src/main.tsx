import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App';
// Self-hosted variable fonts (no render-blocking third-party stylesheet).
import '@fontsource-variable/geist';
import '@fontsource-variable/noto-sans-arabic/wght.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/noto-naskh-arabic';
import './index.css';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';

// Start downloading the chunk the first screen needs now, in parallel with the session check,
// instead of waiting for /api/auth/me to answer before the right code is requested.
const BOOT_CHUNKS: [RegExp, () => Promise<unknown>][] = [
  [/^\/admin/, () => import('./pages/AdminDashboard')],
  [/^\/login/, () => import('./pages/LoginPage')],
  [/^\/register/, () => import('./pages/RegisterPage')],
  [/^\/verify/, () => import('./pages/VerifyPage')],
  [/^\/forgot-password/, () => import('./pages/ForgotPasswordPage')],
  [/^\/(terms|privacy)/, () => import('./pages/LegalPage')],
];
try {
  const path = window.location.pathname;
  const match = BOOT_CHUNKS.find(([re]) => re.test(path));
  if (match) void match[1]();
  else if (localStorage.getItem('dz_returning') === '1') {
    void import('./AppShell');
    void import('./components/DashboardHome');
  }
  else void import('./components/LandingPage');
} catch {
  /* prefetch is best-effort */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <LanguageProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </LanguageProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
