import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import { useLanguage } from '../context/LanguageContext';
import { BrandLogo } from './BrandMark';

/** Header, content area and footer shared by the public pages that sit outside the product (legal pages, 404). */
export default function PublicPageShell({ children }: { children: ReactNode }) {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="sticky top-0 z-40 border-b border-line bg-bg">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="shrink-0" aria-label="EcomFlow AI">
            <BrandLogo />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line py-6">
        <nav
          aria-label={t('legalFooterNav', 'Informations légales')}
          className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 text-xs text-fg-faint sm:flex-row sm:px-6"
        >
          <p>© {new Date().getFullYear()} EcomFlow AI</p>
          <div className="flex items-center gap-5">
            <Link to="/terms" className="transition-colors hover:text-fg">
              {t('legalTermsTitle', "Conditions d'utilisation")}
            </Link>
            <Link to="/privacy" className="transition-colors hover:text-fg">
              {t('legalPrivacyTitle', 'Politique de confidentialité')}
            </Link>
          </div>
        </nav>
      </footer>
    </div>
  );
}
