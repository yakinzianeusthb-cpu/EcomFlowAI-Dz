import { useEffect, useState } from 'react';
import { Phone, Loader2, Save, Check } from 'lucide-react';
import { adminApi } from '../../services/admin';
import { AdminCard, Field, LoadingBlock, inputCls } from './AdminUI';
import RichText from '../../components/RichText';
import { useLanguage } from '../../context/LanguageContext';
import '../../i18n/admin';

interface ContactForm {
  whatsappNumber: string;
  adminTelegram: string;
  adminEmail: string;
}

export default function AdminContacts() {
  const { t } = useLanguage();
  const [form, setForm] = useState<ContactForm>({ whatsappNumber: '', adminTelegram: '', adminEmail: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      setForm(await adminApi.contactSettings());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const set = (patch: Partial<ContactForm>) => {
    setForm(f => ({ ...f, ...patch }));
    setSaved(false);
    setError('');
  };

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      await adminApi.updateContactSettings(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err?.message || t('admErreurLorsSauvegarde', 'Erreur lors de la sauvegarde.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminCard title={t('admCoordonneesContact', 'Coordonnées de contact')} icon={Phone}
      action={
        <button onClick={submit} disabled={saving} className="btn-dz-primary !px-4 !py-2 !text-[12px] flex items-center gap-1.5 disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? t('stgEnregistre', 'Enregistré') : t('admEnregistrer', 'Enregistrer')}
        </button>
      }
    >
      {loading ? (
        <LoadingBlock />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <Field label={t('admNumeroWhatsapp', 'Numéro WhatsApp')} hint={t('admFormatInternationalSansEx', 'Format international, sans « + » (ex : 213555000000). Laisse vide pour masquer le bouton WhatsApp.')}>
              <input
                className={inputCls}
                value={form.whatsappNumber}
                onChange={e => set({ whatsappNumber: e.target.value.replace(/[^0-9]/g, '') })}
                placeholder="213555000000"
                maxLength={15}
                inputMode="numeric"
              />
            </Field>

            <Field label={t('admTelegramUsername', 'Telegram (username)')} hint={t('admNomDUtilisateurUtilise', "Nom d'utilisateur utilisé dans les liens t.me/…")}>
              <input
                className={inputCls}
                value={form.adminTelegram}
                onChange={e => set({ adminTelegram: e.target.value })}
                placeholder="DzAdsAdmin"
                maxLength={64}
              />
            </Field>

            <Field label={t('admEmailContact', 'Email de contact')} hint={t('admAdresseEmailUtiliseePaiements', 'Adresse email utilisée pour les paiements et le support.')}>
              <input
                className={inputCls}
                value={form.adminEmail}
                onChange={e => set({ adminEmail: e.target.value })}
                placeholder="admin@dzads.ai"
                maxLength={128}
                type="email"
              />
            </Field>

            {error && <p className="text-red-400 text-[12px]">{error}</p>}
          </div>

          <div className="text-fg-muted text-[13px] leading-relaxed">
            <p className="mb-3">
              {t('admCesCoordonneesSontPropagees', 'Ces coordonnées sont propagées dans toute la plateforme, notamment dans le checkout pour finaliser les paiements.')}
            </p>
            <ul className="list-disc ps-5 space-y-1">
              <li><RichText text={t('admContactsWhatsapp', '**WhatsApp** — bouton de contact (wa.me) du checkout.')} strongClassName="font-normal" /></li>
              <li><RichText text={t('admContactsTelegram', '**Telegram** — lien t.me/… du checkout.')} strongClassName="font-normal" /></li>
              <li><RichText text={t('admContactsEmail', '**Email** — cible de paiement par défaut et email de support.')} strongClassName="font-normal" /></li>
            </ul>
          </div>
        </div>
      )}
    </AdminCard>
  );
}
