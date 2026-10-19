import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Send, Loader2, BadgeCheck, CreditCard, Upload, FileImage, FileText, ArrowRight, ArrowLeft, Copy, CheckCircle2, MessageCircle, Hourglass } from 'lucide-react';
import { useAuth, PlanId } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { hasActivePlan } from '../lib/access';
import { fileToUploadDataUrl } from '../lib/imageCompress';
import RichText from './RichText';
import { useCountdown } from '../lib/countdown';
import { useToast } from '../context/ToastContext';
import { contentApi, type PaymentMethod } from '../services/admin';
import { PLAN_ICON, buildPlans, usePricing } from '../lib/pricing';
import { useLanguage } from '../context/LanguageContext';
import '../i18n/checkout';
import { formatDate } from '../i18n/dates';

type Step = 'plan' | 'method' | 'payment' | 'done';

// Photos are shrunk before upload, so the limit for them only has to stop absurd files.
// Documents (PDF) are uploaded as they are and must fit the server's 5 MB proof limit.
const MAX_PROOF_PHOTO_BYTES = 25 * 1024 * 1024;
const MAX_PROOF_DOCUMENT_BYTES = 5 * 1024 * 1024;

interface PlanCheckoutProps {
  open: boolean;
  initialPlan?: PlanId | null;
  onClose: () => void;
}

