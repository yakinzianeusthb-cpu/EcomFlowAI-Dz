import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicPageShell from '../components/PublicPageShell';
import { useLanguage } from '../context/LanguageContext';
import { useDocumentMeta } from '../lib/useDocumentMeta';

/** Shown for any address the app does not know. noindex keeps search engines from listing it (the host answers 200). */
export default function NotFoundPage() {
  const { t } = useLanguage();
  useDocumentMeta({ title: t('metaTitleNotFound', 'Page introuvable — EcomFlow AI'), noindex: true });

  return (
    <PublicPageShell>
      <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:py-32">
        <p className="text-6xl font-bold tracking-tight text-primary-ink" aria-hidden="true">404</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl rtl:leading-[1.35]">{t('notFoundTitle', 'Page introuvable')}</h1>
        <p className="mt-3 leading-relaxed text-fg-muted">{t('notFoundBody', "La page que tu cherches n'existe pas ou a été déplacée.")}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/" className="btn-dz-primary">
            <ArrowLeft size={16} className="rtl:rotate-180" aria-hidden="true" />
            {t('authBack', "Retour à l'accueil")}
          </Link>
          <Link to="/login" className="btn-dz-secondary">
            {t('lpNavLogin', 'Connexion')}
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
