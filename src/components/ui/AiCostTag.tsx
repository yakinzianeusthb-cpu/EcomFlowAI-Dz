import { useLanguage } from '../../context/LanguageContext';
import { useCredits } from '../../services/credits';
import '../../i18n/credits';

/**
 * What a text generation will cost in points, shown inside its button, only when the seller pays in points: Gemini
 * writes their texts, without their own key, on the platform's key. `blocks`: the usual number of 5 000-token blocks
 * of that tool (a landing page with photos uses 3 or 4, a video script 1 or 2), since the real cost follows its length.
 */
export function AiCostTag({ blocks }: { blocks: [number, number] }) {
  const { t } = useLanguage();
  const credits = useCredits();
  if (!credits || credits.mode !== 'points' || credits.textEngine !== 'gemini') return null;
  const [min, max] = blocks.map((b) => b * credits.settings.textCost);
  const label = credits.free
    ? t('crdFreeAdmin', 'gratuit (admin)')
    : min === max
      ? t('crdPts', '{count} pts', { count: min })
      : t('crdPtsRange', '≈ {min} à {max} pts', { min, max });
  return <span className="font-normal opacity-80">· {label}</span>;
}
