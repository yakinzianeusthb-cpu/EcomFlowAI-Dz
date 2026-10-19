import { useEffect, useRef } from 'react';

interface OtpInputProps {
  length?: number;
  value: string[];
  onChange: (digits: string[]) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: boolean;
}

export default function OtpInput({
  length = 6,
  value,
  onChange,
  autoFocus = true,
  disabled = false,
  error = false,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus the first empty box on mount.
  useEffect(() => {
    if (!autoFocus) return;
    const idx = value.findIndex((d) => !d);
    refs.current[idx === -1 ? length - 1 : idx]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (i: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    const next = [...value];
    if (!cleaned) {
      next[i] = '';
    } else if (cleaned.length === 1) {
      next[i] = cleaned;
      if (i < length - 1) refs.current[i + 1]?.focus();
    } else {
      // Paste support: distribute the digits across boxes starting at i.
      for (let j = 0; j < cleaned.length && i + j < length; j++) {
        next[i + j] = cleaned[j];
      }
      refs.current[Math.min(length - 1, i + cleaned.length - 1)]?.focus();
    }
    onChange(next);
  };

  const handlePaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;
    handleChange(i, pasted);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...value];
      if (next[i]) {
        next[i] = '';
      } else if (i > 0) {
        next[i - 1] = '';
        refs.current[i - 1]?.focus();
      }
      onChange(next);
    } else if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault();
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      e.preventDefault();
      refs.current[i + 1]?.focus();
    }
  };

  return (
    <div className="flex justify-between gap-2" dir="ltr">
      {Array.from({ length }, (_, i) => {
        const d = value[i] ?? '';
        const border = error
          ? 'border-rose-500/60'
          : d
            ? 'border-dz-emerald/60'
            : 'border-fg/10';
        return (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={d}
            disabled={disabled}
            aria-label={`Digit ${i + 1}`}
            onChange={(e) => handleChange(i, e.target.value)}
            onPaste={(e) => handlePaste(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            className={`w-full aspect-square rounded-xl border text-center font-display text-2xl font-bold text-fg bg-fg/[0.03] transition-all duration-200 outline-none focus:border-dz-emerald/70 focus:ring-4 focus:ring-dz-emerald/10 disabled:opacity-50 disabled:cursor-not-allowed ${border}`}
          />
        );
      })}
    </div>
  );
}
