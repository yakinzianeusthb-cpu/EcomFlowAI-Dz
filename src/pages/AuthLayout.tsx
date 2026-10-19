import { motion } from 'framer-motion';
import { ArrowLeft, Clapperboard, LayoutTemplate, Megaphone, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { BrandLogo } from '../components/BrandMark';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  showBack = true,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  showBack?: boolean;
}) {
  const { t } = useLanguage();
  const outputs = [
    { icon: LayoutTemplate, label: t('menuLanding', 'Landing pages') },
    { icon: Clapperboard, label: t('menuVideo', 'Pubs vidéo') },
    { icon: Megaphone, label: t('menuAds', 'Publicités') },
  ];

  return (
    <div className="min-h-dvh bg-bg font-sans antialiased lg:grid lg:grid-cols-[1fr_1.05fr]">
      {/* brand panel: desktop only, always dark */}
      <aside className="auth-brand theme-dark grain relative hidden flex-col justify-between overflow-hidden px-10 py-10 lg:sticky lg:top-0 lg:flex lg:h-dvh xl:px-16">
        <Link to="/" className="w-fit" aria-label="EcomFlow AI">
          <BrandLogo />
        </Link>

        <div>
          <p className="eyebrow">{t('authBrandBadge', 'Pour les vendeurs e-commerce en Algérie')}</p>
          <p className="display-title mt-5 text-5xl text-fg xl:text-6xl rtl:text-[2.75rem] rtl:xl:text-5xl">
            {t('authBrandHeadlineA', 'Une photo produit.')}
            <br />
            <em className="text-primary-ink rtl:not-italic">{t('authBrandHeadlineB', 'Toute la campagne.')}</em>
          </p>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-fg-muted">
            {t('authBrandDesc', 'La landing page, le script vidéo et les publicités, rédigés à partir de tes photos, aux couleurs de ta marque.')}
          </p>
          <ul className="mt-10 max-w-sm space-y-2.5">
            {outputs.map(({ icon: Icon, label }, i) => (
              <li key={label} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-line bg-surface/60 px-4 py-3">
                <span className="grid size-8 place-items-center rounded-[var(--radius-sm)] bg-primary/15 text-primary-ink">
                  <Icon size={16} />
                </span>
                <span className="text-sm font-medium text-fg">{label}</span>
                <span className="ms-auto text-xs tabular-nums text-fg-faint" dir="ltr">{String(i + 1).padStart(2, '0')}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-fg-faint">© {new Date().getFullYear()} EcomFlow AI</p>
          <LanguageSwitcher />
        </div>
      </aside>

      {/* form panel: follows the light/dark theme */}
      <main className="relative flex min-h-dvh flex-col">
        <header className="flex items-center justify-between px-5 py-4 sm:px-8 lg:hidden">
          <Link to="/" aria-label="EcomFlow AI">
            <BrandLogo />
          </Link>
          <LanguageSwitcher />
        </header>

        <header className="hidden justify-end px-8 py-5 lg:flex">
          <LanguageSwitcher />
        </header>

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
          <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {showBack && (
              <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-fg-muted transition-colors hover:text-fg">
                <ArrowLeft size={13} className="rtl:rotate-180" /> {t('authBack', "Retour à l'accueil")}
              </Link>
            )}

            <div className="ui-card p-6 sm:p-10">
              <h1 className="display-title text-3xl text-fg sm:text-4xl">{title}</h1>
              {subtitle && <p className="mt-3 text-sm leading-relaxed text-fg-muted">{subtitle}</p>}

              <div className="mt-7">{children}</div>

              {footer && <div className="mt-7 border-t border-line pt-6 text-center text-[13px] text-fg-muted">{footer}</div>}
            </div>

            <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-fg-faint">
              <ShieldCheck size={12} className="text-primary-ink" />
              {t('authSecure', 'Connexion sécurisée · code à 6 chiffres')}
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
