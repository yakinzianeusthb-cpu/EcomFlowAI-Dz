import { useEffect, type CSSProperties } from 'react';

/** Props for a part of a section that rises into view; `delay` staggers the parts of one section. */
export const reveal = (delay = 0) => ({ 'data-reveal': '', style: { '--reveal-delay': `${delay}ms` } as CSSProperties });

/**
 * Section entrances: each element marked data-reveal that starts below the screen rises a little and fades in,
 * once, as it scrolls into view. Elements already on screen, elements added later and pages without JavaScript are
 * never hidden; reduced motion shows everything at once (CSS). The observer reads no layout itself.
 */
export function useReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver !== 'function') return;
    const items = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (!seen.has(el)) {
            seen.add(el);
            // the first report says where it starts: below the screen it waits hidden, on screen it stays as is
            if (entry.isIntersecting) io.unobserve(el);
            else el.setAttribute('data-reveal-pending', '');
            continue;
          }
          if (entry.isIntersecting) {
            el.removeAttribute('data-reveal-pending');
            io.unobserve(el);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    items.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      items.forEach((el) => el.removeAttribute('data-reveal-pending'));
    };
  }, []);
}
