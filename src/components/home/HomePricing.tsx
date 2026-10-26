import { useMemo } from 'react';
import { Check, KeyRound } from 'lucide-react';
import type { PlanId } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { buildPlans, usePricing } from '../../lib/pricing';
import { cn } from '../../lib/utils';
import { reveal } from './useReveal';
import '../../i18n/home';

/** Plans and prices as the admin set them on the server (PlatformConfig), never hard-coded here. */
export default function HomePricing({ onChoose, titleClass }: { onChoose: (plan: PlanId) => void; titleClass: string }) {
  const { t, tf, language } = useLanguage();
  const pricing = usePricing();
  // tf changes with the language, which is already a dependency
  const plans = useMemo(() => buildPlans(pricing, tf), [pricing, language]);
  const features = [
    t('homePriceFeat1', 'Landing pages, vidéos et publicités'),
    t('homePriceFeat2', 'Identité de marque et bibliothèque de fichiers'),
    t('homePriceFeat3', 'Calcul de marge COD et constructeur de page'),
  ];

  return (
    <section id="pricing" tabIndex={-1} aria-labelledby="home-pricing" className="scroll-mt-20 bg-surface outline-none">
      <div className="mx-auto max-w-[1440px] px-5 py-28 sm:px-8 lg:py-44">
        <div className="max-w-3xl">
          <h2 id="home-pricing" className={titleClass} {...reveal()}>{t('homePriceTitle', 'Un abonnement, tous les studios.')}</h2>
          <p className="mt-6 max-w-[62ch] text-[16px] leading-relaxed text-fg-muted" {...reveal(80)}>
            {t('homePriceSub', 'Tu paies localement, tu envoies le justificatif depuis l’app, et un admin active ton accès.')}
          </p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {plans.map((p, i) => (
            <article
              key={p.id}
              className={cn(
                'flex flex-col rounded-[var(--radius-lg)] p-6 sm:p-8',
                // the recommended plan stands out by a step of tone in the accent's hue, not by a line or a shadow
                p.popular ? 'bg-[color-mix(in_oklab,var(--primary)_16%,var(--surface-2))]' : 'bg-bg',
              )}
              {...reveal(120 + i * 70)}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[17px] font-semibold text-fg">{p.label}</h3>
                {p.popular && <span className="rounded-[var(--radius-xs)] bg-primary px-2.5 py-0.5 text-[13px] font-semibold text-white">{t('planRecommended', 'Recommandé')}</span>}
              </div>
              <p className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-4xl font-semibold tabular-nums tracking-tight text-fg" dir="ltr">{p.price}</span>
                <span className="text-sm text-fg-muted">{p.note}</span>
              </p>
              <p className="mt-2 text-[13px] text-fg-muted">{p.per} · {p.tagline}</p>
              <ul className="mt-8 flex-1 space-y-2.5 text-[15px] text-fg-muted">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={15} className="mt-1 shrink-0 text-primary-ink" />
                    {f}
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => onChoose(p.id)} className={cn('mt-8 w-full', p.popular ? 'btn-dz-primary' : 'btn-dz-secondary')}>
                {t('homePriceSubscribe', 'Choisir ce plan')}
              </button>
            </article>
          ))}
        </div>

        <p className="mt-10 flex max-w-[62ch] items-start gap-2.5 text-[14px] leading-relaxed text-fg-muted">
          <KeyRound size={15} className="mt-1 shrink-0 text-primary-ink" />
          {t('homePriceKeyNote', 'La génération utilise ta propre clé Gemini (Google AI Studio). La clé gratuite suffit pour les textes ; les images et les clips vidéo IA demandent la facturation Google.')}
        </p>
      </div>
    </section>
  );
}
