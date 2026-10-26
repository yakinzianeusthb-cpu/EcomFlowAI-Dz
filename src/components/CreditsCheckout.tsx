import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Coins, CreditCard, FileImage, FileText, Hourglass, Loader2, Upload, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { contentApi, type PaymentMethod } from '../services/admin';
import { buyCredits, refreshCredits, useCredits } from '../services/credits';
import { fileToUploadDataUrl } from '../lib/imageCompress';
import { formatPrice, usePricing } from '../lib/pricing';
import { TEXT_BLOCK_TOKENS, type CreditPack } from '../lib/credits';
import { cn } from '../lib/utils';
import '../i18n/credits';
import '../i18n/checkout';
import { DATE_LOCALE } from '../i18n/dates';

type Step = 'pack' | 'method' | 'payment' | 'done';

// Photos are shrunk before upload; documents (PDF) go as they are and must fit the server's 5 MB proof limit.
const MAX_PROOF_PHOTO_BYTES = 25 * 1024 * 1024;
const MAX_PROOF_DOCUMENT_BYTES = 5 * 1024 * 1024;

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Buying points: the balance and prices, a pack, a payment method, the proof; an admin then approves it. */
export default function CreditsCheckout({ open, onClose }: Props) {
  const { t, language } = useLanguage();
  const toast = useToast();
  const credits = useCredits();
  const pricing = usePricing();
  const [step, setStep] = useState<Step>('pack');
  const [pack, setPack] = useState<CreditPack | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [proof, setProof] = useState<{ name: string; size: number; isImage: boolean; data: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setStep('pack');
    setPack(null);
    setMethod(null);
    setProof(null);
    void refreshCredits();
    setMethodsLoading(true);
    contentApi.paymentMethods().then(setMethods).catch(() => setMethods([])).finally(() => setMethodsLoading(false));
  }, [open]);

  const price = (amount: number) => formatPrice(amount, pricing);
  const packLabel = (p: CreditPack) => t('crdPackPoints', '{points} points', { points: p.points });
  const fill = (text: string) => text.replace('{amount}', pack ? price(pack.price) : '').replace('{target}', method?.details?.target ?? '').replace('{plan}', pack ? packLabel(pack) : '');

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    if (file.size > (isImage ? MAX_PROOF_PHOTO_BYTES : MAX_PROOF_DOCUMENT_BYTES)) {
      toast.error(t('coFichierTropVolumineuxMax', 'Fichier trop volumineux (max 5 Mo).'));
      return;
    }
    try {
      setProof({ name: file.name, size: file.size, isImage, data: await fileToUploadDataUrl(file) });
    } catch {
      toast.error(t('coFichierIllisibleChoisisAutre', 'Fichier illisible. Choisis une autre image.'));
    }
  };

  const submit = async () => {
    if (!pack || !method) return;
    if (!proof) {
      toast.error(t('coVeuillezJoindrePreuvePaiement', 'Veuillez joindre une preuve de paiement.'));
      return;
    }
    setSubmitting(true);
    try {
      await buyCredits({ packId: pack.id, method: method.code, proof: proof.data });
      setStep('done');
    } catch (err) {
      toast.error((err as Error).message || t('authErrGeneric', 'Une erreur est survenue.'));
    } finally {
      setSubmitting(false);
    }
  };

  const settings = credits?.settings;
  const back = (to: Step) => (
    <button type="button" onClick={() => setStep(to)} aria-label={t('crdBack', 'Retour')} className="grid size-9 place-items-center rounded-lg text-fg-faint hover:bg-fg/5 hover:text-fg">
      <ArrowLeft size={16} className="rtl:-scale-x-100" />
    </button>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="credits-title"
            className="relative my-8 w-full max-w-lg rounded-[var(--radius-lg)] bg-surface p-6 shadow-[var(--shadow-lg)] sm:p-8"
            initial={{ scale: 0.96, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={onClose} aria-label={t('coFermer', 'Fermer')} className="absolute end-4 top-4 grid size-9 place-items-center rounded-lg text-fg-muted hover:bg-fg/10 hover:text-fg">
              <X size={18} />
            </button>

            {step === 'pack' && (
              <div>
                <p className="flex items-center gap-2 text-[13px] text-fg-muted"><Coins size={15} className="text-primary-ink" /> {t('crdBalance', 'Ton solde')}</p>
                <p id="credits-title" className="home-display mt-1 text-[40px] text-fg"><span dir="ltr">{credits?.balance ?? 0}</span> <span className="text-[20px] text-fg-muted">{t('crdPointsWord', 'points')}</span></p>
                <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
                  {credits?.mode === 'own-key'
                    ? t('crdOwnKeyNote', 'Tu utilises ta propre clé Gemini : tes générations ne coûtent pas de points. Les points servent si tu retires ta clé.')
                    : t('crdIntro', 'Pas de clé Gemini ? Utilise l’IA avec des points : achète un pack, et chaque génération décompte ses points.')}
                </p>

                {settings && (
                  <ul className="mt-4 grid grid-cols-3 gap-2 text-center">
                    {[
                      { value: settings.textCost, label: t('crdCostText', 'texte, par {tokens} tokens', { tokens: TEXT_BLOCK_TOKENS.toLocaleString(DATE_LOCALE[language]) }) },
                      { value: settings.imageCost, label: t('crdCostImage', 'par image IA') },
                      { value: settings.videoSecondCost, label: t('crdCostVideo', 'par seconde de vidéo IA') },
                    ].map((c) => (
                      <li key={c.label} className="rounded-[var(--radius-md)] bg-surface-2 px-2 py-3">
                        <span className="block text-lg font-semibold text-fg" dir="ltr">{c.value}</span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-fg-muted">{c.label}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {!credits?.available ? (
                  <p className="mt-5 rounded-[var(--radius-md)] bg-warning/10 p-3 text-[13px] text-warning-ink">{t('crdUnavailable', 'L’achat de points n’est pas encore ouvert. Ajoute ta clé Gemini dans Paramètres, ou reviens plus tard.')}</p>
                ) : credits.pending ? (
                  <div className="mt-5 flex gap-3 rounded-[var(--radius-md)] bg-surface-2 p-4">
                    <Hourglass size={18} className="mt-0.5 shrink-0 text-warning-ink" />
                    <p className="text-[13px] leading-relaxed text-fg-muted">{t('crdPendingNote', 'Ton achat de {points} points est en attente de vérification. Les points seront ajoutés dès qu’un admin l’aura approuvé.', { points: credits.pending.points })}</p>
                  </div>
                ) : (
                  <>
                    <h3 className="mt-6 text-[15px] font-semibold text-fg">{t('crdChoosePack', 'Choisis un pack')}</h3>
                    <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                      {settings?.packs.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPack(p)}
                          aria-pressed={pack?.id === p.id}
                          className={cn('rounded-[var(--radius-md)] border p-4 text-start transition-colors', pack?.id === p.id ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : 'border-line bg-surface-2 hover:border-line-strong')}
                        >
                          <span className="block text-lg font-semibold text-fg">{packLabel(p)}</span>
                          <span className="mt-1 block text-[15px] font-medium text-primary-ink">{price(p.price)}</span>
                          <span className="mt-1 block text-[11px] text-fg-faint">{t('crdPerPoint', '{price} le point', { price: price(Math.round((p.price / p.points) * 100) / 100) })}</span>
                        </button>
                      ))}
                    </div>
                    <button type="button" disabled={!pack} onClick={() => setStep('method')} className="btn-dz-primary mt-5 w-full disabled:pointer-events-none disabled:opacity-40">
                      {t('fpContinue', 'Continuer')} <ArrowRight size={16} className="rtl:-scale-x-100" />
                    </button>
                  </>
                )}
              </div>
            )}

            {step === 'method' && pack && (
              <div>
                <div className="flex items-center gap-2">{back('pack')}<h3 id="credits-title" className="text-xl font-semibold text-fg">{t('coModePaiement', 'Mode de paiement')}</h3></div>
                <p className="ms-11 mt-1 text-[13px] text-fg-muted">{packLabel(pack)} · {price(pack.price)}</p>
                {methodsLoading ? (
                  <div className="py-10 text-center"><Loader2 size={22} className="mx-auto animate-spin text-fg-faint" /></div>
                ) : methods.length === 0 ? (
                  <div className="py-10 text-center"><CreditCard size={22} className="mx-auto mb-2 text-fg-faint" /><p className="text-[13px] text-fg-muted">{t('coAucuneMethodePaiementDisponibl', 'Aucune méthode de paiement disponible pour le moment.')}</p></div>
                ) : (
                  <div className="mt-5 space-y-2.5">
                    {methods.map((m) => (
                      <button key={m.id} type="button" onClick={() => { setMethod(m); setStep('payment'); }} className="flex w-full items-center gap-4 rounded-[var(--radius-md)] border border-line bg-surface-2 p-4 text-start transition-colors hover:border-line-strong">
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-2xl">{m.emoji || '💳'}</span>
                        <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold text-fg">{m.name}</span>{m.description && <span className="mt-0.5 block text-[12px] text-fg-muted">{m.description}</span>}</span>
                        <ArrowRight size={16} className="text-fg-faint rtl:-scale-x-100" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 'payment' && pack && method && (
              <div>
                <div className="flex items-center gap-2">{back('method')}<h3 id="credits-title" className="text-xl font-semibold text-fg">{method.emoji} {method.name}</h3></div>
                <p className="ms-11 mt-1 text-[13px] text-fg-muted">{t('crdPayAmount', 'Montant à payer :')} <span className="font-semibold text-fg">{price(pack.price)}</span> · {packLabel(pack)}</p>
                {method.instructions?.length > 0 && (
                  <ol className="mt-5 list-inside list-decimal space-y-2 rounded-[var(--radius-md)] bg-surface-2 p-4 text-[13px] text-fg-muted">
                    {method.instructions.map((line, i) => <li key={i}>{fill(line)}</li>)}
                  </ol>
                )}
                {method.type === 'bank' && (
                  <dl className="mt-3 space-y-2 rounded-[var(--radius-md)] bg-surface-2 p-4 text-[13px]">
                    {[['coBeneficiary', 'Bénéficiaire', method.details?.beneficiary], ['', 'IBAN', method.details?.iban], ['', 'BIC/SWIFT', method.details?.bic], ['coIdNumber', "N° d'identifiant", method.details?.idNumber]]
                      .filter(([, , value]) => value)
                      .map(([key, fallback, value]) => (
                        <div key={fallback} className="flex justify-between gap-3"><dt className="text-fg-faint">{key ? t(key, fallback) : fallback}</dt><dd className="break-all text-fg" dir="ltr">{value}</dd></div>
                      ))}
                  </dl>
                )}
                {method.type === 'email' && method.details?.target && (
                  <p className="mt-3 rounded-[var(--radius-md)] bg-surface-2 p-4 text-[13px] text-fg-muted">{t('coEnvoieMontant', 'Envoie le montant à :')} <span className="font-medium text-fg" dir="ltr">{method.details.target}</span></p>
                )}

                <p className="mt-5 text-xs text-fg-faint">{t('coPreuvePaiement', 'Preuve de paiement')}</p>
                {proof ? (
                  <div className="mt-2 flex items-center gap-3 rounded-[var(--radius-md)] border border-success/30 bg-surface-2 p-3">
                    {proof.isImage ? <FileImage size={18} className="text-success-ink" /> : <FileText size={18} className="text-success-ink" />}
                    <span className="min-w-0 flex-1 truncate text-[13px] text-fg">{proof.name}</span>
                    <button type="button" onClick={() => setProof(null)} aria-label={t('crdRemoveProof', 'Retirer la preuve')} className="grid size-9 place-items-center rounded-lg text-fg-faint hover:text-danger-ink"><X size={14} /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()} className="mt-2 flex w-full flex-col items-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed border-line p-6 text-[13px] text-fg-muted transition-colors hover:border-primary/40">
                    <Upload size={18} className="text-fg-faint" />
                    {t('coCliqueUploaderPreuve', 'Clique pour uploader ta preuve')}
                    <span className="text-xs text-fg-faint">{t('coPdfImageMax5', 'PDF ou image · max 5 Mo')}</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={pickFile} className="hidden" />

                <button type="button" disabled={submitting} onClick={submit} className="btn-dz-primary mt-5 w-full disabled:pointer-events-none disabled:opacity-50">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {submitting ? t('coEnvoiCours', 'Envoi en cours...') : t('coJAiEffectuePaiement', "J'ai effectué le paiement")}
                </button>
              </div>
            )}

            {step === 'done' && (
              <div className="py-6 text-center">
                <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-warning/12"><Hourglass size={26} className="text-warning-ink" /></span>
                <h3 id="credits-title" className="text-xl font-semibold text-fg">{t('coEnAttenteDApprobation', "En attente d'approbation")}</h3>
                <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-fg-muted">{t('crdDoneText', 'Ta preuve est envoyée. Tes points seront ajoutés dès qu’un admin aura vérifié le paiement.')}</p>
                <button type="button" onClick={onClose} className="btn-dz-secondary mt-6">{t('coFermer', 'Fermer')}</button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
