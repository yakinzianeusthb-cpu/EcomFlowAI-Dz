import { useEffect, useMemo, useState } from 'react';
import { Coins, Loader2, Save, Check } from 'lucide-react';
import { adminApi } from '../../services/admin';
import { AdminCard, Field, LoadingBlock, inputCls } from './AdminUI';
import { DEFAULT_PRICING, type PricingConfig, buildPlans } from '../../lib/pricing';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../context/LanguageContext';
import '../../i18n/admin';

export default function AdminPricing() {
  const { t, tf } = useLanguage();
  const [form, setForm] = useState<PricingConfig>(DEFAULT_PRICING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      setForm(await adminApi.pricing());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const set = (patch: Partial<PricingConfig>) => {
    setForm(f => ({ ...f, ...patch }));
    setSaved(false);
    setError('');
  };

  const preview = useMemo(() => buildPlans(form, tf), [form, tf]);

  const submit = async () => {
    const prices = [form.monthlyPrice, form.quarterlyPrice, form.lifetimePrice];
    if (prices.some(p => !Number.isInteger(p) || p < 0)) {
      setError(t('admLesPrixDoiventEtre', 'Les prix doivent être des nombres entiers positifs.'));
      return;
    }
    if (!form.currencyCode.trim() || !form.currencySymbol.trim()) {
      setError(t('admLeCodeSymboleDevise', 'Le code et le symbole de la devise sont requis.'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await adminApi.updatePricing(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err?.message || t('admErreurLorsSauvegarde', 'Erreur lors de la sauvegarde.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminCard title={t('admTarifsDevise', 'Tarifs & Devise')} icon={Coins}
      action={
        <button onClick={submit} disabled={saving} className="btn-dz-primary !px-4 !py-2 !text-[12px] flex items-center gap-1.5 disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? t('stgEnregistre', 'Enregistré') : t('admEnregistrer', 'Enregistrer')}
        </button>
      }
    >
      {loading ? (
        <LoadingBlock />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('admCodeDevise', 'Code devise')}>
                <input
                  className={inputCls}
                  value={form.currencyCode}
                  onChange={e => set({ currencyCode: e.target.value })}
                  placeholder="DA, USD, EUR…"
                  maxLength={16}
                />
              </Field>
              <Field label={t('admSymbole', 'Symbole')}>
                <input
                  className={inputCls}
                  value={form.currencySymbol}
                  onChange={e => set({ currencySymbol: e.target.value })}
                  placeholder="DA, $, دج…"
                  maxLength={16}
                />
              </Field>
            </div>

            <Field label={t('admPositionSymbole', 'Position du symbole')}>
              <select
                className={inputCls}
                value={form.currencyPosition}
                onChange={e => set({ currencyPosition: e.target.value as 'before' | 'after' })}
              >
                <option value="after">{t('admApresMontant1500', 'Après le montant — « 1 500 DA »')}</option>
                <option value="before">{t('admAvantMontantDa1', 'Avant le montant — « DA 1 500 »')}</option>
              </select>
            </Field>

            <div className="grid grid-cols-3 gap-4">
              <Field label={t('admMensuel', 'Mensuel')}>
                <input
                  type="number" min={0} step={1}
                  className={inputCls}
                  value={Number.isFinite(form.monthlyPrice) ? form.monthlyPrice : ''}
                  onChange={e => set({ monthlyPrice: Number(e.target.value) })}
                />
              </Field>
              <Field label={t('admTrimestriel', 'Trimestriel')}>
                <input
                  type="number" min={0} step={1}
                  className={inputCls}
                  value={Number.isFinite(form.quarterlyPrice) ? form.quarterlyPrice : ''}
                  onChange={e => set({ quarterlyPrice: Number(e.target.value) })}
                />
              </Field>
              <Field label={t('admAVie2', 'À vie')}>
                <input
                  type="number" min={0} step={1}
                  className={inputCls}
                  value={Number.isFinite(form.lifetimePrice) ? form.lifetimePrice : ''}
                  onChange={e => set({ lifetimePrice: Number(e.target.value) })}
                />
              </Field>
            </div>

            {error && <p className="text-[12px] text-rose-400">{error}</p>}
            <p className="text-xs text-fg-faint">
              {t('admCesPrixSAppliquent', "Ces prix s'appliquent au checkout, à la page de vente et au montant affiché dans les instructions de paiement.")}
            </p>
          </div>

          {/* Live preview */}
          <div className="space-y-3">
            <p className="text-xs text-fg-muted">{t('coApercu', 'Aperçu')}</p>
            {preview.map(p => (
              <div key={p.id} className={cn('surface-card p-4 flex items-center justify-between', p.popular && 'border-dz-emerald/40')}>
                <div>
                  <p className="text-sm font-bold text-fg">{p.label}</p>
                  <p className="text-xs text-fg-muted">{p.per}</p>
                </div>
                <div className="text-end">
                  <p className="font-display font-bold text-dz-dinar">{p.price}</p>
                  <p className="text-xs text-fg-faint">{p.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminCard>
  );
}
