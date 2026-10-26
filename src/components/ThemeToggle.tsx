import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/theme';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../lib/utils';

export default function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggle } = useTheme();
  const { t } = useLanguage();
  const label = isDark ? t('lightMode', 'Clair') : t('darkMode', 'Sombre');

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg',
        className,
      )}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
