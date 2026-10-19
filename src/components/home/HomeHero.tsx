import { useRef, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import HeroCanvas from './HeroCanvas';
import '../../i18n/home';

const rise = (ms: number) => ({ '--rise-delay': `${ms}ms` }) as CSSProperties;

/**
 * The first screen: the promise in very large light type over a fluted glass panel, the 3D object turning beside
 * it, and three facts about the product (not invented figures) with the one action.
 */
export default function HomeHero() {
  const { t, isRTL } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const facts = [
    { value: '58', label: t('homeStatWilayas', 'wilayas dans chaque formulaire de commande') },
    { value: '4', label: t('homeStatFormats', 'formats vidéo, de la story au plein écran') },
    { value: '3', label: t('homeStatLangs', 'langues : arabe, français et anglais') },
  ];

  return (
    <section ref={sectionRef} aria-labelledby="home-hero" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-bg">
      <div aria-hidden="true" className="hero-backdrop absolute inset-0" />
      <HeroCanvas sectionRef={sectionRef} panelRef={panelRef} anchorRef={anchorRef} rtl={isRTL} />
      {/* layout guides read by the 3D scene: the fluted glass panel, and (below) the object's place */}
      <div ref={panelRef} aria-hidden="true" className="pointer-events-none absolute inset-y-0 start-0 w-[44%] lg:w-[48%]" />

      <div className="relative mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 content-start px-5 pb-10 pt-28 sm:px-8 sm:pt-32 lg:grid-cols-12 lg:content-stretch lg:gap-x-8 lg:pb-12 lg:pt-32">
        <div className="flex flex-col lg:col-span-5 lg:row-start-1 lg:justify-center lg:pb-16">
          <h1 id="home-hero" className="hero-title hero-rise text-fg" style={rise(60)}>
            {t('homeHeroHeadline', 'Une photo. Toute la campagne.')}
          </h1>
          <p className="hero-rise mt-8 max-w-[25rem] text-[16px] leading-relaxed text-fg-muted sm:text-[17px]" style={rise(160)}>
            {t('homeHeroLead', 'Dépose les photos de ton produit. EcomFlow AI écrit la landing page, le script vidéo et les publicités, aux couleurs de ta marque, en arabe, en français ou en anglais.')}
          </p>
          {/* on a phone the action comes right after the promise; on a desktop it closes the right-hand column */}
          <Link to="/register" className="pill-cta hero-rise mt-8 self-start lg:hidden" style={rise(240)}>
            {t('homeCtaStart', 'Créer mon compte')}
            <span className="pill-cta-dot"><ArrowUpRight size={18} className="rtl:-scale-x-100" /></span>
          </Link>
        </div>

        <div
          ref={anchorRef}
          aria-hidden="true"
          className="pointer-events-none ms-[16%] mt-4 h-[min(86vw,24rem)] lg:absolute lg:bottom-[13%] lg:start-[40%] lg:top-[15%] lg:ms-0 lg:mt-0 lg:h-auto lg:w-[34%]"
        />

        <div className="mt-6 flex flex-col gap-10 lg:col-span-3 lg:col-start-10 lg:row-start-1 lg:mt-0 lg:justify-between lg:gap-8">
          <ul aria-label={t('homeHeroFacts', 'En bref')} className="grid grid-cols-3 gap-4 lg:grid-cols-1 lg:gap-8">
            {facts.map((fact, i) => (
              <li key={fact.label} className="hero-rise" style={rise(260 + i * 70)}>
                <span className="hero-stat text-fg" dir="ltr">{fact.value}</span>
                <span className="mt-2 block text-[13px] leading-snug text-fg-muted">{fact.label}</span>
              </li>
            ))}
          </ul>
          <div className="hero-rise" style={rise(480)}>
            <p className="max-w-[23rem] text-[16px] leading-relaxed text-fg-muted lg:hidden xl:block">
              {t('homeHeroSide', 'Pensé pour la vente en paiement à la livraison en Algérie. Chaque campagne garde ses photos, son brief et toutes ses versions, et rien n’est publié sans ton accord.')}
            </p>
            <Link to="/register" className="pill-cta mt-6 hidden lg:inline-flex">
              {t('homeCtaStart', 'Créer mon compte')}
              <span className="pill-cta-dot"><ArrowUpRight size={18} className="rtl:-scale-x-100" /></span>
            </Link>
          </div>
        </div>

        <a
          href="#workflow"
          className="hero-rise mt-12 inline-flex w-fit items-center gap-2 rounded-full py-2 text-[13px] font-medium text-fg-muted transition-colors duration-200 hover:text-fg lg:absolute lg:bottom-8 lg:start-8 lg:mt-0"
          style={rise(560)}
        >
          {t('homeCtaHow', 'Voir le parcours')}
          <ArrowDownRight size={15} className="rtl:-scale-x-100" />
        </a>
      </div>
    </section>
  );
}
