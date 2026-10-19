import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, Clock, FileText, Check, X, Eye, CreditCard, Megaphone, Flame, Loader2, Download } from 'lucide-react';
import { adminApi, type AdminStats, type PendingPayment } from '../../services/admin';
import { isImageProof, isPdfProof, useBlobUrl } from '../../lib/proof';
import { AdminCard, StatCard, LoadingBlock, EmptyState, StatusBadge } from './AdminUI';
import { useLanguage } from '../../context/LanguageContext';
import '../../i18n/admin';
import { formatDate } from '../../i18n/dates';

export default function AdminOverview() {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pending, setPending] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<PendingPayment | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const proofUrl = useBlobUrl(selectedProof?.paymentProof);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([adminApi.stats(), adminApi.pendingPayments()]);
      setStats(s);
      setPending(p);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminApi.approve(userId);
      setPending(prev => prev.filter(p => p.id !== userId));
      loadData();
    } catch (err) { console.error(err); } finally { setActionLoading(null); }
  };

  const handleReject = async (userId: string) => {
    if (!window.confirm(t('admRejectConfirm', 'Rejeter ce paiement ?'))) return;
    setActionLoading(userId);
    try {
      await adminApi.reject(userId);
      setPending(prev => prev.filter(p => p.id !== userId));
      loadData();
    } catch (err) { console.error(err); } finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label={t('admTabUsers', 'Utilisateurs')} value={stats.totalUsers} icon={Users} color="text-dz-emerald" />
          <StatCard label={t('admAbonnesActifs', 'Abonnés actifs')} value={stats.activeSubs} icon={Crown} color="text-dz-gold" />
          <StatCard label={t('admStatusPending', 'En attente')} value={stats.pendingPayments} icon={Clock} color="text-amber-400" />
          <StatCard label={t('admGenerations', 'Générations')} value={stats.totalGenerations} icon={FileText} color="text-sky-400" />
          <StatCard label={t('admMethodesPaiement', 'Méthodes de paiement')} value={stats.paymentMethods} icon={CreditCard} color="text-dz-emerald" />
          <StatCard label={t('dashWidgetAnnouncements', 'Annonces')} value={stats.announcements} icon={Megaphone} color="text-violet-400" />
          <StatCard label={t('admOffresVedette', 'Offres en vedette')} value={stats.hotDeals} icon={Flame} color="text-orange-400" />
        </div>
      )}

      <AdminCard title={t('admPaiementsAttente', 'Paiements en attente')} icon={Clock}>
        {loading ? (
          <LoadingBlock />
        ) : pending.length === 0 ? (
          <EmptyState icon={Check} title={t('admAucunPaiementAttente', 'Aucun paiement en attente')} hint={t('admToutEstJour', 'Tout est à jour.')} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map(p => (
              <div key={p.id} className="rounded-2xl bg-fg/[0.02] border border-fg/[0.06] p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-fg text-[15px]">{p.name}</p>
                    <p className="text-[12px] text-fg-muted">{p.email}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-dz-dinar/10 text-dz-dinar border border-dz-dinar/20">{p.plan}</span>
                </div>
                <div className="space-y-1.5 text-[12px] text-fg-muted mb-4">
                  <p>{t('admMethode', 'Méthode:')} <span className="text-fg-muted font-semibold">{p.paymentMethod || t('admNonSpecifie', 'Non spécifié')}</span></p>
                  <p>{t('admSoumis', 'Soumis:')} <span className="text-fg-muted">{formatDate(p.paymentSubmittedAt, language)}</span></p>
                </div>
                {p.paymentProof && (isImageProof(p.paymentProof) ? (
                  <button onClick={() => setSelectedProof(p)} className="w-full mb-3 block rounded-xl overflow-hidden border border-fg/[0.08] hover:border-dz-emerald/40 transition-all cursor-pointer group text-start">
                    <img src={p.paymentProof} alt={t('admProofOf', 'Preuve — {name}', { name: p.name })} className="w-full h-44 object-cover group-hover:scale-[1.02] transition-transform" />
                    <span className="flex items-center justify-center gap-1.5 py-1.5 text-xs text-fg-muted bg-fg/[0.03] group-hover:text-fg-muted group-hover:bg-fg/[0.05]">
                      <Eye size={12} /> {t('lpgAgrandir', 'Agrandir')}
                    </span>
                  </button>
                ) : isPdfProof(p.paymentProof) ? (
                  <button onClick={() => setSelectedProof(p)} className="w-full mb-3 py-3 rounded-xl bg-fg/[0.04] border border-fg/[0.06] text-[12px] text-fg-muted hover:text-fg hover:bg-fg/[0.08] transition-all flex items-center justify-center gap-2">
                    <FileText size={14} /> {t('admVoirPreuvePdf', 'Voir la preuve (PDF)')}
                  </button>
                ) : (
                  <p className="text-xs text-fg-faint mb-3">{t('admPreuveNonLisible', 'Preuve non lisible')}</p>
                ))}
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(p.id)} disabled={actionLoading === p.id} className="flex-1 py-2 rounded-xl bg-dz-emerald/15 border border-dz-emerald/30 text-dz-emerald text-[12px] font-semibold hover:bg-dz-emerald/25 transition-all flex items-center justify-center gap-1 disabled:opacity-50">
                    {actionLoading === p.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Approuver
                  </button>
                  <button onClick={() => handleReject(p.id)} disabled={actionLoading === p.id} className="flex-1 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[12px] font-semibold hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1 disabled:opacity-50">
                    <X size={12} /> {t('admRejeter', 'Rejeter')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      <AnimatePresence>
        {selectedProof && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80" onClick={() => setSelectedProof(null)}>
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }} className="w-full max-w-2xl surface-card rounded-2xl p-6 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="admin-proof-title" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 id="admin-proof-title" className="font-display font-semibold text-lg text-fg">{t('admProofOf', 'Preuve — {name}', { name: selectedProof.name })}</h3>
                <button onClick={() => setSelectedProof(null)} aria-label={t('admModalClose', 'Fermer la fenêtre')} className="p-2 rounded-xl text-fg-muted hover:text-fg hover:bg-fg/10 transition-colors"><X size={18} /></button>
              </div>
              <div className="text-[13px] text-fg-muted mb-4 space-y-1">
                <p>{t('admEmail', 'Email:')} <span className="text-fg-muted">{selectedProof.email}</span></p>
                <p>{t('admPlan2', 'Plan:')} <span className="text-dz-dinar font-semibold">{selectedProof.plan}</span></p>
                <p>{t('admMethode', 'Méthode:')} <span className="text-fg-muted">{selectedProof.paymentMethod}</span></p>
                <p>{t('admStatut', 'Statut:')} <StatusBadge status={selectedProof.planStatus} /></p>
              </div>
              {isImageProof(selectedProof.paymentProof) ? (
                <img src={proofUrl ?? undefined} alt={t('admPreuve', 'Preuve')} className="w-full rounded-xl border border-fg/[0.06] max-h-[60vh] object-contain" />
              ) : isPdfProof(selectedProof.paymentProof) ? (
                <iframe src={proofUrl ?? undefined} title={t('admPreuvePdf', 'Preuve (PDF)')} className="w-full h-[60vh] rounded-xl border border-fg/[0.06]" />
              ) : (
                <p className="text-fg-muted text-center py-8">{t('admPreuveNonDisponible', 'Preuve non disponible')}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                <button onClick={() => { handleApprove(selectedProof.id); setSelectedProof(null); }} className="flex-1 min-w-[120px] py-3 rounded-xl bg-dz-emerald/15 border border-dz-emerald/30 text-dz-emerald font-semibold hover:bg-dz-emerald/25 transition-all flex items-center justify-center gap-2"><Check size={16} /> {t('admApprouver', 'Approuver')}</button>
                <button onClick={() => { handleReject(selectedProof.id); setSelectedProof(null); }} className="flex-1 min-w-[120px] py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"><X size={16} /> {t('admRejeter', 'Rejeter')}</button>
                {proofUrl && (
                  <a href={proofUrl} download={isPdfProof(selectedProof.paymentProof) ? 'preuve.pdf' : 'preuve.png'} className="flex-1 min-w-[120px] py-3 rounded-xl bg-fg/[0.06] border border-fg/[0.1] text-fg-muted font-semibold hover:bg-fg/[0.1] transition-all flex items-center justify-center gap-2">
                    <Download size={16} /> {t('download', 'Télécharger')}
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
