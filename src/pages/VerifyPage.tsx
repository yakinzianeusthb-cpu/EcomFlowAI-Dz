import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Loader2, Mail, RefreshCw, TerminalSquare, CheckCircle2 } from 'lucide-react';
import AuthLayout from './AuthLayout';
import OtpInput from '../components/OtpInput';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import { useDocumentMeta } from '../lib/useDocumentMeta';

const CODE_LEN = 6;
const RESEND_COOLDOWN_S = 60;

export default function VerifyPage() {
  const { verifyOtp, resendOtp } = useAuth();
  const { t } = useLanguage();
  useDocumentMeta({ title: t('metaTitleVerify', 'Vérifier ton email — EcomFlow AI') });
  const navigate = useNavigate();

  const email = sessionStorage.getItem('dz_pending_email') || '';
  const mode = sessionStorage.getItem('dz_pending_mode') || 'verification';
  const dev = sessionStorage.getItem('dz_pending_dev') === 'true';

  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length: CODE_LEN }, () => ''),
  );
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);

  const code = digits.join('');

  // Resend countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // Auto-submit once all 6 digits are filled
  const didAutoSubmit = useRef(false);
  useEffect(() => {
    if (code.length === CODE_LEN && !submitting && !didAutoSubmit.current) {
      didAutoSubmit.current = true;
      handleVerify(code);
    }
  }, [code]);

  const handleVerify = async (codeToSend: string = code) => {
    if (codeToSend.length !== CODE_LEN) {
      setError(t('authErrCode', 'Entre le code complet à 6 chiffres.'));
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await verifyOtp(email, codeToSend);
      setSuccess(t('authVerified', 'Email vérifié ! Connexion…'));
      navigate('/app', { replace: true });
    } catch (err: any) {
      setError(err.message || t('authErrCodeInvalid', 'Code invalide ou expiré.'));
      setDigits(Array.from({ length: CODE_LEN }, () => ''));
      didAutoSubmit.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setCooldown(RESEND_COOLDOWN_S);
    try {
      const res = await resendOtp(email);
      sessionStorage.setItem('dz_pending_expires', String(res.expiresInSec));
      setSuccess(t('authResent', 'Nouveau code envoyé !'));
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || t('authErrGeneric', 'Une erreur est survenue.'));
    }
  };

  const handleChangeEmail = () => {
    sessionStorage.removeItem('dz_pending_email');
    sessionStorage.removeItem('dz_pending_mode');
    sessionStorage.removeItem('dz_pending_dev');
    sessionStorage.removeItem('dz_pending_expires');
    navigate('/login', { replace: true });
  };

  if (!email) {
    return <Navigate to="/login" replace />;
  }

  const maskEmail = email.replace(/^(.).*@/, (m, c) => `${c}•••@`);

  return (
    <AuthLayout
      title={t('authVerifyTitle', 'Vérifie ton email')}
      subtitle={
        <span className="flex items-center gap-1.5 flex-wrap">
          {t('authOtpSentTo', 'Code envoyé à')}{' '}
          <span className="font-bold text-dz-emerald">{maskEmail}</span>
        </span>
      }
      showBack={false}
      footer={
        <button
          type="button"
          onClick={handleChangeEmail}
          className="text-[12px] text-fg-muted hover:text-dz-amber transition-colors cursor-pointer font-semibold"
        >
          {t('authChangeEmail', "Ce n'est pas mon email — revenir")}
        </button>
      }
    >
      <div className="space-y-5">
        <OtpInput value={digits} onChange={setDigits} error={!!error} />

        {dev && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-300">
            <TerminalSquare size={14} className="shrink-0 mt-0.5" />
            <span>{t('authDevHint', 'Mode dév : le code est affiché dans la console du serveur.')}</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-[12.5px] text-rose-300">
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-dz-emerald/30 bg-dz-emerald/10 px-3.5 py-2.5 text-[12.5px] text-dz-emerald">
            <CheckCircle2 size={14} className="shrink-0" />
            {success}
          </div>
        )}

        <button
          type="button"
          onClick={() => handleVerify()}
          disabled={submitting || code.length !== CODE_LEN}
          className="btn-dz-primary w-full disabled:opacity-50 disabled:pointer-events-none"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
          {submitting ? t('authVerifying', 'Vérification…') : t('authVerifyBtn', 'Vérifier le code')}
        </button>

        <div className="flex items-center justify-center gap-2 text-[12px] text-fg-muted">
          <span>{t('authNoCode', "Tu n'as rien reçu ?")}</span>
          {cooldown > 0 ? (
            <span className="text-fg-faint">
              {t('authResendIn', 'Renvoyer dans')} {cooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="flex items-center gap-1 font-bold text-dz-emerald hover:text-fg transition-colors cursor-pointer"
            >
              <RefreshCw size={12} />
              {t('authResend', 'Renvoyer le code')}
            </button>
          )}
        </div>

        {mode === 'login' && (
          <p className="text-center text-xs text-fg-faint">
            {t('authLoginOtpNote', 'Code de connexion · valable 10 minutes')}
          </p>
        )}
      </div>
    </AuthLayout>
  );
}
