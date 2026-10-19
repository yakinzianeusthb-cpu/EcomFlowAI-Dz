/** Small building blocks shared by the campaign, ads, brand and library screens. */
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { AlertTriangle, Check, CircleDashed, ImagePlus, Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-[var(--radius-sm)] bg-fg/[0.07]', className)} aria-hidden="true" />;
}

export function EmptyState({ icon: Icon, title, body, action, className }: { icon: LucideIcon; title: string; body?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-line-strong px-6 py-14 text-center', className)}>
      <span className="grid size-12 place-items-center rounded-[var(--radius-md)] bg-primary/10 text-primary-ink">
        <Icon size={22} />
      </span>
      <h2 className="mt-4 text-base font-semibold text-fg">{title}</h2>
      {body && <div className="mt-1.5 max-w-md text-sm leading-relaxed text-fg-muted">{body}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export type StatusState = 'ready' | 'none' | 'running' | 'failed';

const STATUS_STYLE: Record<StatusState, { icon: LucideIcon; className: string }> = {
  ready: { icon: Check, className: 'bg-success/12 text-success-ink border-success/25' },
  none: { icon: CircleDashed, className: 'bg-fg/[0.04] text-fg-faint border-line' },
  running: { icon: Loader2, className: 'bg-primary/10 text-primary-ink border-primary/25' },
  failed: { icon: AlertTriangle, className: 'bg-danger/10 text-danger-ink border-danger/25' },
};

export function StatusChip({ state, label, className }: { state: StatusState; label: string; className?: string }) {
  const { icon: Icon, className: tone } = STATUS_STYLE[state];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-[var(--radius-xs)] border px-1.5 py-0.5 text-xs font-medium', tone, className)}>
      <Icon size={12} className={cn('shrink-0', state === 'running' && 'animate-spin')} aria-hidden="true" />
      {label}
    </span>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = Math.max(0, options.findIndex((o) => o.value === value));
  // a radio group: one tab stop, arrow keys move the choice (mirrored in right-to-left pages)
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const rtl = document.documentElement.dir === 'rtl';
    const forward = e.key === 'ArrowDown' || e.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
    const backward = e.key === 'ArrowUp' || e.key === (rtl ? 'ArrowRight' : 'ArrowLeft');
    if (!forward && !backward) return;
    e.preventDefault();
    const next = (index + (forward ? 1 : -1) + options.length) % options.length;
    onChange(options[next].value);
    buttons.current[next]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex flex-wrap gap-1 rounded-[var(--radius-sm)] border border-line bg-surface-2 p-1', className)}>
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => { buttons.current[i] = el; }}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          tabIndex={i === selected ? 0 : -1}
          onKeyDown={(e) => onKey(e, i)}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-[var(--radius-xs)] px-3 py-1.5 text-[13px] font-medium transition-colors',
            value === o.value ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Toggle chips for a multi-choice field (platforms, styles). */
export function ChipToggles<T extends string>({ options, values, onChange, label }: { options: { value: T; label: string }[]; values: T[]; onChange: (values: T[]) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = values.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? values.filter((v) => v !== o.value) : [...values, o.value])}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-3 py-1.5 text-[13px] font-medium transition-colors',
              on ? 'border-primary/50 bg-primary/12 text-primary-ink' : 'border-line bg-surface-2 text-fg-muted hover:text-fg',
            )}
          >
            {on && <Check size={13} aria-hidden="true" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-fg">
        {label}
      </label>
      {children(id)}
      {hint && <p className="mt-1.5 text-xs text-fg-faint">{hint}</p>}
    </div>
  );
}

/** A delete (or other destructive) button that asks once, inline, instead of a browser pop-up. */
export function ConfirmButton({ label, confirmLabel, cancelLabel, onConfirm, icon: Icon, className, disabled, ariaLabel }: {
  label: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  icon?: LucideIcon;
  className?: string;
  disabled?: boolean;
  /** required when `label` is empty (icon-only button) */
  ariaLabel?: string;
}) {
  const [asking, setAsking] = useState(false);
  if (asking) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <button type="button" onClick={() => { setAsking(false); onConfirm(); }} className="btn-dz-danger">{confirmLabel}</button>
        <button type="button" onClick={() => setAsking(false)} className="rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs font-medium text-fg-muted hover:text-fg">{cancelLabel}</button>
      </span>
    );
  }
  return (
    <button type="button" disabled={disabled} aria-label={ariaLabel} onClick={() => setAsking(true)} className={cn('inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[13px] font-medium text-fg-muted transition-colors hover:bg-danger/10 hover:text-danger-ink disabled:opacity-50', className)}>
      {Icon && <Icon size={14} aria-hidden="true" />}
      {label}
    </button>
  );
}

/** A drop zone that accepts images by click or drag and drop. */
export function ImageDrop({ onFiles, label, hint, multiple = true, disabled, compact, className }: {
  onFiles: (files: File[]) => void;
  label: string;
  hint?: string;
  multiple?: boolean;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const take = (list: FileList | null) => {
    const files = Array.from(list ?? []).filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type));
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => input.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled) take(e.dataTransfer.files); }}
      className={cn(
        'flex w-full flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed text-center transition-colors disabled:opacity-50',
        compact ? 'aspect-square p-3' : 'px-6 py-8',
        over ? 'border-primary bg-primary/[0.06]' : 'border-line-strong bg-surface-2 hover:border-primary/60 hover:bg-primary/[0.04]',
        className,
      )}
    >
      <ImagePlus size={compact ? 20 : 24} className="text-primary-ink" aria-hidden="true" />
      <span className={cn('font-medium text-fg', compact ? 'mt-1.5 text-xs' : 'mt-2.5 text-sm')}>{label}</span>
      {hint && !compact && <span className="mt-1 text-xs text-fg-faint">{hint}</span>}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} hidden onChange={(e) => { take(e.target.files); e.target.value = ''; }} />
    </button>
  );
}
