import { useEffect, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Check } from 'lucide-react';
import type { PlanId } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import HomeHeader from './home/HomeHeader';
import HomeHero from './home/HomeHero';
import HomePricing from './home/HomePricing';
import { LandingVisual, LibraryVisual, VideoVisual } from './home/StudioVisuals';
import { reveal, useReveal } from './home/useReveal';
import '../i18n/home';

/** The home page is always dark: paint the area outside it too (overscroll), whatever the app's theme. */
function useDarkCanvas() {
  useEffect(() => {
    const body = document.body.style;
    const previous = body.backgroundColor;
    body.backgroundColor = '#0b0b0c';
    return () => { body.backgroundColor = previous; };
  }, []);
}

/** Section headings: one size for the whole page, a little smaller on a phone so they keep to two lines. */
const SECTION_TITLE = 'home-display text-[clamp(2.25rem,1.5rem+2.6vw,4.25rem)] text-fg';

function PointList({ points }: { points: string[] }) {
  return (
    <ul className="mt-7 space-y-3">
      {points.map((p) => (
        <li key={p} className="flex items-start gap-2.5 text-[16px] leading-relaxed text-fg">
          <Check size={16} className="mt-1.5 shrink-0 text-primary-ink" />
          {p}
        </li>
      ))}
    </ul>
  );
}

