import { useEffect, useMemo, useState } from 'react';
import { Search, Shield, ShieldOff, Trash2, Eye, Crown, RotateCcw, Users, Loader2, FileText, Package, MessageSquare, Layers, Check, Download, Settings, Infinity } from 'lucide-react';
import { adminApi, type AdminUser, type UserDetail } from '../../services/admin';
import { isImageProof, isPdfProof, useBlobUrl } from '../../lib/proof';
import { AdminCard, EmptyState, Field, LoadingBlock, Modal, StatusBadge, inputCls } from './AdminUI';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../context/LanguageContext';
import '../../i18n/admin';
import { formatDate, formatDateTime } from '../../i18n/dates';

const DURATION_PRESETS = [1, 3, 7, 15, 30, 90];

/** Renders an image/PDF payment proof with optional download. */
function PaymentProofDisplay({ dataUrl }: { dataUrl: string | null | undefined }) {
  const { t } = useLanguage();
  const blobUrl = useBlobUrl(dataUrl);
  const isImg = isImageProof(dataUrl);
  const isPdf = isPdfProof(dataUrl);

  if (!dataUrl || (!isImg && !isPdf)) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-fg-faint">{t('coPreuvePaiement', 'Preuve de paiement')}</p>
      {isImg ? (
        <img src={blobUrl ?? undefined} alt={t('admPreuve', 'Preuve')} className="rounded-xl border border-fg/[0.06] max-h-64 object-contain" />
      ) : isPdf ? (
        <div className="space-y-2">
          <iframe
            src={blobUrl ?? undefined}
            title={t('admPreuvePdf', 'Preuve (PDF)')}
            className="w-full h-[40vh] min-h-[300px] rounded-xl border border-fg/[0.06]"
          />
          <div className="flex items-center gap-2">
            <a
              href={blobUrl ?? ''}
              download="preuve.pdf"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fg/[0.06] border border-fg/[0.1] text-fg-muted text-[12px] font-semibold hover:bg-fg/[0.1] transition-colors cursor-pointer"
            >
              <Download size={14} /> {t('download', 'Télécharger')}
            </a>
            <span className="text-xs text-fg-faint">{t('admCliqueOuvrirTelechargerPdf', 'Clique pour ouvrir/télécharger le PDF')}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminUsers() {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [planModal, setPlanModal] = useState<AdminUser | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setUsers(await adminApi.users()); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, query]);

  const run = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id);
    try { await fn(); await load(); } catch (err) { console.error(err); } finally { setBusy(null); }
  };

  const openDetail = async (user: AdminUser) => {
    setDetailLoading(true);
    setDetail(null);
    try { setDetail(await adminApi.userDetail(user.id)); } catch (err) { console.error(err); } finally { setDetailLoading(false); }
  };

  return (
    <div className="space-y-5">
      <AdminCard
        title={t('admGestionUtilisateurs', 'Gestion des utilisateurs')}
        icon={Users}
        action={
          <div className="relative">
            <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-fg-faint" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('admRechercher', 'Rechercher…')}
              className={cn(inputCls, 'ps-9 w-52 sm:w-64 py-2')}
            />
          </div>
        }
      >
        {loading ? (
          <LoadingBlock />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title={t('admAucunUtilisateurTrouve', 'Aucun utilisateur trouvé')} hint={t('admAjusteRecherche', 'Ajuste ta recherche.')} />
        ) : (
          <div className="overflow-x-auto -mx-5 sm:-mx-6">
            <table className="w-full text-start text-[13px] min-w-[720px]">
              <thead>
                <tr className="text-xs text-fg-faint border-b border-fg/[0.06]">
                  <th className="px-5 sm:px-6 py-3">{t('admRoleUser', 'Utilisateur')}</th>
                  <th className="px-4 py-3">{t('admPlan', 'Plan')}</th>
                  <th className="px-4 py-3">{t('admRole', 'Rôle')}</th>
                  <th className="px-4 py-3">{t('admInscrit', 'Inscrit le')}</th>
                  <th className="px-4 py-3 text-end">{t('admActions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-fg/[0.04] hover:bg-fg/[0.02] transition-colors">
                    <td className="px-5 sm:px-6 py-3">
                      <p className="font-semibold text-fg">{u.name}</p>
                      <p className="text-xs text-fg-faint">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-dz-dinar">{u.plan || '—'}</span>
                        <StatusBadge status={u.planStatus} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.isAdmin ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-dz-emerald"><Shield size={12} /> {t('shlAdmin', 'Admin')}</span>
                      ) : (
                        <span className="text-xs text-fg-faint">{t('admRoleUser', 'Utilisateur')}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-fg-muted">{formatDate(u.createdAt, language)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openDetail(u)} title={t('admVoirDetails', 'Voir détails')} className="p-2 rounded-lg text-fg-muted hover:text-fg hover:bg-fg/10 transition-colors cursor-pointer"><Eye size={15} /></button>
                        <button onClick={() => setPlanModal(u)} title={t('admActiverPlan', 'Activer un plan')} className="p-2 rounded-lg text-fg-muted hover:text-dz-gold hover:bg-fg/10 transition-colors cursor-pointer"><Crown size={15} /></button>
                        <button onClick={() => run(u.id, () => adminApi.toggleAdmin(u.id))} disabled={busy === u.id} title={u.isAdmin ? t('admRetirerAdmin', 'Retirer admin') : t('admRendreAdmin', 'Rendre admin')} className="p-2 rounded-lg text-fg-muted hover:text-dz-emerald hover:bg-fg/10 transition-colors cursor-pointer disabled:opacity-40">
                          {busy === u.id ? <Loader2 size={15} className="animate-spin" /> : u.isAdmin ? <ShieldOff size={15} /> : <Shield size={15} />}
                        </button>
                        <button onClick={() => { if (window.confirm(t('admResetPlanConfirm', 'Réinitialiser le plan de {name} ?', { name: u.name }))) run(u.id, () => adminApi.resetPlan(u.id)); }} title={t('admReinitialiserPlan', 'Réinitialiser le plan')} className="p-2 rounded-lg text-fg-muted hover:text-amber-400 hover:bg-fg/10 transition-colors cursor-pointer"><RotateCcw size={15} /></button>
                        <button onClick={() => { if (window.confirm(t('admDeleteUserConfirm', 'Supprimer définitivement {name} ({email}) ? Toutes ses données seront effacées.', { name: u.name, email: u.email }))) run(u.id, () => adminApi.deleteUser(u.id)); }} title={t('delete', 'Supprimer')} className="p-2 rounded-lg text-fg-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {/* Detail modal */}
      <Modal open={detail !== null || detailLoading} onClose={() => setDetail(null)} title={t('admDetailsLUtilisateur', "Détails de l'utilisateur")} wide>
        {detailLoading || !detail ? (
          <LoadingBlock label={t('admChargementProfil', 'Chargement du profil…')} />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/30 border border-fg/10 flex items-center justify-center font-bold text-lg text-fg">
                {detail.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-display font-semibold text-fg text-lg">{detail.name}</p>
                <p className="text-[12px] text-fg-muted">{detail.email}</p>
              </div>
              <div className="ms-auto flex items-center gap-2">
                <span className="text-xs text-dz-dinar">{detail.plan || '—'}</span>
                <StatusBadge status={detail.planStatus} />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: t('admGenerations', 'Générations'), value: detail._count.generationHistory, icon: FileText },
                { label: t('admProducts', 'Produits'), value: detail._count.productCatalog, icon: Package },
                { label: 'Chats', value: detail._count.chatSessions, icon: MessageSquare },
                { label: 'LPs', value: detail._count.lpSessions, icon: Layers },
                { label: 'OTPs', value: detail._count.emailOtps, icon: Check },
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-fg/[0.03] border border-fg/[0.06] p-3 text-center">
                  <s.icon size={14} className="mx-auto text-dz-emerald mb-1.5" />
                  <p className="font-display font-bold text-lg text-fg">{s.value}</p>
                  <p className="text-xs text-fg-faint">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
              <div className="rounded-xl bg-fg/[0.03] border border-fg/[0.06] p-4 space-y-2">
                <p className="text-xs text-fg-faint">{t('admAbonnement', 'Abonnement')}</p>
                <p>{t('admDebut', 'Début:')} <span className="text-fg-muted">{formatDate(detail.planActiveFrom, language)}</span></p>
                <p>{t('admExpire', 'Expire:')} <span className="text-fg-muted">{detail.planExpiresAt ? formatDate(detail.planExpiresAt, language) : detail.plan === 'lifetime' ? t('admAVie', '∞ (à vie)') : '—'}</span></p>
                <p>{t('admMethode', 'Méthode:')} <span className="text-fg-muted">{detail.paymentMethod || '—'}</span></p>
                <p>{t('admSoumis', 'Soumis:')} <span className="text-fg-muted">{formatDateTime(detail.paymentSubmittedAt, language)}</span></p>
                {detail.paymentNote && <p>{t('admNote', 'Note:')} <span className="text-fg-muted">{detail.paymentNote}</span></p>}
              </div>
              <div className="rounded-xl bg-fg/[0.03] border border-fg/[0.06] p-4 space-y-2">
                <p className="text-xs text-fg-faint">{t('admPreferences', 'Préférences')}</p>
                <p>{t('admLangue', 'Langue:')} <span className="text-fg-muted">{detail.userPreferences?.language || 'fr'}</span></p>
                <p>{t('admTheme', 'Thème:')} <span className="text-fg-muted">{detail.userPreferences?.theme || 'dark'}</span></p>
                <p>{t('admWorkspace', 'Workspace:')} <span className="text-fg-muted">{detail.apiSettings?.workspaceName || '—'}</span></p>
                <p>{t('admInscrit2', 'Inscrit le :')} <span className="text-fg-muted">{formatDate(detail.createdAt, language)}</span></p>
              </div>
            </div>

            <PaymentProofDisplay dataUrl={detail.paymentProof} />

            <div className="flex gap-2 pt-2 border-t border-fg/[0.06]">
              <button onClick={() => { if (window.confirm(t('admResetPlanConfirm', 'Réinitialiser le plan de {name} ?', { name: detail.name }))) { adminApi.resetPlan(detail.id).then(() => { setDetail(null); load(); }); } }} className="btn-dz-secondary flex-1 text-[13px]"><RotateCcw size={14} /> {t('admReinitialiserPlan', 'Réinitialiser le plan')}</button>
              <button onClick={() => adminApi.toggleAdmin(detail.id).then(() => { openDetail({ id: detail.id } as AdminUser); load(); })} className="btn-dz-secondary flex-1 text-[13px]">
                {detail.isAdmin ? <ShieldOff size={14} /> : <Shield size={14} />} {detail.isAdmin ? t('admRetirerAdmin', 'Retirer admin') : t('admRendreAdmin', 'Rendre admin')}
              </button>
              <button onClick={() => { if (window.confirm(t('admDeleteUserShortConfirm', 'Supprimer définitivement {name} ?', { name: detail.name }))) adminApi.deleteUser(detail.id).then(() => { setDetail(null); load(); }); }} className="btn-dz-danger flex-1 text-[13px]"><Trash2 size={14} /> {t('delete', 'Supprimer')}</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Set plan modal */}
      <Modal open={planModal !== null} onClose={() => setPlanModal(null)} title={t('admActivatePlanFor', 'Activer un plan — {name}', { name: planModal?.name ?? '' })}>
        {planModal && <SetPlanForm user={planModal} onDone={() => { setPlanModal(null); load(); }} />}
      </Modal>
    </div>
  );
}

function SetPlanForm({ user, onDone }: { user: AdminUser; onDone: () => void }) {
  const { t } = useLanguage();
  const [preset, setPreset] = useState<number | 'custom' | 'lifetime'>(30);
  const [customDays, setCustomDays] = useState(7);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const days = preset === 'custom' ? customDays : (preset === 'lifetime' ? 0 : preset);
  const label = preset === 'lifetime'
    ? t('admLifetimeLower', 'à vie')
    : days === 1 ? t('admOneDay', '1 jour') : t('coDays', '{days} jours', { days });
  const planId = preset === 'lifetime' ? 'lifetime' : preset === 30 ? 'monthly' : preset === 90 ? 'quarterly' : 'custom';

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      await adminApi.setPlan(user.id, { plan: planId, days: preset === 'lifetime' ? undefined : days });
      onDone();
    } catch (err: any) {
      setError(err?.message || t('admErreur', 'Erreur.'));
    } finally {
      setSaving(false);
    }
  };

  const chipCls = (active: boolean) => cn(
    'rounded-xl border px-2.5 py-2.5 text-center transition-all cursor-pointer flex-1 min-w-[74px]',
    active ? 'bg-dz-emerald/10 border-dz-emerald/40 text-dz-emerald' : 'bg-fg/[0.02] border-fg/[0.08] text-fg-muted hover:border-fg/20'
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {DURATION_PRESETS.map(d => (
          <button key={d} type="button" onClick={() => setPreset(d)} className={chipCls(preset === d)}>
            <Crown size={13} className="mx-auto mb-1" />
            <span className="text-xs font-semibold">{t('admDaysShort', '{days}j', { days: d })}</span>
          </button>
        ))}
        <button type="button" onClick={() => setPreset('custom')} className={chipCls(preset === 'custom')}>
          <Settings size={13} className="mx-auto mb-1" />
          <span className="text-xs font-semibold">{t('admPerso', 'Perso')}</span>
        </button>
        <button type="button" onClick={() => setPreset('lifetime')} className={chipCls(preset === 'lifetime')}>
          <Infinity size={13} className="mx-auto mb-1" />
          <span className="text-xs font-semibold">{t('admAVie2', 'À vie')}</span>
        </button>
      </div>

      {preset === 'custom' && (
        <Field label={t('admDureeJoursEx1', 'Durée en jours (ex: 1, 7, 45)')}>
          <input type="number" min={1} max={3650} value={customDays} onChange={e => setCustomDays(Math.max(1, Number(e.target.value) || 1))} className={inputCls} />
        </Field>
      )}

      <p className="text-xs text-fg-faint">
        {t('admAccesActifImmediatement', 'Accès actif immédiatement —')} <span className="text-dz-emerald font-semibold">{label}</span>.
      </p>

      {error && <p className="text-[12px] text-rose-400">{error}</p>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={saving} className="btn-dz-primary flex-1 disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {t('admActivateLabel', 'Activer {label}', { label })}
        </button>
        <button onClick={onDone} className="btn-dz-secondary">{t('admAnnuler', 'Annuler')}</button>
      </div>
    </div>
  );
}