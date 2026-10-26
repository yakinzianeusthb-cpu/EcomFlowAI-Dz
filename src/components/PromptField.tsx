import React, { useId, useState } from 'react';
import { RotateCcw, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../lib/utils';

interface PromptFieldProps {
  id?: string;
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  isTextArea?: boolean;
  rows?: number;
  dir?: 'ltr' | 'rtl';
  helpText?: string;
  badgeText?: string;
  className?: string;
  allowClear?: boolean;
  allowHide?: boolean;
  defaultHidden?: boolean;
  clearTooltip?: string;
  hideTooltip?: string;
  showTooltip?: string;
}

const ICON_BUTTON = 'grid size-7 place-items-center rounded-md transition-colors';

export default function PromptField({
  id,
  label,
  icon,
  value,
  onChange,
  placeholder,
  isTextArea = false,
  rows = 3,
  dir = 'ltr',
  helpText,
  badgeText,
  className,
  allowClear = true,
  allowHide = true,
  defaultHidden = false,
  clearTooltip,
  hideTooltip,
  showTooltip,
}: PromptFieldProps) {
  const { t } = useLanguage();
  const [isHidden, setIsHidden] = useState(defaultHidden);
  const generatedId = useId();
  const inputId = `${id ?? generatedId}-input`;

  const clearLabel = clearTooltip ?? t('pfClear', 'Effacer le champ');
  const toggleLabel = isHidden ? (showTooltip ?? t('pfShow', 'Afficher le champ')) : (hideTooltip ?? t('pfHide', 'Masquer le champ'));

  const fieldClass = cn('input-dz w-full', dir === 'rtl' && 'font-arabic text-end');

  return (
    <div className={cn('space-y-2', className)} id={id}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          {icon && <span className="shrink-0 text-primary-ink">{icon}</span>}
          <label htmlFor={inputId} className="text-xs font-semibold leading-snug text-fg-muted">
            {label}
          </label>
          {badgeText && (
            <span className="shrink-0 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold text-primary-ink">{badgeText}</span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {allowClear && (
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={!value}
              title={clearLabel}
              aria-label={clearLabel}
              className={cn(ICON_BUTTON, value ? 'text-fg-muted hover:bg-danger/10 hover:text-danger-ink' : 'cursor-not-allowed text-fg-faint/50')}
            >
              <RotateCcw size={14} />
            </button>
          )}
          {allowHide && (
            <button
              type="button"
              onClick={() => setIsHidden((h) => !h)}
              title={toggleLabel}
              aria-label={toggleLabel}
              aria-pressed={isHidden}
              className={cn(ICON_BUTTON, isHidden ? 'bg-warning/15 text-warning-ink' : 'text-fg-muted hover:bg-surface-2 hover:text-fg')}
            >
              {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
        </div>
      </div>

      {isHidden ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-line bg-surface-2 px-3 py-2.5 text-xs text-fg-muted">
          <span className="flex min-w-0 items-center gap-2 italic">
            <EyeOff size={13} className="shrink-0 text-warning-ink" />
            <span className="truncate">
              {t('pfHiddenNow', 'Champ masqué')} ({value ? `${value.slice(0, 25)}…` : t('pfEmpty', 'vide')})
            </span>
          </span>
          <button type="button" onClick={() => setIsHidden(false)} className="shrink-0 font-semibold text-primary-ink hover:underline">
            {t('pfShowShort', 'Afficher')}
          </button>
        </div>
      ) : (
        <div>
          {isTextArea ? (
            <textarea id={inputId} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} dir={dir} className={cn(fieldClass, 'resize-none')} />
          ) : (
            <input id={inputId} type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} dir={dir} className={fieldClass} />
          )}
          {helpText && <p className="mt-1 ps-1 text-xs italic text-fg-muted">{helpText}</p>}
        </div>
      )}
    </div>
  );
}
