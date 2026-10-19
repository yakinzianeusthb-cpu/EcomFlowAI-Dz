import { useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

const SEGMENTS = [0, 1, 2, 3];

function getSegmentColor(score: number): string {
  if (score <= 1) return 'bg-rose-500';
  if (score === 2) return 'bg-amber-500';
  if (score === 3) return 'bg-lime-500';
  return 'bg-primary';
}

export default function PasswordStrengthMeter({ password, className = '' }: PasswordStrengthMeterProps) {
  const { t } = useLanguage();

  const score = useMemo(() => {
    let s = 0;
    if (password.length >= 8) s += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s += 1;
    if (/\d/.test(password)) s += 1;
    if (/[^a-zA-Z0-9]/.test(password) || password.length >= 12) s += 1;
    return s;
  }, [password]);

  const segmentColor = getSegmentColor(score);

  let label: React.ReactNode = null;
  if (score === 1) {
    label = (
      <p className="mt-1.5 flex flex-col gap-0.5 text-xs">
        <span className="text-rose-400">{t('pwWeak', 'Faible')}</span>
        <span className="text-fg-faint">{t('pwHint', 'Mélange majuscules, minuscules, chiffres et symboles.')}</span>
      </p>
    );
  } else if (score === 2) {
    label = (
      <p className="mt-1.5 text-xs text-amber-400">
        {t('pwMedium', 'Moyen')}
      </p>
    );
  } else if (score === 3) {
    label = (
      <p className="mt-1.5 text-xs text-lime-400">
        {t('pwStrong', 'Fort')}
      </p>
    );
  } else if (score === 4) {
    label = (
      <p className="mt-1.5 text-xs text-dz-emerald">
        {t('pwVeryStrong', 'Très fort')}
      </p>
    );
  }

  return (
    <div className={className}>
      <div className="flex gap-1">
        {SEGMENTS.map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i < score ? segmentColor : 'bg-fg/10'}`}
          />
        ))}
      </div>
      {label}
    </div>
  );
}
