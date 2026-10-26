import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useLanguage, type Language } from '../context/LanguageContext';
import { cn } from '../lib/utils';

// Plain language codes instead of flag emoji: Windows does not render flags, it shows letters.
export const LANGUAGES: { id: Language; code: string; nativeName: string }[] = [
  { id: 'fr', code: 'FR', nativeName: 'Français' },
  { id: 'ar', code: 'AR', nativeName: 'العربية' },
  { id: 'en', code: 'EN', nativeName: 'English' },
];

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.id === language) ?? LANGUAGES[0];

  const select = (id: Language) => {
    setLanguage(id);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      else if (e.key === 'ArrowDown') { e.preventDefault(); setFocused((i) => (i + 1) % LANGUAGES.length); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setFocused((i) => (i - 1 + LANGUAGES.length) % LANGUAGES.length); }
      else if (e.key === 'Enter') { e.preventDefault(); select(LANGUAGES[focused].id); }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, focused]);

  return (
    <div className={cn('relative shrink-0', className)} ref={rootRef}>
      <button
        type="button"
        onClick={() => {
          setFocused(LANGUAGES.findIndex((l) => l.id === language));
          setOpen((o) => !o);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t('selectLanguage', 'Choisir la langue')} : ${current.code}`}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-xs font-semibold text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg',
          open && 'bg-surface-2 text-fg',
        )}
      >
        <Globe size={15} />
        <span>{current.code}</span>
        <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="listbox"
          className="ui-panel-raised absolute end-0 z-50 mt-2 w-44 rounded-xl p-1"
        >
          {LANGUAGES.map((lang, index) => {
            const selected = lang.id === language;
            return (
              <button
                key={lang.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => select(lang.id)}
                onMouseEnter={() => setFocused(index)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-start text-sm transition-colors',
                  index === focused ? 'bg-surface-2 text-fg' : 'text-fg-muted',
                  selected && 'font-semibold text-fg',
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-6 text-xs font-semibold text-fg-faint">{lang.code}</span>
                  {lang.nativeName}
                </span>
                {selected && <Check size={15} className="text-primary-ink" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
