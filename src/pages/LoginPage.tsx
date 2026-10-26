import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import AuthLayout from './AuthLayout';
import GoogleG from '../components/GoogleG';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import { useDocumentMeta } from '../lib/useDocumentMeta';

export default function LoginPage() {
  const { loginWithEmail, login } = useAuth();
  const { t } = useLanguage();
  useDocumentMeta({ title: t('metaTitleLogin', 'Connexion — EcomFlow AI') });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetSuccess = searchParams.get('reset') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; submit?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = t('authErrFill', 'Remplis tous les champs.');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = t('authErrEmail', 'Adresse email invalide.');
    if (!password) e.password = t('authErrFill', 'Remplis tous les champs.');
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
      const res = await loginWithEmail(email.trim(), password);
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
      title={t('authLoginTitle', 'Bienvenue 👋')}
      subtitle={t('authLoginSubtitle', 'Connecte-toi à ton espace e-commerce.')}
      footer={
        <p>
          {t('authNoAccount', 'Pas encore de compte ?')}{' '}
          <Link to="/register" className="font-bold text-dz-emerald hover:text-dz-gold transition-colors">
            {t('authCreateAccount', 'Créer un compte')}
          </Link>
        </p>
      }
    >
      {resetSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-dz-emerald/30 bg-dz-emerald/10 px-3.5 py-2.5 text-[12.5px] text-dz-emerald mb-4"
        >
          {t('fpResetSuccess', 'Mot de passe réinitialisé ! Connecte-toi avec ton nouveau mot de passe.')}
        </motion.div>
      )}

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
            {t('authEmail', 'Adresse email')}
          </label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => email && setErrors((prev) => ({ ...prev, email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? t('authErrEmail', 'Adresse email invalide.') : undefined }))}
            placeholder={t('authEmailPlaceholder', 'you@example.com')}
            className={`input-dz ${errors.email ? 'border-rose-500/60 focus:border-rose-500/60 focus:ring-rose-500/10' : ''}`}
          />
          {errors.email && (
            <p className="mt-1.5 text-[12px] text-rose-400">{errors.email}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-fg-muted">
              {t('authPassword', 'Mot de passe')}
            </label>
            <Link to="/forgot-password" className="text-[12px] font-semibold text-dz-emerald hover:text-dz-gold transition-colors">
              {t('authForgotPassword', 'Mot de passe oublié ?')}
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`input-dz pe-10 ${errors.password ? 'border-rose-500/60 focus:border-rose-500/60 focus:ring-rose-500/10' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-fg-faint hover:text-fg transition-colors cursor-pointer"
              tabIndex={-1}
              aria-label={showPw ? t('authHidePw', 'Masquer') : t('authShowPw', 'Afficher')}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-[12px] text-rose-400">{errors.password}</p>
          )}
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
          {submitting ? t('authPleaseWait', 'Envoi du code…') : t('authLoginBtn', 'Se connecter')}
        </button>

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