export default function PlanCheckout({ open, initialPlan = null, onClose }: PlanCheckoutProps) {
  const { t, tf, language } = useLanguage();
  const toast = useToast();
  const { user, selectPlan } = useAuth();
  // Live countdown for an active subscription (ticks every second).
  // Only tick while the dialog is open: it is always mounted, so an idle 1 Hz timer would re-render it forever.
  const planCountdown = useCountdown(open && user?.planExpiresAt ? new Date(user.planExpiresAt).getTime() : null);
  const [step, setStep] = useState<Step>('plan');
  const [selected, setSelected] = useState<PlanId | null>(initialPlan);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  // The proof exactly as it will be uploaded: photos are shrunk first (see lib/imageCompress.ts).
  const [proofData, setProofData] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState('admin@dzads.ai');
  const [adminTelegram, setAdminTelegram] = useState('DzAdsAdmin');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prices + currency come from the server (admin-editable PlatformConfig).
  const pricing = usePricing();
  const plans = useMemo(() => buildPlans(pricing, tf), [pricing, language]);

  useEffect(() => {
    if (open) {
      setSelected(initialPlan);
      setStep(initialPlan ? 'method' : 'plan');
      setSelectedMethod(null);
      setProofFile(null);
      setProofPreview(null);
      setProofData(null);
      setCopied(null);
      // Load admin contacts
      fetch('/api/config')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d) {
            setAdminEmail(d.adminEmail);
            setAdminTelegram(d.adminTelegram);
            setWhatsappNumber(d.whatsappNumber || '');
          }
        })
        .catch(() => {});
      // Load DB-backed payment methods
      setMethodsLoading(true);
      contentApi
        .paymentMethods()
        .then((ms) => setPaymentMethods(ms))
        .catch(() => setPaymentMethods([]))
        .finally(() => setMethodsLoading(false));
    }
  }, [open, initialPlan]);

  const plan = plans.find((p) => p.id === selected) || null;
  const methodName = selectedMethod?.name || t('coPaymentFallback', 'Paiement');
  const paymentMessage = encodeURIComponent(t(
    'coPaidMessage',
    "Bonjour, je viens de payer le plan {plan} ({price}) via {method}.\n\nMon compte : {email}\nJ'attends la vérification de mon paiement.",
    { plan: plan?.label ?? '', price: plan?.price ?? '', method: methodName, email: user?.email || '' },
  ));
  const methodTarget = selectedMethod?.details?.target || adminEmail;

  const fillInstructions = (stepText: string) =>
    stepText
      .replace('{amount}', plan?.price || '')
      .replace('{target}', methodTarget)
      .replace('{plan}', plan?.label || '');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Photos are shrunk before upload, so only absurdly large ones are refused; PDFs are sent as they are.
    const isImage = file.type.startsWith('image/');
    if (file.size > (isImage ? MAX_PROOF_PHOTO_BYTES : MAX_PROOF_DOCUMENT_BYTES)) {
      toast.error(t('coFichierTropVolumineuxMax', 'Fichier trop volumineux (max 5 Mo).'));
      return;
    }
    try {
      const data = await fileToUploadDataUrl(file);
      setProofFile(file);
      setProofData(data);
      setProofPreview(isImage ? data : null);
    } catch {
      toast.error(t('coFichierIllisibleChoisisAutre', 'Fichier illisible. Choisis une autre image.'));
    }
  };

  const handleSubmitPayment = async () => {
    if (!selected || !selectedMethod) return;
    // Proof is mandatory — without it the admin has nothing to verify.
    if (!proofFile || !proofData) {
      toast.error(t('coVeuillezJoindrePreuvePaiement', 'Veuillez joindre une preuve de paiement.'));
      return;
    }
    setSubmitting(true);
    try {
      await selectPlan(selected);

      // Store payment proof via API — surface any failure so the user can retry.
      const res = await fetch('/api/user/payment-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proof: proofData, method: selectedMethod.code }),
      });
      if (!res.ok) {
        let message = t('coProofSendFailed');
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch { /* ignore */ }
        throw new Error(message);
      }

      setStep('done');
      toast.success(t('coPaiementEnregistreAttenteVerif', 'Paiement enregistré — en attente de vérification.'));
    } catch (err: any) {
      toast.error(err?.message || t('authErrGeneric', 'Une erreur est survenue.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  // Active subscription
  if (hasActivePlan(user) && user?.plan) {
    const active = plans.find((p) => p.id === user.plan);
    // Admin-granted custom plans aren't in the static plans list — label them from planDays.
    const planLabel = active?.label || (user.planDays ? t('coDays', undefined, { days: user.planDays }) : t('coCustomPlan'));
    const PlanIcon = PLAN_ICON[user.plan] ?? PLAN_ICON.custom;
    return (
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="relative w-full max-w-md surface-card rounded-2xl p-8 text-center"
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={onClose} className="absolute top-4 end-4 p-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-fg/10 transition-colors" aria-label={t('coFermer', 'Fermer')}>
                <X size={18} />
              </button>
              <div className="mx-auto w-14 h-14 rounded-2xl bg-dz-emerald/15 border border-dz-emerald/40 flex items-center justify-center mb-4">
                <BadgeCheck size={28} className="text-dz-emerald" />
              </div>
              <h3 className="font-display text-xl font-bold mb-1">{t('coPlanActif', 'Plan actif')}</h3>
              <p className="text-fg-muted text-sm mb-4">{t('coVotreAbonnementEstCours', 'Votre abonnement est en cours.')}</p>
              <div className="surface-card p-4 border-dz-emerald/30">
                <div className="flex items-center justify-center gap-2 font-display font-bold text-lg">
                  <PlanIcon size={18} className="text-primary-ink" />
                  <span className="text-dz-emerald">{planLabel}</span>
                </div>
                <p className="text-xs text-fg-muted mt-1">
                  {user.planExpiresAt
                    ? t('coExpiresOn', 'Expire le {date}', { date: formatDate(user.planExpiresAt, language) })
                    : t('sidebarSubLifetime', 'Accès à vie')}
                </p>
                {user.planExpiresAt && !planCountdown.expired && (
                  <p className="text-lg font-bold text-dz-emerald tabular-nums mt-2">
                    {t('coCountdown', '{days}j {hours}h {minutes}min {seconds}s', {
                      days: planCountdown.days,
                      hours: String(planCountdown.hours).padStart(2, '0'),
                      minutes: String(planCountdown.minutes).padStart(2, '0'),
                      seconds: String(planCountdown.seconds).padStart(2, '0'),
                    })}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-lg my-8"
            initial={{ scale: 0.96, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="surface-card rounded-2xl p-6 sm:p-8 relative">
              <button onClick={onClose} className="absolute top-4 end-4 p-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-fg/10 transition-colors" aria-label={t('coFermer', 'Fermer')}>
                <X size={18} />
              </button>

              {/* Step indicator */}
              {step !== 'done' && (
                <div className="flex items-center justify-center gap-2 mb-6">
                  {(['plan', 'method', 'payment'] as Step[]).map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                        (step === 'plan' && i === 0) || (step === 'method' && i <= 1) || (step === 'payment' && i <= 2)
                          ? 'bg-primary text-white'
                          : i < ['plan', 'method', 'payment'].indexOf(step)
                            ? 'bg-dz-emerald/20 text-dz-emerald'
                            : 'bg-fg/5 text-fg-faint border border-fg/10'
                      )}>
                        {i < ['plan', 'method', 'payment'].indexOf(step) ? <Check size={12} strokeWidth={3} /> : i + 1}
                      </div>
                      {i < 2 && <div className={cn('w-8 h-px', i < ['plan', 'method', 'payment'].indexOf(step) ? 'bg-dz-emerald/40' : 'bg-fg/10')} />}
                    </div>
                  ))}
                </div>
              )}

              <AnimatePresence mode="wait">
                {/* STEP 1: Select Plan */}
                {step === 'plan' && (
                  <motion.div key="plan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="font-display text-xl font-bold mb-1">{t('coChoisirPlan', 'Choisir un plan')}</h3>
                    <p className="text-fg-muted text-sm mb-5">{t('coSelectionneLOffreQui', "Sélectionne l'offre qui te convient.")}</p>

                    <div className="grid gap-3 sm:grid-cols-3 mb-5">
                      {plans.map((p) => {
                        const isSel = selected === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelected(p.id)}
                            className={cn(
                              'relative rounded-xl border p-4 text-start transition-colors cursor-pointer',
                              isSel ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : 'border-line bg-surface-2 hover:border-line-strong'
                            )}
                          >
                            {p.popular && (
                              <span className="absolute -top-2.5 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 text-xs font-semibold bg-primary text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                                {t('planRecommended', 'Recommandé')}
                              </span>
                            )}
                            <p className="text-xs text-fg-muted">{p.tagline}</p>
                            <p className="mt-1 flex items-center gap-1.5 text-lg font-bold">{(() => { const I = PLAN_ICON[p.id]; return <I size={16} className="text-primary-ink" />; })()} {p.label}</p>
                            <p className="font-display font-bold text-xl text-dz-dinar mt-1.5">
                              {p.price}
                            </p>
                            <div className="flex items-center gap-1.5 mt-2">
                              <span className={cn('w-3.5 h-3.5 rounded-full border flex items-center justify-center', isSel ? 'bg-primary border-primary' : 'border-fg/30')}>
                                {isSel && <Check size={9} className="text-white" strokeWidth={4} />}
                              </span>
                              <span className="text-xs text-fg-muted">{p.per}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={!selected}
                      onClick={() => setStep('method')}
                      className="btn-dz-primary w-full disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {t('fpContinue', 'Continuer')} <ArrowRight size={16} />
                    </button>
                  </motion.div>
                )}

                {/* STEP 2: Choose Payment Method */}
                {step === 'method' && (
                  <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="flex items-center gap-2 mb-1">
                      <button onClick={() => setStep('plan')} className="p-1 rounded-lg text-fg-faint hover:text-fg-muted hover:bg-fg/5 transition-colors cursor-pointer">
                        <ArrowLeft size={16} />
                      </button>
                      <h3 className="font-display text-xl font-bold">{t('coModePaiement', 'Mode de paiement')}</h3>
                    </div>
                    <p className="text-fg-muted text-sm mb-5 ms-7">
                      <RichText text={t('coPlanLine', undefined, { label: plan?.label ?? '', price: plan?.price ?? '' })} strongClassName="text-dz-dinar font-semibold" />
                    </p>

                    {methodsLoading ? (
                      <div className="py-10 text-center"><Loader2 size={22} className="mx-auto text-fg-faint animate-spin" /></div>
                    ) : paymentMethods.length === 0 ? (
                      <div className="py-10 text-center">
                        <CreditCard size={22} className="mx-auto text-fg-faint mb-2" />
                        <p className="text-[13px] text-fg-muted">{t('coAucuneMethodePaiementDisponibl', 'Aucune méthode de paiement disponible pour le moment.')}</p>
                        <p className="text-xs text-fg-faint mt-1">{t('coContactToFinish', undefined, { email: adminEmail })}</p>
                      </div>
                    ) : (
                      <div className="space-y-3 mb-5">
                        {paymentMethods.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => { setSelectedMethod(m); setStep('payment'); }}
                            className={cn(
                              'w-full flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer text-start',
                              selectedMethod?.id === m.id
                                ? 'bg-dz-emerald/5 border-dz-emerald/40'
                                : 'bg-fg/[0.02] border-fg/[0.06] hover:border-fg/[0.12] hover:bg-fg/[0.04]'
                            )}
                          >
                            <div className="w-12 h-12 rounded-xl bg-fg/[0.04] border border-fg/[0.1] flex items-center justify-center text-2xl shrink-0">
                              {m.emoji || '💳'}
                            </div>
                            <div className="flex-1">
                              <p className="font-display font-semibold text-[15px] text-fg">{m.name}</p>
                              <p className="text-[12px] text-fg-muted mt-0.5">{m.description}</p>
                            </div>
                            <ArrowRight size={16} className="text-fg-faint" />
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* STEP 3: Payment + Upload Proof */}
                {step === 'payment' && selectedMethod && (
                  <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="flex items-center gap-2 mb-1">
                      <button onClick={() => setStep('method')} className="p-1 rounded-lg text-fg-faint hover:text-fg-muted hover:bg-fg/5 transition-colors cursor-pointer">
                        <ArrowLeft size={16} />
                      </button>
                      <h3 className="font-display text-xl font-bold">
                        {selectedMethod.emoji} {methodName}
                      </h3>
                    </div>
                    <p className="text-fg-muted text-sm mb-5 ms-7">
                      <RichText text={t('coPlanLineBold', undefined, { label: plan?.label ?? '', price: plan?.price ?? '' })} strongClassName="text-dz-dinar font-semibold" />
                    </p>

                    {/* Generic instructions */}
                    {selectedMethod.instructions?.length > 0 && (
                      <div className="rounded-2xl bg-fg/[0.03] border border-fg/[0.06] p-4 mb-4">
                        <p className="text-xs text-fg-faint mb-3">{t('coInstructionsPaiement', 'Instructions de paiement')}</p>
                        <ol className="space-y-2 text-[13px] text-fg-muted list-decimal list-inside">
                          {selectedMethod.instructions.map((s, i) => (
                            <li key={i}>{fillInstructions(s)}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Bank details block */}
                    {selectedMethod.type === 'bank' && (
                      <div className="rounded-2xl bg-fg/[0.03] border border-fg/[0.06] p-4 mb-4">
                        <p className="text-xs text-fg-faint mb-3">{t('coInformationsBancaires', 'Informations bancaires')}</p>
                        <div className="space-y-3">
                          {[
                            { label: t('coBeneficiary'), value: selectedMethod.details?.beneficiary, key: 'beneficiary' },
                            { label: 'IBAN', value: selectedMethod.details?.iban, key: 'iban' },
                            { label: 'BIC/SWIFT', value: selectedMethod.details?.bic, key: 'bic' },
                            { label: t('coIdNumber'), value: selectedMethod.details?.idNumber, key: 'idNumber' },
                          ].filter(r => r.value).map(r => (
                            <div key={r.key} className="flex items-center justify-between p-3 rounded-xl bg-fg/[0.04] border border-fg/[0.06]">
                              <div>
                                <p className="text-xs text-fg-faint">{r.label}</p>
                                <p className={cn('text-sm text-fg mt-0.5', r.key === 'iban' && '')}>{r.value}</p>
                              </div>
                              <button onClick={() => handleCopy(r.value, r.key)} className="p-1.5 rounded-lg hover:bg-fg/[0.06] transition-colors">
                                {copied === r.key ? <CheckCircle2 size={14} className="text-dz-emerald" /> : <Copy size={14} className="text-fg-faint" />}
                              </button>
                            </div>
                          ))}
                          <div className="flex items-center justify-between p-3 rounded-xl bg-fg/[0.04] border border-fg/[0.06]">
                            <div>
                              <p className="text-xs text-fg-faint">{t('coMontant', 'Montant')}</p>
                              <p className="text-lg text-dz-dinar font-bold font-display mt-0.5">{plan?.price}</p>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-fg-faint mt-3">
                          <RichText text={t('coBankReference')} strongClassName="font-normal text-fg-muted" />
                        </p>
                      </div>
                    )}

                    {/* Email target block */}
                    {selectedMethod.type === 'email' && (
                      <div className="rounded-2xl bg-fg/[0.03] border border-fg/[0.06] p-4 mb-4">
                        <p className="text-xs text-fg-faint mb-3">{t('coEnvoieMontant', 'Envoie le montant à :')}</p>
                        <div className="p-3 rounded-xl bg-fg/[0.04] border border-fg/[0.06] flex items-center justify-between">
                          <span className="text-sm text-fg">{methodTarget}</span>
                          <button onClick={() => handleCopy(methodTarget, 'target')} className="p-1.5 rounded-lg hover:bg-fg/[0.06] transition-colors">
                            {copied === 'target' ? <CheckCircle2 size={14} className="text-dz-emerald" /> : <Copy size={14} className="text-fg-faint" />}
                          </button>
                        </div>
                        <p className="text-xs text-fg-faint mt-2"><RichText text={t('coEmailSubject', undefined, { label: plan?.label ?? '' })} strongClassName="font-normal text-fg-muted" /></p>
                      </div>
                    )}

                    {/* Upload Proof */}
                    <div className="mb-5">
                      <p className="text-xs text-fg-faint mb-3">{t('coPreuvePaiement', 'Preuve de paiement')}</p>

                      {proofFile ? (
                        <div className="rounded-2xl bg-fg/[0.03] border border-dz-emerald/30 p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-dz-emerald/10 flex items-center justify-center shrink-0">
                              {proofFile.type.startsWith('image/') ? (
                                <FileImage size={18} className="text-dz-emerald" />
                              ) : (
                                <FileText size={18} className="text-dz-emerald" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] text-fg font-medium truncate">{proofFile.name}</p>
                              <p className="text-xs text-fg-faint">{(proofFile.size / 1024).toFixed(0)} Ko</p>
                            </div>
                            <button
                              onClick={() => { setProofFile(null); setProofPreview(null); setProofData(null); }}
                              className="p-1.5 rounded-lg text-fg-faint hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          {proofPreview && (
                            <img src={proofPreview} alt={t('coApercu', 'Aperçu')} className="mt-3 rounded-xl max-h-40 w-full object-cover border border-fg/[0.06]" />
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full rounded-2xl border-2 border-dashed border-fg/[0.08] hover:border-dz-emerald/30 p-6 flex flex-col items-center gap-2 transition-all cursor-pointer group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-fg/[0.04] border border-fg/[0.06] flex items-center justify-center group-hover:border-dz-emerald/30 transition-colors">
                            <Upload size={18} className="text-fg-faint group-hover:text-dz-emerald transition-colors" />
                          </div>
                          <p className="text-[13px] text-fg-muted group-hover:text-fg-muted transition-colors">
                            {t('coCliqueUploaderPreuve', 'Clique pour uploader ta preuve')}
                          </p>
                          <p className="text-xs text-fg-faint">{t('coPdfImageMax5', 'PDF ou image · max 5 Mo')}</p>
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmitPayment}
                      className="btn-dz-primary w-full disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      {submitting ? t('coEnvoiCours', 'Envoi en cours...') : t('coJAiEffectuePaiement', "J'ai effectué le paiement")}
                    </button>
                  </motion.div>
                )}

                {/* STEP 4: Done — payment recorded, waiting for admin approval */}
                {step === 'done' && (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-dz-gold/15 border border-dz-gold/40 flex items-center justify-center mb-4">
                      <Hourglass size={26} className="text-dz-gold" />
                    </div>
                    <h3 className="font-display text-xl font-bold mb-2">{t('coEnAttenteDApprobation', "En attente d'approbation")}</h3>
                    <p className="text-fg-muted text-sm leading-relaxed max-w-sm mx-auto mb-3">
                      <RichText text={t('coProofReceived')} strongClassName="text-dz-gold font-semibold" />
                    </p>
                    <p className="text-fg-faint text-[12px] leading-relaxed max-w-xs mx-auto mb-6">
                      {t('coTonAccesSeraDebloque', "Ton accès sera débloqué automatiquement dès l'approbation. Merci de patienter.")}
                    </p>

                    {/* Contact admin if needed */}
                    <p className="text-xs text-fg-faint mb-2">
                      {t('coUneQuestion', 'Une question ?')}
                    </p>
                    <div className="flex items-center justify-center gap-2.5">
                      {whatsappNumber && (
                        <a
                          href={`https://wa.me/${whatsappNumber}?text=${paymentMessage}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 px-3 py-1.5 text-xs font-semibold text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                        >
                          <MessageCircle size={12} /> WhatsApp
                        </a>
                      )}
                      <a
                        href={`https://t.me/${adminTelegram}?text=${paymentMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-[#0088CC]/10 border border-[#0088CC]/30 px-3 py-1.5 text-xs font-semibold text-[#0088CC] hover:bg-[#0088CC]/20 transition-colors"
                      >
                        <Send size={12} /> Telegram
                      </a>
                    </div>

                    <button onClick={onClose} className="mt-5 text-[12px] text-fg-faint hover:text-fg-muted transition-colors cursor-pointer">
                      {t('coFermer', 'Fermer')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
