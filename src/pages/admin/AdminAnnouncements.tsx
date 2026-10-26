import { useEffect, useState } from 'react';
import { Megaphone, Plus, Pencil, Trash2, Loader2, Check, X } from 'lucide-react';
import { adminApi, type Announcement } from '../../services/admin';
import { AdminCard, EmptyState, Field, LoadingBlock, Modal, Toggle, ToggleField, inputCls } from './AdminUI';
import { formatDate } from '../../i18n/dates';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../context/LanguageContext';
import '../../i18n/admin';

const KIND_STYLES: Record<string, string> = {
  info: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  warning: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  success: 'text-dz-emerald bg-dz-emerald/10 border-dz-emerald/20',
  promo: 'text-dz-gold bg-dz-gold/10 border-dz-gold/20',
};

const toDateTimeLocal = (s: string | null) => (s ? new Date(s).toISOString().slice(0, 16) : '');

export default function AdminAnnouncements() {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setItems(await adminApi.announcements()); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const toggleActive = async (a: Announcement) => {
    try { await adminApi.updateAnnouncement(a.id, { active: !a.active }); await load(); } catch (err) { console.error(err); }
  };

  return (
    <AdminCard
      title={t('dashWidgetAnnouncements', 'Annonces')}
      icon={Megaphone}
      action={
        <button onClick={() => setCreating(true)} className="btn-dz-primary !px-4 !py-2 !text-[12px]">
          <Plus size={14} /> {t('admNouvelleAnnonce', 'Nouvelle annonce')}
        </button>
      }
    >
      {loading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState icon={Megaphone} title={t('admAucuneAnnonce', 'Aucune annonce')} hint={t('admLesAnnoncesApparaissentDashboa', 'Les annonces apparaissent dans le dashboard des utilisateurs.')} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map(a => (
            <div key={a.id} className="rounded-2xl bg-fg/[0.02] border border-fg/[0.06] p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl shrink-0">{a.emoji}</span>
                  <p className="font-semibold text-fg text-[14px] truncate">{a.title}</p>
                  <span className={cn('text-xs px-1.5 py-0.5 rounded-full border', KIND_STYLES[a.kind] || KIND_STYLES.info)}>{a.kind}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Toggle checked={a.active} onChange={() => toggleActive(a)} label={t('admToggleVisibility', 'Afficher ou masquer')} />
                  <button onClick={() => setEditing(a)} aria-label={t('admEdit', 'Modifier')} className="p-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-fg/10 transition-colors cursor-pointer"><Pencil size={14} /></button>
                  <button onClick={() => { if (window.confirm(t('admDeleteAnnouncementConfirm', 'Supprimer l\'annonce « {title} » ?', { title: a.title }))) adminApi.deleteAnnouncement(a.id).then(load); }} aria-label={t('delete', 'Supprimer')} className="p-1.5 rounded-lg text-fg-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-[12px] text-fg-muted leading-relaxed line-clamp-2">{a.message}</p>
              <p className="text-xs text-fg-faint mt-2">
                {a.startsAt ? t('admFromDate', 'Du {date}', { date: formatDate(a.startsAt, language) }) : t('admImmediate', 'Immédiate')}
                {a.expiresAt ? t('admToDate', ' au {date}', { date: formatDate(a.expiresAt, language) }) : t('admPermanent', ' · permanente')}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal open={creating || editing !== null} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? t('admModifierLAnnonce', "Modifier l'annonce") : t('admNouvelleAnnonce', 'Nouvelle annonce')}>
        <AnnouncementForm key={editing?.id || 'new'} initial={editing || undefined} onDone={() => { setCreating(false); setEditing(null); load(); }} />
      </Modal>
    </AdminCard>
  );
}

function AnnouncementForm({ initial, onDone }: { initial?: Announcement; onDone: () => void }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    title: initial?.title || '',
    message: initial?.message || '',
    emoji: initial?.emoji || '📢',
    kind: (initial?.kind || 'info') as Announcement['kind'],
    active: initial?.active ?? true,
    startsAt: toDateTimeLocal(initial?.startsAt || null),
    expiresAt: toDateTimeLocal(initial?.expiresAt || null),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title, message: form.message, emoji: form.emoji, kind: form.kind,
        active: form.active,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };
      if (initial?.id) await adminApi.updateAnnouncement(initial.id, payload);
      else await adminApi.createAnnouncement(payload);
      onDone();
    } catch (err: any) {
      setError(err?.message || t('admErreur', 'Erreur.'));
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[70px_1fr] gap-3">
        <Field label={t('admEmoji', 'Emoji')}><input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} className={cn(inputCls, 'text-center')} /></Field>
        <Field label={t('admType', 'Type')}><div className="grid grid-cols-4 gap-1.5">
          {(['info', 'warning', 'success', 'promo'] as const).map(k => (
            <button key={k} onClick={() => setForm(f => ({ ...f, kind: k }))} className={cn(
              'rounded-lg border px-1 py-2 text-xs font-semibold transition-all cursor-pointer',
              form.kind === k ? KIND_STYLES[k] : 'bg-fg/[0.02] border-fg/[0.08] text-fg-muted hover:border-fg/20'
            )}>{k}</button>
          ))}
        </div></Field>
      </div>
      <Field label={t('admTitre', 'Titre')}><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} placeholder={t('admNouveaute', 'Nouveauté !')} /></Field>
      <Field label={t('ctcMessage', 'Message')}><textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className={cn(inputCls, 'min-h-[90px] resize-y')} placeholder={t('admLeMessageAfficheUtilisateurs', 'Le message affiché aux utilisateurs…')} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('admDebutOptionnel', 'Début (optionnel)')}><input type="datetime-local" value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))} className={inputCls} /></Field>
        <Field label={t('admFinOptionnel', 'Fin (optionnel)')}><input type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className={inputCls} /></Field>
      </div>
      <ToggleField checked={form.active} onChange={v => setForm(f => ({ ...f, active: v }))} label={form.active ? t('admAnnonceActive', 'Annonce active') : t('admAnnonceDesactivee', 'Annonce désactivée')} />
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
