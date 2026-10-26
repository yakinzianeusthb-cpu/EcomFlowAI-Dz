import { useEffect, useState } from 'react';
import PublicPageShell from '../components/PublicPageShell';
import { useLanguage } from '../context/LanguageContext';
import { formatDate } from '../i18n/dates';
import { LEGAL, LEGAL_VERSION_DATE, type LegalDocId } from '../legal/content';
import { useDocumentMeta } from '../lib/useDocumentMeta';

/** Terms of Service or Privacy Policy, in the visitor's language. */
export default function LegalPage({ doc }: { doc: LegalDocId }) {
  const { t, language } = useLanguage();
  const [contactEmail, setContactEmail] = useState('');
  const content = LEGAL[doc][language];
  const title = doc === 'terms' ? t('legalTermsTitle', "Conditions d'utilisation") : t('legalPrivacyTitle', 'Politique de confidentialité');

  useDocumentMeta({ title: `${title} — EcomFlow AI`, description: content.intro });

  // The contact address is the one the admin configures for the platform.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((cfg) => { if (!cancelled && cfg?.adminEmail) setContactEmail(cfg.adminEmail); })
      .catch(() => { /* the fallback sentence is shown instead */ });
    return () => { cancelled = true; };
  }, []);

  const updated = formatDate(LEGAL_VERSION_DATE, language, { dateStyle: 'long' });

  return (
    <PublicPageShell>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl rtl:leading-[1.35]">{title}</h1>
        <p className="mt-2 text-sm text-fg-faint">{t('legalUpdated', 'Dernière mise à jour : {date}', { date: updated })}</p>
        <p className="mt-6 text-base leading-relaxed text-fg-muted">{content.intro}</p>

        {content.sections.map((section, index) => (
          <section key={section.heading} className="mt-10" aria-labelledby={`legal-${doc}-${index}`}>
            {/* The number is a badge, not "1." text: punctuation next to Arabic gets reordered by the bidi algorithm. */}
            <h2 id={`legal-${doc}-${index}`} className="flex items-center gap-3 text-lg font-semibold text-fg">
              <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold tabular-nums text-fg-muted">
                {index + 1}
              </span>
              {section.heading}
            </h2>
            {section.paragraphs?.map((p) => (
              <p key={p} className="mt-3 leading-relaxed text-fg-muted">{p}</p>
            ))}
            {section.bullets && (
              <ul className="mt-3 list-disc space-y-2 ps-5 leading-relaxed text-fg-muted marker:text-fg-faint">
                {section.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            )}
          </section>
        ))}

        <section className="mt-10 rounded-xl border border-line bg-surface p-5" aria-labelledby={`legal-${doc}-contact`}>
          <h2 id={`legal-${doc}-contact`} className="text-lg font-semibold text-fg">{t('legalContactTitle', 'Nous contacter')}</h2>
          <p className="mt-2 leading-relaxed text-fg-muted">
            {contactEmail
              ? t('legalContactBody', 'Pour toute question sur ce document, ou pour exercer tes droits sur tes données, écris-nous à {email}.', { email: contactEmail })
              : t('legalContactFallback', 'Pour toute question sur ce document, utilise la page Contact de ton espace.')}
          </p>
        </section>
      </article>
    </PublicPageShell>
  );
}
