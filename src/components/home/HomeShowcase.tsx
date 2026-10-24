import { useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../lib/utils';
import { reveal } from './useReveal';
import '../../i18n/home';

/** The parts of the long page, as fractions of its height (public/showcase/douche-plage.webp, 720 × 2124). */
const PARTS = [
  { id: 'headline', top: 0, bottom: 0.125 },
  { id: 'product', top: 0.115, bottom: 0.395 },
  { id: 'cta', top: 0.375, bottom: 0.49 },
  { id: 'details', top: 0.49, bottom: 1 },
] as const;
type PartId = (typeof PARTS)[number]['id'];

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Real work, shown as a specimen: a long landing page made for an Algerian shop, whole, with the four jobs its parts
 * do beside it. Choosing one dims the rest of the page, so the visitor sees what each part is for; then six more
 * pages in other niches.
 */
export default function HomeShowcase({ titleClass }: { titleClass: string }) {
  const { t } = useLanguage();
  const [active, setActive] = useState<PartId | null>(null);
  const specimen = useRef<HTMLDivElement>(null);

  const notes: Record<PartId, { title: string; text: string }> = {
    headline: { title: t('homeWorkNote1Title', 'Le titre dans l’image'), text: t('homeWorkNote1Text', 'Une promesse courte, lisible même en défilant vite dans le fil Facebook.') },
    product: { title: t('homeWorkNote2Title', 'Le produit en situation'), text: t('homeWorkNote2Text', 'Ton vrai produit, gardé tel quel par l’IA, dans la scène où il sert.') },
    cta: { title: t('homeWorkNote3Title', 'Les avantages, puis le bouton'), text: t('homeWorkNote3Text', 'Trois avantages en icônes, puis « اطلب الآن » avant que le client ne décroche.') },
    details: { title: t('homeWorkNote4Title', 'Chaque détail expliqué'), text: t('homeWorkNote4Text', 'Les questions du client réglées une par une : batterie, fixation, accessoires.') },
  };

  const choose = (id: PartId) => {
    const next = active === id ? null : id;
    setActive(next);
    // on a phone the page is below the notes: bring the chosen part into view
    const part = PARTS.find((p) => p.id === next);
    const box = specimen.current?.getBoundingClientRect();
    if (!part || !box) return;
    const partTop = box.top + box.height * part.top;
    if (partTop < 120 || partTop > window.innerHeight - 120) {
      window.scrollBy({ top: partTop - 140, behavior: reducedMotion() ? 'auto' : 'smooth' });
    }
  };

  const chosen = PARTS.find((p) => p.id === active);
  // two panels dim what is outside the chosen part; they scale, so only transform moves
  const dimAbove: CSSProperties = { transform: `scaleY(${chosen ? chosen.top : 0})` };
  const dimBelow: CSSProperties = { transform: `scaleY(${chosen ? 1 - chosen.bottom : 0})` };

  return (
    <section id="work" tabIndex={-1} aria-labelledby="home-work" className="scroll-mt-20 outline-none">
      <div className="mx-auto max-w-[1440px] px-5 py-28 sm:px-8 lg:py-44">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6 lg:col-start-7 lg:row-start-1">
            <div className="lg:sticky lg:top-28">
              <h2 id="home-work" className={`${titleClass} max-w-2xl`} {...reveal()}>{t('homeWorkTitle', 'Des pages qui vendent déjà.')}</h2>
              <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-fg" {...reveal(80)}>
                {t('homeWorkText', 'Une vraie landing page longue, faite pour une boutique algérienne. Touche une partie pour voir le travail qu’elle fait.')}
              </p>
              <ul className="mt-10 space-y-2" {...reveal(140)}>
                {PARTS.map((p) => {
                  const selected = active === p.id;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => choose(p.id)}
                        aria-pressed={selected}
                        aria-controls="work-specimen"
                        className={cn(
                          'w-full rounded-[var(--radius-md)] px-5 py-4 text-start transition-colors duration-200 active:scale-[0.99]',
                          selected ? 'bg-surface-2' : 'hover:bg-surface',
                        )}
                      >
                        <span className={cn('block text-[20px] font-medium tracking-tight transition-colors', selected ? 'text-primary-ink' : 'text-fg')}>{notes[p.id].title}</span>
                        <span className="mt-1 block max-w-lg text-[16px] leading-relaxed text-fg-muted">{notes[p.id].text}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-5 lg:row-start-1" {...reveal(60)}>
            <div ref={specimen} id="work-specimen" className="relative mx-auto max-w-[420px] overflow-hidden rounded-[var(--radius-lg)] bg-surface lg:mx-0 lg:max-w-[480px]">
              <img
                src="/showcase/douche-plage.webp"
                alt={t('homeWorkAlt', 'Landing page longue en arabe pour une douche portable de plage, avec son titre, la photo du produit en situation, ses avantages et le bouton de commande')}
                width={720}
                height={2124}
                loading="lazy"
                decoding="async"
                className="block h-auto w-full"
              />
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-full origin-top bg-black/65 transition-transform duration-500 ease-[var(--ease-out)]" style={dimAbove} />
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-full origin-bottom bg-black/65 transition-transform duration-500 ease-[var(--ease-out)]" style={dimBelow} />
            </div>
          </div>
        </div>

        <div className="mt-28 grid items-center gap-10 rounded-[var(--radius-lg)] bg-surface p-6 sm:p-10 lg:mt-40 lg:grid-cols-12 lg:gap-12">
          <img
            src="/showcase/autres-pages.webp"
            alt={t('homeWorkMoreAlt', 'Six autres landing pages longues en arabe : console de jeu, douche, plage, voyage en voiture, douleurs du genou et avis clients')}
            width={800}
            height={426}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full rounded-[var(--radius-md)] lg:col-span-7"
            {...reveal()}
          />
          <div className="lg:col-span-5" {...reveal(90)}>
            <h3 className="home-display text-[clamp(2rem,1.4rem+1.8vw,3.25rem)] text-fg">{t('homeWorkMoreTitle', 'Six autres pages, six niches.')}</h3>
            <p className="mt-5 text-[18px] leading-relaxed text-fg">
              {t('homeWorkMoreText', 'Consoles de jeu, soins, plage, voyage en voiture, santé, avis clients : le même format s’adapte à chaque produit.')}
            </p>
            <Link to="/register" className="pill-cta mt-8">
              {t('homeWorkCta', 'Créer ma landing page')}
              <span className="pill-cta-dot"><ArrowUpRight size={18} className="rtl:-scale-x-100" /></span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
