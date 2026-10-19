import { useEffect, useState } from 'react';
import { Flame, Plus, Pencil, Trash2, Loader2, Check, X, ArrowDown, ArrowUp } from 'lucide-react';
import { adminApi, type HotDeal } from '../../services/admin';
import { AdminCard, EmptyState, Field, LoadingBlock, Modal, Toggle, ToggleField, inputCls } from './AdminUI';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../context/LanguageContext';
import '../../i18n/admin';

export default function AdminHotDeals() {
  const { t } = useLanguage();
  const [items, setItems] = useState<HotDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HotDeal | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setItems(await adminApi.hotDeals()); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const toggleActive = async (d: HotDeal) => {
    setBusy(d.id);
    try { await adminApi.updateHotDeal(d.id, { active: !d.active }); await load(); } catch (err) { console.error(err); } finally { setBusy(null); }
  };

  const move = async (d: HotDeal, dir: -1 | 1) => {
    const idx = items.findIndex(x => x.id === d.id);
    const swap = items[idx + dir];
    if (!swap) return;
    try {
      await Promise.all([
        adminApi.updateHotDeal(d.id, { sortOrder: swap.sortOrder }),
        adminApi.updateHotDeal(swap.id, { sortOrder: d.sortOrder }),
      ]);
      await load();
    } catch (err) { console.error(err); }
  };

  return (
    <AdminCard
      title={t('admOffresVedetteHotDeals', 'Offres en vedette (Hot Deals)')}
      icon={Flame}
      action={
        <button onClick={() => setCreating(true)} className="btn-dz-primary !px-4 !py-2 !text-[12px]">
          <Plus size={14} /> {t('admAjouter', 'Ajouter')}
        </button>
      }
    >
      {loading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState icon={Flame} title={t('admAucuneOffreVedette', 'Aucune offre en vedette')} hint={t('admMetsAvantProduitsChauds', 'Mets en avant tes produits chauds pour tous les utilisateurs.')} />
      ) : (
        <div className="space-y-3">
          {items.map((d, i) => (
            <div key={d.id} className="flex items-center gap-3 rounded-2xl bg-fg/[0.02] border border-fg/[0.06] p-3.5">
              <div className="w-11 h-11 rounded-xl bg-fg/[0.04] border border-fg/[0.08] flex items-center justify-center text-xl shrink-0">{d.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-fg text-[14px]">{d.title}</p>
                  {d.badge && <span className="text-xs px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/25">{d.badge}</span>}
                  {d.price && <span className="text-xs text-dz-dinar">{d.price}</span>}
                  {!d.active && <span className="text-xs px-1.5 py-0.5 rounded bg-fg/[0.05] text-fg-faint border border-fg/10">{t('admMasquee', 'Masquée')}</span>}
                </div>
                {d.description && <p className="text-xs text-fg-faint truncate mt-0.5">{d.description}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <div className="flex flex-col me-1">
                  <button onClick={() => move(d, -1)} disabled={i === 0} aria-label={t('admMoveUp', 'Monter')} className="p-0.5 text-fg-faint hover:text-fg disabled:opacity-20 cursor-pointer"><ArrowUp size={12} /></button>
                  <button onClick={() => move(d, 1)} disabled={i === items.length - 1} aria-label={t('admMoveDown', 'Descendre')} className="p-0.5 text-fg-faint hover:text-fg disabled:opacity-20 cursor-pointer"><ArrowDown size={12} /></button>
                </div>
                <Toggle checked={d.active} onChange={() => toggleActive(d)} disabled={busy === d.id} label={t('admToggleVisibility', 'Afficher ou masquer')} />
                <button onClick={() => setEditing(d)} aria-label={t('admEdit', 'Modifier')} className="p-2 rounded-lg text-fg-muted hover:text-fg hover:bg-fg/10 transition-colors cursor-pointer"><Pencil size={15} /></button>
                <button onClick={() => { if (window.confirm(t('admDeleteTitleConfirm', 'Supprimer « {title} » ?', { title: d.title }))) adminApi.deleteHotDeal(d.id).then(load); }} aria-label={t('delete', 'Supprimer')} className="p-2 rounded-lg text-fg-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={creating || editing !== null} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? t('admModifierLOffre', "Modifier l'offre") : t('admNouvelleOffreVedette', 'Nouvelle offre en vedette')}>
        <HotDealForm key={editing?.id || 'new'} initial={editing || undefined} onDone={() => { setCreating(false); setEditing(null); load(); }} />
      </Modal>
    </AdminCard>
  );
}

function HotDealForm({ initial, onDone }: { initial?: HotDeal; onDone: () => void }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    emoji: initial?.emoji || '🔥',
    badge: initial?.badge || '',
    price: initial?.price || '',
    link: initial?.link || '',
    active: initial?.active ?? true,
    sortOrder: initial?.sortOrder || 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        emoji: form.emoji,
        badge: form.badge || null,
        price: form.price || null,
        link: form.link || null,
        active: form.active,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (initial?.id) await adminApi.updateHotDeal(initial.id, payload);
      else await adminApi.createHotDeal(payload);
      onDone();
    } catch (err: any) {
      setError(err?.message || t('admErreur', 'Erreur.'));
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[70px_1fr] gap-3">
        <Field label={t('admEmoji', 'Emoji')}><input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} className={cn(inputCls, 'text-center')} /></Field>
        <Field label={t('admTitre', 'Titre')}><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} placeholder={t('admRobotMenager121', 'Robot ménager 12-en-1')} /></Field>
      </div>
      <Field label={t('admDescription', 'Description')}><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={cn(inputCls, 'min-h-[70px] resize-y')} placeholder={t('admPourquoiCeProduitEst', 'Pourquoi ce produit est chaud ?')} /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label={t('admBadge', 'Badge')}><input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} className={inputCls} placeholder="HOT" /></Field>
        <Field label={t('admPrixAffichage', 'Prix (affichage)')}><input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className={inputCls} placeholder="2 900 DA" /></Field>
        <Field label={t('admLienOptionnel', 'Lien (optionnel)')}><input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} className={inputCls} placeholder="https://…" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('admOrdre', 'Ordre')}><input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} className={inputCls} /></Field>
        <div className="flex items-end mb-2"><ToggleField checked={form.active} onChange={v => setForm(f => ({ ...f, active: v }))} label={form.active ? t('admActive', 'Active') : t('admMasquee', 'Masquée')} /></div>
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
