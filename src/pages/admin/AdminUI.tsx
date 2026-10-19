import { useEffect, useId, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../context/LanguageContext';
import '../../i18n/admin';

/** Section card used by every admin tab. */
export function AdminCard({ title, icon: Icon, action, children, className }: {
  title?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('surface-card p-5 sm:p-6', className)}>
      {(title || action) && (
        <div className="flex items-center gap-2 mb-5">
          {Icon && <Icon size={18} className="text-dz-emerald" />}
          {title && <h2 className="font-display font-semibold text-lg text-fg">{title}</h2>}
          {action && <div className="ms-auto flex items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/** Small label + value stat used in the overview. */
export function StatCard({ label, value, icon: Icon, color = 'text-dz-emerald' }: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: string;
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-fg/[0.04] border border-fg/[0.08] flex items-center justify-center">
          <Icon size={18} className={color} />
        </div>
        <div>
          <p className="text-xs text-fg-faint">{label}</p>
          <p className="font-display text-2xl font-bold text-fg">{value}</p>
        </div>
      </div>
    </div>
  );
}

/** Pill toggle. `label` names the switch for screen readers when no visible text sits next to it. */
export function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed',
        checked ? 'bg-primary' : 'bg-fg/10 border border-fg/10'
      )}
      role="switch"
      aria-checked={checked}
      aria-label={label}
    >
      <span className={cn(
        'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all',
        checked ? 'start-[22px]' : 'start-0.5'
      )} />
    </button>
  );
}

/** A switch with its text. The text is a <label>, so clicking it flips the switch once (never twice). */
export function ToggleField({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-[13px] text-fg-muted cursor-pointer select-none">
      <Toggle checked={checked} onChange={onChange} disabled={disabled} label={label} />
      {label}
    </label>
  );
}

/** Modal wrapper with the app's dark aesthetic. Closes on Escape and names itself for screen readers. */
export function Modal({ open, onClose, title, children, wide }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const { t } = useLanguage();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // Move focus into the dialog when it opens, so keyboard and screen-reader users land inside it.
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-10 sm:pt-16 bg-black/80 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ scale: 0.96, y: 14 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 14 }}
            className={cn('w-full surface-card rounded-2xl p-6 relative mb-10 outline-none', wide ? 'max-w-3xl' : 'max-w-lg')}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 id={titleId} className="font-display font-semibold text-lg text-fg">{title}</h3>
              <button onClick={onClose} aria-label={t('admModalClose', 'Fermer la fenêtre')} className="p-2 rounded-xl text-fg-muted hover:text-fg hover:bg-fg/10 transition-colors">
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Label + input helper. */
export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-xs text-fg-muted">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="text-xs text-fg-faint mt-1 block">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'w-full bg-fg/[0.02] border border-fg/10 rounded-xl px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-dz-emerald/70 focus:ring-4 focus:ring-dz-emerald/10 transition-all';

export function EmptyState({ icon: Icon, title, hint }: { icon: LucideIcon; title: string; hint?: string }) {
  return (
    <div className="py-12 text-center">
      <Icon size={24} className="mx-auto text-fg-faint mb-3" />
      <p className="text-sm text-fg-muted">{title}</p>
      {hint && <p className="text-[12px] text-fg-faint mt-1">{hint}</p>}
    </div>
  );
}

export function LoadingBlock({ label }: { label?: string }) {
  const { t } = useLanguage();
  return (
    <div className="py-14 text-center" role="status">
      <Loader2 size={24} className="mx-auto text-fg-faint animate-spin mb-3" />
      <p className="text-[12px] text-fg-faint">{label ?? t('admLoading', 'Chargement…')}</p>
    </div>
  );
}

/** Badge colors for plan status. */
export function StatusBadge({ status }: { status: string | null }) {
  const { t } = useLanguage();
  const map: Record<string, string> = {
    active: 'bg-dz-emerald/15 text-dz-emerald border-dz-emerald/30',
    pending: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
    expired: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };
  const label = status === 'active'
    ? t('admStatusActive', 'Actif')
    : status === 'pending'
      ? t('admStatusPending', 'En attente')
      : status === 'expired'
        ? t('sidebarSubExpired', 'Expiré')
        : t('admStatusNone', 'Aucun');
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full border', map[status || ''] || 'bg-fg/[0.05] text-fg-muted border-fg/10')}>
      {label}
    </span>
  );
}
