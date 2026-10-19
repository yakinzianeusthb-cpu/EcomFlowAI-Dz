import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import AuthLayout from './AuthLayout';
import GoogleG from '../components/GoogleG';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import TextWithSlots from '../components/TextWithSlots';

export default function RegisterPage() {
  const { register, login } = useAuth();
  const { t } = useLanguage();
  useDocumentMeta({ title: t('metaTitleRegister', 'Créer un compte — EcomFlow AI') });
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t('authErrName', 'Entre ton nom.');
    if (!email.trim()) e.email = t('authErrFill', 'Remplis tous les champs.');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = t('authErrEmail', 'Adresse email invalide.');
    if (!password) e.password = t('authErrFill', 'Remplis tous les champs.');
    else if (password.length < 8) e.password = t('authPwShort', 'Le mot de passe doit contenir au moins 8 caractères.');
    if (password !== confirm) e.confirm = t('authPwMismatch', 'Les mots de passe ne correspondent pas.');
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length > 0) {
      setErrors(v);
      setShakeKey((k) => k + 1);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await register(name.trim(), email.trim(), password);
      sessionStorage.setItem('dz_pending_email', res.email);
      sessionStorage.setItem('dz_pending_mode', res.mode);
      sessionStorage.setItem('dz_pending_expires', String(res.expiresInSec));
      sessionStorage.setItem('dz_pending_dev', String(Boolean(res.dev)));
      navigate('/verify', { replace: true });
    } catch (err: any) {
      setErrors({ submit: err.message || t('authErrGeneric', 'Une erreur est survenue.') });
      setShakeKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={t('authRegisterTitle', 'Créer un compte')}
      subtitle={t('authRegisterSubtitle', 'Le compte est gratuit. Ensuite, tu choisis un plan et tu ajoutes ta clé Gemini pour générer.')}
      footer={
        <p>
          {t('authHaveAccount', 'Déjà un compte ?')}{' '}
          <Link to="/login" className="font-bold text-dz-emerald hover:text-dz-gold transition-colors">
            {t('authSignIn', 'Se connecter')}
          </Link>
        </p>
      }
    >
      <motion.form
        onSubmit={handleSubmit}
        className="space-y-4"
        noValidate
        animate={shakeKey > 0 ? { x: [0, -6, 6, -3, 3, 0] } : undefined}
        transition={{ duration: 0.4 }}
        key={shakeKey}
      >
        <div>
          <label className="block text-xs text-fg-muted mb-1.5">
            {t('authName', 'Nom complet')}
          </label>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('authNamePlaceholder', 'Ahmed Benali')}
            className={`input-dz ${errors.name ? 'border-rose-500/60' : ''}`}
          />
          {errors.name && <p className="mt-1.5 text-[12px] text-rose-400">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs text-fg-muted mb-1.5">
            {t('authEmail', 'Adresse email')}
          </label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('authEmailPlaceholder', 'you@example.com')}
            className={`input-dz ${errors.email ? 'border-rose-500/60' : ''}`}
          />
          {errors.email && <p className="mt-1.5 text-[12px] text-rose-400">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-xs text-fg-muted mb-1.5">
            {t('authPassword', 'Mot de passe')}
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('authPwPlaceholder', 'At least 8 characters')}
              className={`input-dz pe-10 ${errors.password ? 'border-rose-500/60' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-fg-faint hover:text-fg transition-colors cursor-pointer"
              aria-label={showPw ? t('authHidePw', 'Masquer') : t('authShowPw', 'Afficher')}
              tabIndex={-1}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {password && <PasswordStrengthMeter password={password} className="mt-2" />}
          {errors.password && <p className="mt-1.5 text-[12px] text-rose-400">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-xs text-fg-muted mb-1.5">
            {t('authConfirmPassword', 'Confirmer le mot de passe')}
          </label>
          <input
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className={`input-dz ${errors.confirm ? 'border-rose-500/60' : ''}`}
          />
          {errors.confirm && <p className="mt-1.5 text-[12px] text-rose-400">{errors.confirm}</p>}
        </div>

        {errors.submit && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-[12.5px] text-rose-300">
            {errors.submit}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-dz-primary w-full disabled:opacity-60 disabled:pointer-events-none"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
          {submitting ? t('authPleaseWait', 'Envoi du code…') : t('authRegisterBtn', 'Créer mon compte')}
        </button>

        <p className="text-center text-xs text-fg-faint">
          <TextWithSlots
            text={t('authTerms', 'En créant un compte, tu acceptes les {terms} et la {privacy}.')}
            slots={{
              terms: (
                <Link to="/terms" target="_blank" className="font-medium text-fg-muted underline underline-offset-2 hover:text-fg">
                  {t('legalTermsLink', "conditions d'utilisation")}
                </Link>
              ),
              privacy: (
                <Link to="/privacy" target="_blank" className="font-medium text-fg-muted underline underline-offset-2 hover:text-fg">
                  {t('legalPrivacyLink', 'politique de confidentialité')}
                </Link>
              ),
            }}
          />
        </p>

        <div className="flex items-center gap-3 text-xs text-fg-faint">
          <span className="h-px flex-1 bg-fg/10" />
          {t('authOr', 'ou')}
          <span className="h-px flex-1 bg-fg/10" />
        </div>

        <button
          type="button"
          onClick={login}
          className="btn-dz-secondary w-full"
        >
          <GoogleG size={16} />
          {t('authGoogle', 'Continuer avec Google')}
        </button>
      </motion.form>
    </AuthLayout>
  );
}
