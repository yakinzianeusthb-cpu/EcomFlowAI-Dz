import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../lib/utils';
import { BrandLogo } from '../BrandMark';
import { LANGUAGES } from '../LanguageSwitcher';
import '../../i18n/home';

interface NavLink { href: string; label: string }

/** The full-screen menu: the page's sections in large type, then the two account actions. */
function HomeMenu({ links, onClose }: { links: NavLink[]; onClose: (restoreFocus: boolean) => void }) {
  const { t } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = () => [...panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
    focusables()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose(true);
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      root.style.overflow = overflow;
    };
  }, [onClose]);

  // close first (the page can scroll again), then go to the section and move the focus there
  const goTo = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    onClose(false);
    requestAnimationFrame(() => {
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      target.focus({ preventScroll: true });
      window.history.replaceState(null, '', href);
    });
  };

  return (
    <div id="home-menu" ref={panelRef} role="dialog" aria-modal="true" aria-label={t('homeMenu', 'Menu')} className="menu-in fixed inset-0 z-50 flex flex-col bg-bg">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center px-5 sm:h-20 sm:px-8">
        <BrandLogo tone="mono" />
        <button
          type="button"
          onClick={() => onClose(true)}
          aria-label={t('homeMenuClose', 'Fermer le menu')}
          className="ms-auto grid size-11 place-items-center rounded-full text-fg ring-1 ring-fg/40 transition-[background-color,transform] duration-200 hover:bg-fg/10 active:scale-95"
        >
          <X size={18} />
        </button>
      </div>
      <nav aria-label={t('homeNavLabel', 'Sections')} className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center px-5 sm:px-8">
        <ul>
          {links.map((link, i) => (
            <li key={link.href} className="hero-rise" style={{ '--rise-delay': `${40 + i * 50}ms` } as CSSProperties}>
              <a
                href={link.href}
                onClick={(event) => goTo(event, link.href)}
                className="home-display inline-block py-1.5 text-[clamp(2.4rem,1.6rem+3.2vw,4.75rem)] text-fg transition-colors duration-200 hover:text-fg-muted"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-4 px-5 pb-10 sm:px-8">
        <Link to="/register" className="pill-cta">
          {t('homeCtaStart', 'Créer mon compte')}
          <span className="pill-cta-dot"><ArrowUpRight size={18} className="rtl:-scale-x-100" /></span>
        </Link>
        <Link to="/login" className="text-[15px] font-medium text-fg-muted underline-offset-4 transition-colors hover:text-fg hover:underline">
          {t('lpNavLogin', 'Se connecter')}
        </Link>
      </div>
    </div>
  );
}

/** The home page's bar: the wordmark, the three languages, sign-in and the menu. Clear over the hero, solid below it. */
export default function HomeHeader() {
  const { t, language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // solid once the top 24px of the page have scrolled away; watched without reading layout on every scroll
  useEffect(() => {
    const top = topRef.current;
    if (!top) return;
    const io = new IntersectionObserver(([entry]) => setSolid(!entry.isIntersecting));
    io.observe(top);
    return () => io.disconnect();
  }, []);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);

  const links: NavLink[] = [
    { href: '#workflow', label: t('homeNavHow', 'Comment ça marche') },
    { href: '#studios', label: t('homeNavStudios', 'Studios') },
    { href: '#pricing', label: t('homeNavPricing', 'Tarifs') },
    { href: '#faq', label: t('homeNavFaq', 'Questions fréquentes') },
  ];

  return (
    <>
    <div ref={topRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-6" />
    <header className={cn('fixed inset-x-0 top-0 z-40 transition-colors duration-300', solid ? 'bg-bg' : 'bg-transparent')}>
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-5 sm:h-20 sm:px-8">
        <Link to="/" aria-label="EcomFlow AI" className="shrink-0 rounded-[var(--radius-sm)]">
          <BrandLogo tone="mono" />
        </Link>
        <div className="ms-auto flex items-center gap-1 sm:gap-3">
          <div role="group" aria-label={t('selectLanguage', 'Choisir la langue')} className="flex items-center">
            {LANGUAGES.map((l) => (
              <button key={l.id} type="button" aria-pressed={language === l.id} onClick={() => setLanguage(l.id)} className="pill-option">
                <span aria-hidden="true">{l.code}</span>
                <span className="sr-only" lang={l.id}>{l.nativeName}</span>
              </button>
            ))}
          </div>
          <Link
            to="/login"
            className="hidden h-10 items-center rounded-full px-3 text-[13px] font-medium text-fg-muted transition-colors duration-200 hover:text-fg sm:inline-flex"
          >
            {t('lpNavLogin', 'Se connecter')}
          </Link>
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="home-menu"
            className="group inline-flex h-11 items-center gap-2.5 rounded-full ps-1 pe-1 text-[13px] font-medium text-fg transition-transform duration-150 active:scale-95 sm:pe-3.5"
          >
            <span aria-hidden="true" className="grid size-9 place-items-center rounded-full ring-1 ring-fg/45 transition-colors duration-200 group-hover:bg-fg/10">
              <span className="flex w-3.5 flex-col gap-[4px]">
                <span className="h-[1.5px] rounded-full bg-fg" />
                <span className="h-[1.5px] rounded-full bg-fg" />
              </span>
            </span>
            <span className="max-sm:sr-only">{t('homeMenu', 'Menu')}</span>
          </button>
        </div>
      </div>
      {open && <HomeMenu links={links} onClose={close} />}
    </header>
    </>
  );
}