interface Studio { id: string; name: string; promise: string; text: string; points: string[]; visual: ReactNode }

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  useDocumentMeta({ title: t('metaTitleHome', "EcomFlow AI — Marketing e-commerce propulsé par l'IA"), description: t('metaDescHome') });
  useDarkCanvas();
  useReveal();

  const choosePlan = (plan: PlanId) => {
    // remembered across sign-up: the app opens the checkout for this plan after the first login
    try { sessionStorage.setItem('dz_plan_intent', plan); } catch { /* storage unavailable: the visitor picks the plan again later */ }
    navigate('/register');
  };

  const steps = [
    { title: t('homeStep1Title', 'Le produit'), text: t('homeStep1Text', 'Ajoute les photos de ton produit et quelques infos : son nom, son prix, ses avantages et ton public.') },
    { title: t('homeStep2Title', 'La génération'), text: t('homeStep2Text', 'L’IA écrit ta landing page section par section, et le script de ta pub vidéo scène par scène.') },
    { title: t('homeStep3Title', 'Les images'), text: t('homeStep3Text', 'Pour chaque section, crée l’image ici en voyant son coût, ou copie le prompt pour la faire avec un autre outil.') },
    {
      title: t('homeStep4Title', 'L’export'),
      text: t('homeStep4Text', 'Télécharge la page HTML prête à publier et ta vidéo, puis mets-les en ligne où tu veux.'),
    },
  ];
  const studios: Studio[] = [
    {
      id: 'landing',
      name: t('menuLanding', 'Landing pages'),
      promise: t('homeLandingTitle', 'Une page de vente prête pour le paiement à la livraison'),
      text: t('homeLandingText', 'Des textes écrits pour ton produit et ton public, et un formulaire de commande avec les 58 wilayas. Les commandes arrivent sur ton WhatsApp ou sur ton propre webhook.'),
      points: [
        t('homeLandingPoint1', 'Arabe et darija, français ou anglais'),
        t('homeLandingPoint2', 'Sections à réécrire, réordonner ou retirer'),
        t('homeLandingPoint3', 'Une page HTML autonome, à héberger où tu veux'),
      ],
      visual: <LandingVisual />,
    },
    {
      id: 'video',
      name: t('menuVideo', 'Pubs vidéo'),
      promise: t('homeVideoTitle', 'Un script scène par scène, puis la vidéo'),
      text: t('homeVideoText', 'L’IA écrit l’accroche, les scènes et le texte à l’écran. La vidéo est ensuite montée dans ton navigateur à partir de tes photos.'),
      points: [
        t('homeVideoPoint1', 'Formats 9:16, 4:5, 1:1 et 16:9'),
        t('homeVideoPoint2', 'Export MP4 (ou WebM selon le navigateur), sans bande son'),
        t('homeVideoPoint3', "Vidéo filmée par l'IA (Google Gemini) en option, avec la facturation Google"),
      ],
      visual: <VideoVisual />,
    },
  ];
  const faqs = [
    { q: t('homeFaq1Q', 'Faut-il savoir designer ou écrire des pubs ?'), a: t('homeFaq1A', 'Non. Tu fournis les photos et quelques informations, puis tu relis et ajustes ce que l’IA propose.') },
    { q: t('homeFaq2Q', 'Quelle clé IA faut-il ?'), a: t('homeFaq2A', 'Une clé Gemini, créée gratuitement sur Google AI Studio. Elle est enregistrée chiffrée dans ton compte et n’est jamais réaffichée en entier.') },
    {
      q: t('homeFaq3Q', 'Mes publicités partent-elles toutes seules ?'),
      a: t('homeFaq3A', 'Non. Tu télécharges tes contenus et tu les publies toi-même, quand tu veux.'),
    },
    { q: t('homeFaq4Q', 'Comment se passe le paiement ?'), a: t('homeFaq4A', 'Tu choisis un plan, tu paies avec l’un des moyens indiqués, puis tu envoies le justificatif depuis l’app. Un admin le vérifie et active ton accès.') },
    { q: t('homeFaq5Q', 'Dans quelles langues ?'), a: t('homeFaq5A', 'L’interface et les contenus générés existent en arabe, en français et en anglais. Chaque page et chaque script choisit sa propre langue.') },
    { q: t('homeFaq6Q', 'Mes données sont-elles séparées de celles des autres ?'), a: t('homeFaq6A', 'Oui. Chaque page, fichier et réglage appartient à ton compte, et le serveur vérifie le propriétaire à chaque requête.') },
  ];

  return (
    <div className="theme-dark home-site min-h-dvh overflow-x-clip bg-bg text-fg [color-scheme:dark]">
      <HomeHeader />

      <main>
        <HomeHero />

        <section id="workflow" tabIndex={-1} aria-labelledby="home-flow" className="scroll-mt-20 outline-none">
          <div className="mx-auto grid max-w-[1440px] gap-14 px-5 py-28 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:py-44">
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-32">
                <h2 id="home-flow" className={`${SECTION_TITLE} max-w-3xl`} {...reveal()}>
                  {t('homeFlowTitle', 'Du brief à la mise en ligne, au même endroit.')}
                </h2>
                <p className="mt-6 max-w-md text-[16px] leading-relaxed text-fg-muted" {...reveal(80)}>
                  {t('homeFlowIntro', 'Tes landing pages et tes scripts vidéo restent dans ton historique : tu peux régénérer, retoucher ou y revenir à tout moment.')}
                </p>
              </div>
            </div>
            <ol className="grid gap-x-12 gap-y-14 sm:grid-cols-2 lg:col-span-6 lg:col-start-7 lg:pt-3">
              {steps.map((s, i) => (
                <li key={s.title} {...reveal(120 + i * 70)}>
                  <h3 className="text-[22px] font-medium tracking-tight text-fg">{s.title}</h3>
                  <p className="mt-3 max-w-sm text-[16px] leading-relaxed text-fg-muted">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="studios" tabIndex={-1} aria-labelledby="home-studios" className="scroll-mt-20 bg-surface outline-none">
          <div className="mx-auto max-w-[1440px] px-5 py-28 sm:px-8 lg:py-44">
            <h2 id="home-studios" className={`${SECTION_TITLE} max-w-3xl`} {...reveal()}>{t('homeStudiosTitle', 'Deux studios pour vendre plus.')}</h2>
            <div className="mt-20 space-y-28 lg:mt-28 lg:space-y-40">
              {studios.map((s, i) => (
                <article key={s.id} aria-labelledby={`studio-${s.id}`} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
                  <div className={i % 2 === 1 ? 'lg:order-2' : undefined} {...reveal()}>
                    <h3 id={`studio-${s.id}`} className="home-display text-[clamp(2rem,1.4rem+1.8vw,3.25rem)] text-fg">{s.name}</h3>
                    <p className="mt-5 max-w-xl text-balance text-[20px] leading-snug text-fg">{s.promise}</p>
                    <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-fg-muted">{s.text}</p>
                    <PointList points={s.points} />
                  </div>
                  <div className="rounded-[var(--radius-lg)] bg-bg p-6 sm:p-10" {...reveal(90)}>{s.visual}</div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="home-library" className="mx-auto max-w-[1440px] px-5 py-28 sm:px-8 lg:py-36">
          <div className="grid gap-5 lg:grid-cols-12">
            <article className="rounded-[var(--radius-lg)] bg-surface p-7 sm:p-10 lg:col-span-12" {...reveal()}>
              <h3 id="home-library" className="text-[28px] font-light tracking-tight text-fg">{t('homeLibraryTitle', 'Tous tes fichiers au même endroit')}</h3>
              <p className="mt-3 text-[16px] leading-relaxed text-fg-muted">
                {t('homeLibraryText', 'Photos produit, logos et images créées par l’IA, rangés au même endroit et prêts à être réutilisés.')}
              </p>
              <div className="mt-9"><LibraryVisual /></div>
            </article>
          </div>
        </section>

        <HomePricing onChoose={choosePlan} titleClass={SECTION_TITLE} />

        <section id="faq" tabIndex={-1} aria-labelledby="home-faq" className="scroll-mt-20 outline-none">
          <div className="mx-auto grid max-w-[1440px] gap-14 px-5 py-28 sm:px-8 lg:grid-cols-12 lg:py-44">
            <h2 id="home-faq" className={`${SECTION_TITLE} lg:col-span-4`} {...reveal()}>{t('homeNavFaq', 'Questions fréquentes')}</h2>
            <dl className="grid gap-x-14 gap-y-12 sm:grid-cols-2 lg:col-span-8">
              {faqs.map((f, i) => (
                <div key={f.q} {...reveal(60 + (i % 2) * 70)}>
                  <dt className="text-[17px] font-medium text-fg">{f.q}</dt>
                  <dd className="mt-3 text-[16px] leading-relaxed text-fg-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="home-final" className="px-5 pb-28 sm:px-8">
          <div className="mx-auto max-w-[1440px] rounded-[var(--radius-lg)] bg-surface px-5 py-16 sm:px-14 sm:py-24" {...reveal()}>
            <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h2 id="home-final" className={SECTION_TITLE}>{t('homeFinalTitle', 'Ton prochain produit mérite une vraie campagne.')}</h2>
                <p className="mt-5 text-[16px] leading-relaxed text-fg-muted">
                  {t('homeFinalText', 'Crée ton compte, ajoute ta clé Gemini et lance ta première landing page à partir d’une photo.')}
                </p>
              </div>
              <Link to="/register" className="pill-cta shrink-0 self-start lg:self-auto">
                {t('homeCtaStart', 'Créer mon compte')}
                <span className="pill-cta-dot"><ArrowUpRight size={18} className="rtl:-scale-x-100" /></span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-5 pb-10 sm:px-8">
        <div className="mx-auto max-w-[1440px]">
          <p aria-hidden="true" dir="ltr" className="home-display select-none whitespace-nowrap text-[clamp(2.6rem,16.2vw,16.5rem)] leading-[0.85] text-fg/90" {...reveal()}>
            EcomFlow AI
          </p>
          <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <p className="text-[13px] text-fg-muted">{t('homeFooterTagline', 'Campagnes e-commerce assistées par l’IA, pensées pour l’Algérie.')}</p>
            <nav aria-label={t('legalFooterNav', 'Informations légales')} className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-fg-muted">
              <Link to="/terms" className="transition-colors hover:text-fg">{t('legalTermsTitle', "Conditions d'utilisation")}</Link>
              <Link to="/privacy" className="transition-colors hover:text-fg">{t('legalPrivacyTitle', 'Politique de confidentialité')}</Link>
              <Link to="/login" className="transition-colors hover:text-fg">{t('lpNavLogin', 'Se connecter')}</Link>
            </nav>
            <p className="text-[13px] text-fg-faint">© {new Date().getFullYear()} EcomFlow AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
