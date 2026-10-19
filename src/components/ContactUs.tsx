import { useState, useEffect } from 'react';
import { MessageCircle, Send, Mail, Loader2, Check, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { configApi, contactApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import PageHeader from './PageHeader';
import '../i18n/contact';

const SUBJECTS = [
  'Demande générale',
  'Facturation / Paiement',
  'Problème technique',
  'Autre',
];

export default function ContactUs() {
  const { user } = useAuth();
  const toast = useToast();
  const { t, tf } = useLanguage();

  const [config, setConfig] = useState<{ adminEmail: string; adminTelegram: string; whatsappNumber: string } | null>(null);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    configApi.get().then(setConfig).catch(() => {});
  }, []);

  // Pre-fill from auth when user loads
  useEffect(() => {
    if (user?.name && !name) setName(user.name);
    if (user?.email && !email) setEmail(user.email);
  }, [user]);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error(t('ctcVeuillezRemplirTousChamps', 'Veuillez remplir tous les champs.'));
      return;
    }
    if (message.trim().length < 10) {
      toast.error(t('ctcLeMessageDoitContenir', 'Le message doit contenir au moins 10 caractères.'));
      return;
    }
    setSending(true);
    try {
      await contactApi.send({ name: name.trim(), email: email.trim(), subject, message: message.trim() });
      setSent(true);
      toast.success(t('ctcMessageEnvoyeNousTe', 'Message envoyé ! Nous te répondrons rapidement.'));
      setTimeout(() => setSent(false), 3000);
      setMessage('');
    } catch (err: any) {
      toast.error(err?.message || t('ctcErreurLorsLEnvoi', "Erreur lors de l'envoi."));
    } finally {
      setSending(false);
    }
  };

  const whatsappUrl = config?.whatsappNumber
    ? `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(t('ctcWhatsappHello', "Bonjour, j'ai une question concernant EcomFlow AI."))}`
    : null;
  const telegramUrl = config?.adminTelegram
    ? `https://t.me/${config.adminTelegram}`
    : null;

  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader
        icon={MessageCircle}
        title={t('menuContact', 'Contact & support')}
        subtitle={t('ctcNousSommesTAider', "Nous sommes là pour t'aider. Écris-nous ou contacte-nous directement.")}
      />

      {/* Contact info cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* WhatsApp */}
        <a
          href={whatsappUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!whatsappUrl}
          tabIndex={whatsappUrl ? undefined : -1}
          className={`surface-card p-5 flex flex-col items-center gap-3 transition-all hover:border-[#25D366]/40 ${!whatsappUrl ? 'pointer-events-none border-dashed [&_svg]:opacity-50 [&_svg]:grayscale' : 'cursor-pointer'}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center">
            <MessageCircle size={22} className="text-[#25D366]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-fg">WhatsApp</p>
            <p className="text-xs text-fg-faint mt-0.5">
              {config?.whatsappNumber ? `+${config.whatsappNumber}` : t('ctcNonConfigure', 'Non configuré')}
            </p>
          </div>
          {whatsappUrl && <ExternalLink size={12} className="text-fg-faint" />}
        </a>

        {/* Telegram */}
        <a
          href={telegramUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!telegramUrl}
          tabIndex={telegramUrl ? undefined : -1}
          className={`surface-card p-5 flex flex-col items-center gap-3 transition-all hover:border-[#0088CC]/40 ${!telegramUrl ? 'pointer-events-none border-dashed [&_svg]:opacity-50 [&_svg]:grayscale' : 'cursor-pointer'}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#0088CC]/10 border border-[#0088CC]/20 flex items-center justify-center">
            <Send size={22} className="text-[#0088CC]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-fg">Telegram</p>
            <p className="text-xs text-fg-faint mt-0.5">
              {config?.adminTelegram ? `@${config.adminTelegram}` : t('ctcNonConfigure', 'Non configuré')}
            </p>
          </div>
          {telegramUrl && <ExternalLink size={12} className="text-fg-faint" />}
        </a>

        {/* Email */}
        <div className="surface-card p-5 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-dz-gold/10 border border-dz-gold/20 flex items-center justify-center">
            <Mail size={22} className="text-dz-gold" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-fg">{t('fpStepEmail', 'Email')}</p>
            <p className="text-xs text-fg-faint mt-0.5 break-all">
              {config?.adminEmail || t('ctcNonConfigure', 'Non configuré')}
            </p>
          </div>
        </div>
      </div>

      {/* Contact form */}
      <div className="surface-card p-6 sm:p-8">
        <h2 className="text-lg font-bold text-fg mb-1">{t('ctcEnvoyerMessage', 'Envoyer un message')}</h2>
        <p className="text-fg-faint text-sm mb-6">{t('ctcRemplisFormulaireCiDessous', 'Remplis le formulaire ci-dessous et nous te répondrons par email.')}</p>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-name" className="text-xs text-fg-muted block mb-1.5">{t('ctcName', 'Nom')}</label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('ctcTonNom', 'Ton nom')}
                className="w-full bg-fg/[0.02] border border-fg/10 rounded-xl px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-dz-emerald/70 focus:ring-4 focus:ring-dz-emerald/10 transition-all"
                maxLength={120}
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="text-xs text-fg-muted block mb-1.5">{t('fpStepEmail', 'Email')}</label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ton@email.com"
                className="w-full bg-fg/[0.02] border border-fg/10 rounded-xl px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-dz-emerald/70 focus:ring-4 focus:ring-dz-emerald/10 transition-all"
                maxLength={128}
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact-subject" className="text-xs text-fg-muted block mb-1.5">{t('ctcSujet', 'Sujet')}</label>
            <select
              id="contact-subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full bg-fg/[0.02] border border-fg/10 rounded-xl px-3.5 py-2.5 text-sm text-fg focus:outline-none focus:border-dz-emerald/70 focus:ring-4 focus:ring-dz-emerald/10 transition-all"
            >
              {SUBJECTS.map(s => (
                <option key={s} value={s} className="bg-[#121411]">{tf(s)}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="contact-message" className="text-xs text-fg-muted block mb-1.5">{t('ctcMessage', 'Message')}</label>
            <textarea
              id="contact-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t('ctcDecrisProblemeQuestion', 'Décris ton problème ou ta question…')}
              rows={5}
              className="w-full bg-fg/[0.02] border border-fg/10 rounded-xl px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-dz-emerald/70 focus:ring-4 focus:ring-dz-emerald/10 transition-all resize-none"
              maxLength={5000}
            />
            <p className="text-xs text-fg-faint mt-1 text-end">{message.length}/5000</p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={sending || sent}
            className="w-full sm:w-auto px-6 py-3 bg-primary text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_4px_20px_rgba(201,164,92,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            {sending ? (
              <><Loader2 size={16} className="animate-spin" /> {t('ctcEnvoi', 'Envoi…')}</>
            ) : sent ? (
              <><Check size={16} /> {t('ctcEnvoye', 'Envoyé !')}</>
            ) : (
              <><Send size={16} /> {t('ctcEnvoyerMessage2', 'Envoyer le message')}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
