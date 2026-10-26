import { useLanguage } from '../../context/LanguageContext';
import type { DeliveryMode, PagePromises } from '../../lib/landingHtml';
import type { PublisherSettings } from '../../lib/landingSettings';
import { cn } from '../../lib/utils';
import { FIELD } from './styles';
import '../../i18n/funnels';

const PROMISES: { key: keyof PagePromises; label: [string, string] }[] = [
  { key: 'nationwide', label: ['lppPromiseNationwide', 'Livraison dans les 58 wilayas'] },
  { key: 'inspection', label: ['lppPromiseInspection', 'Le client vérifie le produit avant de payer'] },
  { key: 'guarantee', label: ['lppPromiseGuarantee', 'Garantie de qualité'] },
];

/** The shop name, how delivery is priced, and the promises the page makes in the seller's name. */
export default function PageOptions({ settings, onChange }: { settings: PublisherSettings; onChange: (next: PublisherSettings) => void }) {
  const { t } = useLanguage();
  const set = (patch: Partial<PublisherSettings>) => onChange({ ...settings, ...patch });
  const deliveryModes: { value: DeliveryMode; label: string }[] = [
    { value: 'by-wilaya', label: t('lppDeliveryByWilaya', 'Selon la wilaya') },
    { value: 'free', label: t('lppDeliveryFree', 'Gratuite') },
    { value: 'fixed', label: t('lppDeliveryFixed', 'Prix fixe') },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-fg-muted">
          {t('lppStoreName', 'Nom de ta boutique (optionnel)')}
          <input className={cn(FIELD, 'mt-1.5')} value={settings.storeName} maxLength={80} onChange={(e) => set({ storeName: e.target.value })} dir="auto" />
        </label>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block text-xs font-semibold text-fg-muted">
            {t('lppDelivery', 'Livraison')}
            <select className={cn(FIELD, 'mt-1.5')} value={settings.deliveryMode} onChange={(e) => set({ deliveryMode: e.target.value as DeliveryMode })}>
              {deliveryModes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </label>
          {settings.deliveryMode === 'fixed' && (
            <label className="block text-xs font-semibold text-fg-muted">
              {t('lppDeliveryFee', 'Prix de la livraison')}
              <input className={cn(FIELD, 'mt-1.5 sm:w-32')} value={settings.deliveryFee} maxLength={20} onChange={(e) => set({ deliveryFee: e.target.value })} placeholder="400 DA" dir="ltr" inputMode="numeric" />
            </label>
          )}
          {settings.deliveryMode === 'by-wilaya' && <p className="text-xs text-fg-faint sm:col-span-2">{t('lppDeliveryByWilayaHint', 'Tu confirmes le prix de la livraison au téléphone avec le client.')}</p>}
        </div>
      </div>

      <fieldset className="rounded-2xl border border-line bg-surface-2 p-4">
        <legend className="px-1 text-sm font-semibold text-fg">{t('lppPromises', 'Ce que tu promets à tes clients')}</legend>
        <p className="text-xs text-fg-muted">{t('lppPromisesHint', "Coche seulement ce que tu offres vraiment : ces promesses s'affichent sur ta page. La section garantie écrite par l'IA n'apparaît que si tu offres une garantie ou la vérification avant paiement.")}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2.5 text-sm text-fg-muted">
            <input type="checkbox" checked disabled className="size-4 accent-[var(--color-primary)]" />
            {t('lppPromiseCod', 'Paiement à la livraison (toujours)')}
          </label>
          {PROMISES.map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-center gap-2.5 text-sm text-fg">
              <input
                type="checkbox"
                checked={settings.promises[key]}
                onChange={(e) => set({ promises: { ...settings.promises, [key]: e.target.checked } })}
                className="size-4 cursor-pointer accent-[var(--color-primary)]"
              />
              {t(label[0], label[1])}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
