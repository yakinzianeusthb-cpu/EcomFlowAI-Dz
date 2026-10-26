import { useEffect, useState } from 'react';
import { CreditCard, Plus, Pencil, Trash2, Loader2, Check, ArrowDown, ArrowUp, X } from 'lucide-react';
import { adminApi, type PaymentMethod } from '../../services/admin';
import { AdminCard, EmptyState, Field, LoadingBlock, Modal, Toggle, ToggleField, inputCls } from './AdminUI';
import RichText from '../../components/RichText';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../context/LanguageContext';
import '../../i18n/admin';

const TYPE_LABELS: Record<string, string> = { email: 'Email', bank: 'Banque', manual: 'Manuel' };

function emptyForm() {
  return {
    code: '', name: '', description: '', emoji: '💳', type: 'manual' as PaymentMethod['type'],
    instructions: [''] as string[],
    details: { beneficiary: '', iban: '', bic: '', idNumber: '', target: '' } as Record<string, string>,
    enabled: true, sortOrder: 0,
  };
}

export default function AdminPayments() {
  const { t, tf } = useLanguage();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setMethods(await adminApi.paymentMethods()); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const toggleEnabled = async (m: PaymentMethod) => {
    setBusy(m.id);
    try { await adminApi.updatePaymentMethod(m.id, { enabled: !m.enabled }); await load(); } catch (err) { console.error(err); } finally { setBusy(null); }
  };

  const move = async (m: PaymentMethod, dir: -1 | 1) => {
    const idx = methods.findIndex(x => x.id === m.id);
    const swap = methods[idx + dir];
    if (!swap) return;
    setBusy(m.id);
    try {
      await Promise.all([
        adminApi.updatePaymentMethod(m.id, { sortOrder: swap.sortOrder }),
        adminApi.updatePaymentMethod(swap.id, { sortOrder: m.sortOrder }),
      ]);
      await load();
    } catch (err) { console.error(err); } finally { setBusy(null); }
  };

  return (
    <AdminCard
      title={t('admMethodesPaiement', 'Méthodes de paiement')}
      icon={CreditCard}
      action={
        <button onClick={() => setCreating(true)} className="btn-dz-primary !px-4 !py-2 !text-[12px]">
          <Plus size={14} /> {t('admAjouter', 'Ajouter')}
        </button>
      }
    >
      {loading ? (
        <LoadingBlock />
      ) : methods.length === 0 ? (
        <EmptyState icon={CreditCard} title={t('admAucuneMethodePaiement', 'Aucune méthode de paiement')} hint={t('admAjoutePremiereMethodeRedotpay', 'Ajoute ta première méthode (RedotPay, BaridiMob…).')} />
      ) : (
        <div className="space-y-3">
          {methods.map((m, i) => (
            <div key={m.id} className="flex items-center gap-3 rounded-2xl bg-fg/[0.02] border border-fg/[0.06] p-3.5">
              <div className="w-11 h-11 rounded-xl bg-fg/[0.04] border border-fg/[0.08] flex items-center justify-center text-xl shrink-0">{m.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-fg text-[14px]">{m.name}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-fg/[0.05] text-fg-muted border border-fg/10">{m.code}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-dz-emerald/10 text-dz-emerald border border-dz-emerald/20">{tf(TYPE_LABELS[m.type])}</span>
                  {!m.enabled && <span className="text-xs px-1.5 py-0.5 rounded bg-fg/[0.05] text-fg-faint border border-fg/10">{t('admMasque', 'Masqué')}</span>}
                </div>
                {m.description && <p className="text-xs text-fg-faint truncate mt-0.5">{m.description}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <div className="flex flex-col me-1">
                  <button onClick={() => move(m, -1)} disabled={i === 0 || busy === m.id} aria-label={t('admMoveUp', 'Monter')} className="p-0.5 text-fg-faint hover:text-fg disabled:opacity-20 cursor-pointer"><ArrowUp size={12} /></button>
                  <button onClick={() => move(m, 1)} disabled={i === methods.length - 1 || busy === m.id} aria-label={t('admMoveDown', 'Descendre')} className="p-0.5 text-fg-faint hover:text-fg disabled:opacity-20 cursor-pointer"><ArrowDown size={12} /></button>
                </div>
                <Toggle checked={m.enabled} onChange={() => toggleEnabled(m)} disabled={busy === m.id} label={t('admToggleVisibility', 'Afficher ou masquer')} />
                <button onClick={() => setEditing(m)} aria-label={t('admEdit', 'Modifier')} className="p-2 rounded-lg text-fg-muted hover:text-fg hover:bg-fg/10 transition-colors cursor-pointer"><Pencil size={15} /></button>
                <button onClick={() => { if (window.confirm(t('admDeleteNameConfirm', 'Supprimer {name} ?', { name: m.name }))) adminApi.deletePaymentMethod(m.id).then(load); }} aria-label={t('delete', 'Supprimer')} className="p-2 rounded-lg text-fg-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={creating || editing !== null} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? t('admEditNameTitle', 'Modifier — {name}', { name: editing.name }) : t('admNouvelleMethodePaiement', 'Nouvelle méthode de paiement')} wide>
        <PaymentMethodForm
          key={editing?.id || 'new'}
          initial={editing ? { ...editing, instructions: [...editing.instructions], details: { ...(editing.details || {}) } } : undefined}
          onDone={() => { setCreating(false); setEditing(null); load(); }}
        />
      </Modal>
    </AdminCard>
  );
}

function PaymentMethodForm({ initial, onDone }: { initial?: Partial<PaymentMethod>; onDone: () => void }) {
  const { t, tf } = useLanguage();
  const [form, setForm] = useState(() => {
    if (!initial) return emptyForm();
    return {
      code: initial.code || '', name: initial.name || '', description: initial.description || '',
      emoji: initial.emoji || '💳', type: (initial.type || 'manual') as PaymentMethod['type'],
      instructions: (Array.isArray(initial.instructions) && initial.instructions.length ? initial.instructions : ['']),
      details: { beneficiary: '', iban: '', bic: '', idNumber: '', target: '', ...(initial.details || {}) },
      enabled: initial.enabled !== false, sortOrder: initial.sortOrder || 0,
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }));

  const setInstruction = (i: number, v: string) =>
    set('instructions', form.instructions.map((s, idx) => (idx === i ? v : s)));
  const addInstruction = () => set('instructions', [...form.instructions, '']);
  const removeInstruction = (i: number) => set('instructions', form.instructions.filter((_, idx) => idx !== i));

  const setDetail = (k: string, v: string) => set('details', { ...form.details, [k]: v });

  const submit = async () => {
    setSaving(true);
    setError('');
    const payload = {
      code: form.code,
      name: form.name,
      description: form.description || null,
      emoji: form.emoji,
      type: form.type,
      instructions: form.instructions.map(s => s.trim()).filter(Boolean),
      enabled: form.enabled,
      sortOrder: form.sortOrder,
    };
    const details: Record<string, string> = {};
    if (form.type === 'bank') {
      for (const k of ['beneficiary', 'iban', 'bic', 'idNumber']) if (form.details[k]) details[k] = form.details[k];
    } else if (form.type === 'email') {
      if (form.details.target) details.target = form.details.target;
    }
    try {
      if (initial?.id) await adminApi.updatePaymentMethod(initial.id, { ...payload, details: Object.keys(details).length ? details : null });
      else await adminApi.createPaymentMethod({ ...payload, details: Object.keys(details).length ? details : null });
      onDone();
    } catch (err: any) {
      setError(err?.message || t('admErreur', 'Erreur.'));
    } finally { setSaving(false); }
  };

  const bankFields: { key: string; label: string }[] = [
    { key: 'beneficiary', label: t('admBeneficiary', 'Bénéficiaire') },
    { key: 'iban', label: 'IBAN' },
    { key: 'bic', label: 'BIC / SWIFT' },
    { key: 'idNumber', label: t('admIdNumber', 'N° Identifiant') },
  ];

  return (
    <div className="space-y-4 max-h-[65vh] overflow-y-auto pe-1">
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('ctcName', 'Nom')}><input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="RedotPay" /></Field>
        <Field label={t('admCodeUniqueSlug', 'Code (unique, slug)')} hint={t('admExRedotpay', 'ex : redotpay')}><input value={form.code} onChange={e => set('code', e.target.value)} className={inputCls} placeholder="redotpay" /></Field>
      </div>
      <div className="grid grid-cols-[70px_1fr] gap-3">
        <Field label={t('admEmoji', 'Emoji')}><input value={form.emoji} onChange={e => set('emoji', e.target.value)} className={cn(inputCls, 'text-center')} /></Field>
        <Field label={t('admType', 'Type')}><div className="grid grid-cols-3 gap-1.5">
          {(['email', 'bank', 'manual'] as const).map(kind => (
            <button key={kind} onClick={() => set('type', kind)} className={cn(
              'rounded-lg border px-2 py-2 text-[12px] font-semibold transition-all cursor-pointer',
              form.type === kind ? 'bg-dz-emerald/10 border-dz-emerald/40 text-dz-emerald' : 'bg-fg/[0.02] border-fg/[0.08] text-fg-muted hover:border-fg/20'
            )}>{tf(TYPE_LABELS[kind])}</button>
          ))}
        </div></Field>
      </div>
      <Field label={t('admDescription', 'Description')}><input value={form.description} onChange={e => set('description', e.target.value)} className={inputCls} placeholder={t('admPaiementLigneRapideSecurise', 'Paiement en ligne rapide et sécurisé')} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('admOrdreDAffichage', "Ordre d'affichage")}><input type="number" value={form.sortOrder} onChange={e => set('sortOrder', Number(e.target.value))} className={inputCls} /></Field>
        <div className="flex items-end mb-2"><ToggleField checked={form.enabled} onChange={v => set('enabled', v)} label={form.enabled ? t('admVisibleCheckout', 'Visible dans le checkout') : t('admMasquee', 'Masquée')} /></div>
      </div>

      {form.type === 'email' && (
        <Field label={t('admEmailReceptionOptionnel', 'Email de réception (optionnel)')} hint={t('admParDefautAdminEmail', 'Par défaut : ADMIN_EMAIL')}>
          <input value={form.details.target} onChange={e => setDetail('target', e.target.value)} className={inputCls} placeholder="admin@dzads.ai" />
        </Field>
      )}

      {form.type === 'bank' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-fg/[0.02] border border-fg/[0.06] p-4">
          {bankFields.map(f => (
            <Field key={f.key} label={f.label}>
              <input value={form.details[f.key]} onChange={e => setDetail(f.key, e.target.value)} className={inputCls} />
            </Field>
          ))}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-fg-muted">{t('admInstructionsEtapes', 'Instructions (étapes)')}</span>
          <button onClick={addInstruction} className="text-xs text-dz-emerald hover:text-dz-gold flex items-center gap-1 cursor-pointer"><Plus size={12} /> {t('admAjouter', 'Ajouter')}</button>
        </div>
        <div className="space-y-2">
          {form.instructions.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-fg/[0.04] border border-fg/[0.1] flex items-center justify-center text-xs font-bold text-fg-muted shrink-0">{i + 1}</span>
              <input value={step} onChange={e => setInstruction(i, e.target.value)} className={inputCls} placeholder={t('admOuvreLApplication', "Ouvre l'application…")} />
              <button onClick={() => removeInstruction(i)} aria-label={t('delete', 'Supprimer')} className="p-1.5 rounded-lg text-fg-faint hover:text-rose-400 transition-colors cursor-pointer shrink-0"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        <p className="text-xs text-fg-faint mt-2"><RichText text={t('admInstructionsTip', 'Astuce : utilise **{amount}**, **{target}** et **{plan}** comme variables dynamiques.')} strongClassName="font-normal text-dz-emerald" /></p>
      </div>

      {error && <p className="text-[12px] text-rose-400">{error}</p>}
      <div className="flex gap-2 pt-2 border-t border-fg/[0.06]">
        <button onClick={submit} disabled={saving} className="btn-dz-primary flex-1 disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Enregistrer
        </button>
        <button onClick={onDone} aria-label={t('admCancelForm', 'Fermer le formulaire')} className="btn-dz-secondary px-4"><X size={14} /></button>
      </div>
    </div>
  );
}
