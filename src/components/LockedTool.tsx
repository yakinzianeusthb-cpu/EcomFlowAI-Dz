import { Lock, Sparkles, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { AI_TOOLS, type AiTool } from '../lib/tools';

const FALLBACK: AiTool = {
  id: 'tool',
  label: 'Outil pro',
  blurb: 'Cette fonctionnalité aide ton e-commerce à vendre plus.',
  icon: Sparkles,
  paid: true,
};

const labelKey = (tab: string) => `tab${tab.charAt(0).toUpperCase()}${tab.slice(1)}`;

export default function LockedTool({ tab, onSubscribe }: { tab: string; onSubscribe: () => void }) {
  const { t, tf } = useLanguage();
  const info = AI_TOOLS.find((x) => x.id === tab) ?? FALLBACK;
  const Icon: LucideIcon = info.icon;

  return (
    <div className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center px-2 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-accent/15 text-accent-ink">
        <Icon size={26} />
      </span>
      <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent-ink">
        <Lock size={12} /> {t('lockedBadgeText', 'Réservé aux abonnés')}
      </span>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-fg">{t(labelKey(tab), tf(info.label))}</h2>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">{tf(info.blurb)}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-fg-faint">{t('lockedBody', 'Cet outil nécessite un plan actif. Abonne-toi pour débloquer tous les outils IA.')}</p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={onSubscribe} className="btn-dz-primary">
          <Sparkles size={15} /> {t('sidebarSubUpgrade', 'Voir les plans')}
        </button>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('nav-change', { detail: 'dashboard' }))}
          className="btn-dz-secondary"
        >
          {t('lockedBack', 'Retour au tableau de bord')}
        </button>
      </div>
    </div>
  );
}
