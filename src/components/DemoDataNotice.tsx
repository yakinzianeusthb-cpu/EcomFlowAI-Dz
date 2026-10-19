import { Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/** Says plainly that a screen shows made-up example data (an unfinished tool), so nobody mistakes it for real figures. */
export default function DemoDataNotice() {
  const { t } = useLanguage();
  return (
    <p role="note" className="flex items-start gap-2 rounded-[var(--radius-md)] border border-warning/40 bg-warning/10 px-4 py-3 text-[13px] leading-relaxed text-fg">
      <Info size={16} className="mt-0.5 shrink-0 text-warning-ink" aria-hidden="true" />
      {t('demoDataNotice', 'Aperçu en cours de développement : les chiffres et les éléments affichés ici sont des exemples, pas des données réelles.')}
    </p>
  );
}
