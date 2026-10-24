import { useEffect, useState } from 'react';
import { Check, Coins, Eye, KeyRound, Loader2, Plus, Save, Send, Trash2, TrendingUp, X } from 'lucide-react';
import { adminApi, type AdminCredits as AdminCreditsData } from '../../services/admin';
import { AdminCard, EmptyState, Field, LoadingBlock, Modal, StatCard, inputCls } from './AdminUI';
import { DEFAULT_CREDIT_SETTINGS, MAX_PACKS, TEXT_BLOCK_TOKENS, type CreditSettings } from '../../lib/credits';
import { formatPrice, usePricing } from '../../lib/pricing';
import { isImageProof, isPdfProof, useBlobUrl } from '../../lib/proof';
import { useLanguage } from '../../context/LanguageContext';
import { DATE_LOCALE, formatDate } from '../../i18n/dates';
import '../../i18n/admin';
import '../../i18n/credits';

/** Google's cost of each action at about 250 DA a dollar (see src/lib/credits.ts), to check the prices stay profitable. */
const GOOGLE_COST_DA = { text: 4, image: 17, videoSecond: 25 };

const newPackId = () => `pack-${Date.now().toString(36)}`;

/** Points: the platform's Gemini key, the prices and packs, purchases to approve, and grants by hand. */
export default function AdminCredits() {
  const { t, language } = useLanguage();
  const pricing = usePricing();
  const [data, setData] = useState<AdminCreditsData | null>(null);
  const [form, setForm] = useState<CreditSettings>(DEFAULT_CREDIT_SETTINGS);
  const [newKey, setNewKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [proof, setProof] = useState<{ id: string; data: string } | null>(null);
  const [grant, setGrant] = useState({ email: '', points: '' });
  const proofUrl = useBlobUrl(proof?.data);

  const load = async () => {
    try {
      const next = await adminApi.credits();
      setData(next);
      setForm(next.settings);
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
    }
  };
  useEffect(() => { void load(); }, []);

  const price = (amount: number) => formatPrice(amount, pricing);
  const setCost = (key: 'textCost' | 'imageCost' | 'videoSecondCost', value: string) => setForm((f) => ({ ...f, [key]: Number(value) }));
  const setPack = (index: number, key: 'points' | 'price', value: string) =>
    setForm((f) => ({ ...f, packs: f.packs.map((p, i) => (i === index ? { ...p, [key]: Number(value) } : p)) }));

  const save = async (platformKey?: string | null) => {
    setSaving(true);
    setMessage(null);
    try {
      await adminApi.updateCredits({ ...form, ...(platformKey !== undefined ? { platformKey } : {}) });
      setNewKey('');
      setMessage({ ok: true, text: t('stgEnregistre', 'Enregistré') });
      await load();
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const decide = async (id: string, decision: 'approve' | 'reject') => {
    setBusy(id);
    try {
      await adminApi.decideCredits(id, decision);
      setProof(null);
      await load();
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(null);
    }
  };

  const openProof = async (id: string) => {
    setBusy(id);
    try {
      setProof({ id, data: (await adminApi.creditProof(id)).proof });
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(null);
    }
  };

  const sendGrant = async () => {
    setBusy('grant');
    setMessage(null);
    try {
      const { balance } = await adminApi.grantCredits(grant.email.trim(), Number(grant.points));
      setMessage({ ok: true, text: t('crdAdmGranted', 'Fait : ce compte a maintenant {balance} points.', { balance }) });
      setGrant({ email: '', points: '' });
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(null);
    }
  };

  if (!data) return <AdminCard title={t('crdAdmTitle', 'Points')} icon={Coins}>{message ? <p className="text-[13px] text-danger-ink">{message.text}</p> : <LoadingBlock />}</AdminCard>;

  // the cheapest point a seller can buy, against Google's cost of each action
  const cheapest = Math.min(...form.packs.map((p) => (p.points > 0 ? p.price / p.points : Infinity)));
  const margin = (points: number, costDa: number) => (Number.isFinite(cheapest) && costDa > 0 ? (points * cheapest) / costDa : 0);
  const costs = [
    { key: 'textCost' as const, label: t('crdAdmTextCost', 'Texte : points par {tokens} tokens', { tokens: TEXT_BLOCK_TOKENS.toLocaleString(DATE_LOCALE[language]) }), google: GOOGLE_COST_DA.text },
    { key: 'imageCost' as const, label: t('crdAdmImageCost', 'Image IA : points par image'), google: GOOGLE_COST_DA.image },
    { key: 'videoSecondCost' as const, label: t('crdAdmVideoCost', 'Vidéo IA : points par seconde'), google: GOOGLE_COST_DA.videoSecond },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('crdAdmStatPurchases', 'Packs vendus ({days} j)', { days: data.stats.days })} value={data.stats.purchases} icon={Coins} />
        <StatCard label={t('crdAdmStatRevenue', 'Encaissé ({days} j)', { days: data.stats.days })} value={price(data.stats.revenue)} icon={TrendingUp} />
        <StatCard label={t('crdAdmStatUsed', 'Points utilisés ({days} j)', { days: data.stats.days })} value={data.stats.pointsUsed} icon={Send} />
      </div>

      {message && <p className={message.ok ? 'text-[13px] text-success-ink' : 'text-[13px] text-danger-ink'} role="status">{message.text}</p>}

      <AdminCard title={t('crdAdmKeyTitle', 'Ta clé Gemini (pour les points)')} icon={KeyRound}>
        <p className="mb-3 text-[13px] text-fg-muted">{t('crdAdmKeyText', 'Les vendeurs sans clé utilisent celle-ci et paient en points. Elle est chiffrée et ne quitte jamais le serveur. Elle doit avoir la facturation activée chez Google.')}</p>
        <p className="mb-3 text-[13px] font-semibold text-fg">
          {data.key.set ? <>{t('crdAdmKeySet', 'Clé enregistrée :')} <span dir="ltr" className="font-mono">{data.key.mask}</span></> : t('crdAdmKeyMissing', 'Aucune clé : les points ne peuvent pas encore être achetés.')}
        </p>
        <div className="flex flex-wrap gap-2">
          <input type="password" autoComplete="off" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="AIza…" aria-label={t('crdAdmKeyInput', 'Nouvelle clé Gemini')} className={`${inputCls} min-w-[16rem] flex-1`} dir="ltr" />
          <button type="button" onClick={() => void save(newKey.trim())} disabled={saving || !newKey.trim()} className="btn-dz-primary disabled:opacity-50"><Save size={14} /> {t('crdAdmKeySave', 'Enregistrer la clé')}</button>
          {data.key.set && (
            <button type="button" onClick={() => { if (window.confirm(t('crdAdmKeyRemoveConfirm', 'Retirer la clé ? Les vendeurs sans clé ne pourront plus utiliser leurs points.'))) void save(null); }} disabled={saving} className="btn-dz-secondary hover:!text-danger-ink"><Trash2 size={14} /> {t('crdAdmKeyRemove', 'Retirer')}</button>
          )}
        </div>
      </AdminCard>

      <AdminCard
        title={t('crdAdmPricesTitle', 'Prix en points et packs')}
        icon={Coins}
        action={<button type="button" onClick={() => void save()} disabled={saving} className="btn-dz-primary !px-4 !py-2 !text-[12px] disabled:opacity-50">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {t('admEnregistrer', 'Enregistrer')}</button>}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {costs.map((c) => (
            <Field key={c.key} label={c.label} hint={t('crdAdmMargin', 'Coût Google ≈ {cost} DA · marge ×{margin}', { cost: c.google, margin: margin(form[c.key], c.google).toFixed(1) })}>
              <input type="number" min={0} step={1} value={Number.isFinite(form[c.key]) ? form[c.key] : ''} onChange={(e) => setCost(c.key, e.target.value)} className={inputCls} />
            </Field>
          ))}
        </div>
        <p className="mt-2 text-xs text-fg-faint">{t('crdAdmMarginNote', 'Marge calculée avec le point le moins cher de tes packs, à environ 250 DA le dollar. Visé : ×2 au moins.')}</p>

        <h3 className="mt-6 text-[13px] font-semibold text-fg">{t('crdAdmPacks', 'Packs')}</h3>
        <ul className="mt-2 space-y-2">
          {form.packs.map((p, i) => (
            <li key={p.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 sm:grid-cols-[1fr_1fr_10rem_auto]">
              <Field label={t('crdAdmPackPoints', 'Points')}><input type="number" min={1} step={1} value={Number.isFinite(p.points) ? p.points : ''} onChange={(e) => setPack(i, 'points', e.target.value)} className={inputCls} /></Field>
              <Field label={t('crdAdmPackPrice', 'Prix ({currency})', { currency: pricing.currencySymbol })}><input type="number" min={0} step={1} value={Number.isFinite(p.price) ? p.price : ''} onChange={(e) => setPack(i, 'price', e.target.value)} className={inputCls} /></Field>
              <p className="mb-2.5 text-xs text-fg-faint max-sm:hidden">{p.points > 0 ? t('crdPerPoint', '{price} le point', { price: price(Math.round((p.price / p.points) * 100) / 100) }) : ''}</p>
              <button type="button" onClick={() => setForm((f) => ({ ...f, packs: f.packs.filter((_, j) => j !== i) }))} disabled={form.packs.length <= 1} aria-label={t('crdAdmPackRemove', 'Retirer ce pack')} className="mb-1 grid size-10 place-items-center rounded-lg text-fg-faint hover:bg-danger/10 hover:text-danger-ink disabled:opacity-30"><Trash2 size={15} /></button>
            </li>
          ))}
        </ul>
        {form.packs.length < MAX_PACKS && (
          <button type="button" onClick={() => setForm((f) => ({ ...f, packs: [...f.packs, { id: newPackId(), points: 100, price: 1000 }] }))} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary-ink hover:underline"><Plus size={14} /> {t('crdAdmPackAdd', 'Ajouter un pack')}</button>
        )}
      </AdminCard>

      <AdminCard title={t('crdAdmPendingTitle', 'Achats de points à vérifier')} icon={Eye}>
        {data.pending.length === 0 ? (
          <EmptyState icon={Coins} title={t('crdAdmPendingEmpty', 'Aucun achat en attente')} />
        ) : (
          <ul className="divide-y divide-line">
            {data.pending.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-fg">{p.user.name} <span className="font-normal text-fg-muted" dir="ltr">· {p.user.email}</span></p>
                  <p className="text-xs text-fg-muted">{t('crdAdmPendingLine', '{points} points · {price} · {method} · {date}', { points: p.points, price: price(p.price), method: p.method, date: formatDate(p.createdAt, language) })}</p>
                </div>
                <button type="button" onClick={() => void openProof(p.id)} disabled={busy === p.id} className="btn-dz-secondary !min-h-9 !px-3 !text-xs">{busy === p.id ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />} {t('crdAdmSeeProof', 'Voir la preuve')}</button>
                <button type="button" onClick={() => void decide(p.id, 'approve')} disabled={busy === p.id} className="btn-dz-primary !min-h-9 !px-3 !text-xs"><Check size={13} /> {t('admApprouver', 'Approuver')}</button>
                <button type="button" onClick={() => void decide(p.id, 'reject')} disabled={busy === p.id} className="btn-dz-secondary !min-h-9 !px-3 !text-xs hover:!text-danger-ink"><X size={13} /> {t('crdAdmReject', 'Refuser')}</button>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard title={t('crdAdmGrantTitle', 'Ajouter des points à la main')} icon={Plus}>
        <p className="mb-3 text-[13px] text-fg-muted">{t('crdAdmGrantText', 'Pour un paiement reçu autrement, un cadeau ou une correction. Un nombre négatif retire des points.')}</p>
        <div className="grid gap-2 sm:grid-cols-[1fr_9rem_auto]">
          <input type="email" value={grant.email} onChange={(e) => setGrant((g) => ({ ...g, email: e.target.value }))} placeholder="email@exemple.com" aria-label={t('crdAdmGrantEmail', 'Email du compte')} className={inputCls} dir="ltr" />
          <input type="number" step={1} value={grant.points} onChange={(e) => setGrant((g) => ({ ...g, points: e.target.value }))} placeholder="100" aria-label={t('crdAdmPackPoints', 'Points')} className={inputCls} />
          <button type="button" onClick={() => void sendGrant()} disabled={busy === 'grant' || !grant.email.trim() || !grant.points} className="btn-dz-primary disabled:opacity-50">{busy === 'grant' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {t('crdAdmGrantSend', 'Ajouter')}</button>
        </div>
      </AdminCard>

      <Modal open={proof !== null} onClose={() => setProof(null)} title={t('admPreuve', 'Preuve')} wide>
        {proof && (isImageProof(proof.data) ? (
          <img src={proofUrl ?? undefined} alt={t('admPreuve', 'Preuve')} className="max-h-[60vh] w-full rounded-xl border border-line object-contain" />
        ) : isPdfProof(proof.data) ? (
          <iframe src={proofUrl ?? undefined} title={t('admPreuvePdf', 'Preuve (PDF)')} className="h-[60vh] w-full rounded-xl border border-line" />
        ) : (
          <p className="py-8 text-center text-fg-muted">{t('admPreuveNonDisponible', 'Preuve non disponible')}</p>
        ))}
        {proof && (
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => void decide(proof.id, 'approve')} disabled={busy === proof.id} className="btn-dz-primary flex-1"><Check size={16} /> {t('admApprouver', 'Approuver')}</button>
            <button type="button" onClick={() => void decide(proof.id, 'reject')} disabled={busy === proof.id} className="btn-dz-secondary flex-1 hover:!text-danger-ink"><X size={16} /> {t('crdAdmReject', 'Refuser')}</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
