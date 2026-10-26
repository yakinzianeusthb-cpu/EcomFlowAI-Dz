import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

export type ToastType = 'success' | 'info' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastApi {
  success: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
}

// The context only exposes the (stable) helpers, so components that call useToast()
// never re-render when a toast appears or disappears.
const ToastContext = createContext<ToastApi | undefined>(undefined);

const DEFAULT_DURATION_MS = 3500;
const EXIT_ANIMATION_MS = 150;
const MAX_VISIBLE = 3;

const TOAST_STYLES: Record<ToastType, { icon: typeof Info; iconWrap: string; bar: string }> = {
  success: { icon: CheckCircle2, iconWrap: 'bg-success/15 text-success-ink', bar: 'bg-success' },
  info: { icon: Info, iconWrap: 'bg-primary/15 text-primary-ink', bar: 'bg-primary' },
  error: { icon: AlertCircle, iconWrap: 'bg-danger/15 text-danger-ink', bar: 'bg-danger' },
};

// Pure CSS animation (see index.css): keeps the animation library out of the first-load bundle.
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const style = TOAST_STYLES[toast.type];
  const Icon = style.icon;
  const [paused, setPaused] = useState(false);
  const [closing, setClosing] = useState(false);
  const remainingRef = useRef(toast.duration);
  const startedAtRef = useRef(Date.now());

  const dismiss = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => onRemove(toast.id), EXIT_ANIMATION_MS);
  }, [onRemove, toast.id]);

  // Auto-dismiss; pausing on hover keeps the time that is left.
  useEffect(() => {
    if (paused || closing) {
      remainingRef.current -= Date.now() - startedAtRef.current;
      return;
    }
    startedAtRef.current = Date.now();
    const timer = window.setTimeout(dismiss, Math.max(remainingRef.current, 0));
    return () => window.clearTimeout(timer);
  }, [paused, closing, dismiss]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role={toast.type === 'error' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto relative overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-lg)] transition-[opacity,transform] duration-150',
        closing ? '-translate-y-1 opacity-0' : 'animate-[toast-in_200ms_ease-out]',
      )}
    >
      <div className="flex items-start gap-3 p-3.5 pe-2.5">
        <span className={cn('mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg', style.iconWrap)}>
          <Icon size={15} />
        </span>
        <p className="min-w-0 flex-1 pt-1 text-[13px] font-medium leading-snug text-fg">{toast.message}</p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fermer"
          className="grid size-7 shrink-0 place-items-center rounded-lg text-fg-faint transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <X size={14} />
        </button>
      </div>
      <div
        className={cn('absolute inset-x-0 bottom-0 h-0.5 origin-left opacity-70', style.bar)}
        style={{ animation: `toast-progress ${toast.duration}ms linear forwards`, animationPlayState: paused ? 'paused' : 'running' }}
      />
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType, duration = DEFAULT_DURATION_MS) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { id, message, type, duration }]);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, duration) => addToast(message, 'success', duration),
      info: (message, duration) => addToast(message, 'info', duration),
      error: (message, duration) => addToast(message, 'error', duration),
    }),
    [addToast],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 top-4 z-[9999] flex flex-col gap-2 sm:inset-x-auto sm:end-4 sm:w-[380px]"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
