import { useCallback, useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Link2, Link2Off, Loader2, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../i18n/dates';
import { metaApi, type MetaStatus } from '../../services/campaigns';
import { StatusChip } from '../ui/primitives';
import '../../i18n/campaigns';

/** Meta's status for this account, reloadable. */
export function useMetaStatus() {
  const [status, setStatus] = useState<MetaStatus | null>(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(() => {
    setFailed(false);
    metaApi.status().then(setStatus).catch(() => setFailed(true));
  }, []);
  useEffect(load, [load]);
  return { status, failed, reload: load };
}

/** After Meta's login sends the browser back (?meta=...), says how it went and tidies the address. */
export function useMetaReturnNotice(onConnected?: () => void) {
  const { t } = useLanguage();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const outcome = params.get('meta');
  useEffect(() => {
    if (!outcome) return;
    if (outcome === 'connected') {
      toast.success(t('metaConnectedToast', 'Compte Meta connecté.'));
      onConnected?.();
    } else if (outcome === 'denied') toast.error(t('metaDeniedToast', 'Connexion Meta annulée.'));
    else if (outcome === 'unavailable') toast.error(t('metaUnavailableToast', 'La connexion Meta n’est pas encore configurée sur ce site.'));
    else toast.error(t('metaFailedToast', 'La connexion Meta a échoué. Réessaie.'));
    const next = new URLSearchParams(params);
    next.delete('meta');
    setParams(next, { replace: true });
  }, [outcome]); // once per outcome in the address
}

/** Connect / disconnect card, with an honest explanation when the site is not set up for Meta yet. */
export default function MetaConnection({ status, failed = false, reload, compact = false }: { status: MetaStatus | null; failed?: boolean; reload: () => void; compact?: boolean }) {
  const { t, language } = useLanguage();
  const toast = useToast();
  const location = useLocation();
  const [busy, setBusy] = useState(false);

  if (!status && failed) {
    return (
      <div role="alert" className="ui-card flex flex-wrap items-center gap-3 p-5 text-[13px] text-danger-ink">
        <span className="flex-1">{t('metaStatusFailed', 'Impossible de vérifier la connexion Meta.')}</span>
        <button type="button" onClick={reload} className="btn-dz-secondary !min-h-9 !py-1.5 !text-[13px]">{t('cmpRetry', 'Réessayer')}</button>
      </div>
    );
  }
  if (!status) {
    return (
      <div className="ui-card flex items-center gap-2 p-5 text-[13px] text-fg-muted">
        <Loader2 size={15} className="animate-spin" /> {t('metaChecking', 'Vérification de la connexion Meta…')}
      </div>
    );
  }

  const returnTo = `${location.pathname}${location.search}`;
  const disconnect = async () => {
    setBusy(true);
    try {
      await metaApi.disconnect();
      reload();
    } catch (err) {
      toast.error((err as Error).message || t('metaFailedToast', 'La connexion Meta a échoué. Réessaie.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="meta-title" className="ui-card p-5">
      <div className="flex flex-wrap items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[#0866ff]/12 text-[#3b82f6]" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor"><path d="M6.9 5C4.2 5 2 8.6 2 12.3 2 15.2 3.4 17 5.6 17c1.7 0 3-1 4.8-4l1.1-1.9.4.7 1.1 1.9c1.7 2.9 3 3.3 4.5 3.3 2.4 0 4.5-2.2 4.5-5.6C22 8.1 19.9 5 17.1 5c-1.6 0-2.9.9-4.4 3l-.7 1-.7-1C9.8 5.9 8.5 5 6.9 5Zm0 2.2c.9 0 1.7.6 2.9 2.4L8.7 11.4c-1.6 2.7-2.3 3.4-3.1 3.4-.9 0-1.4-.9-1.4-2.6 0-2.7 1.4-5 2.7-5Zm10.1 0c1.4 0 2.8 2.1 2.8 5 0 1.7-.7 2.6-1.6 2.6-.8 0-1.4-.5-2.7-2.6l-1.5-2.4c1.2-1.9 2-2.6 3-2.6Z" /></svg>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="meta-title" className="text-[15px] font-semibold text-fg">Meta · Facebook & Instagram</h2>
            {status.configured && (
              <StatusChip
                state={status.connected && !status.expired ? 'ready' : status.expired ? 'failed' : 'none'}
                label={status.connected && !status.expired ? t('metaConnected', 'Connecté') : status.expired ? t('metaExpired', 'Expiré') : t('metaNotConnected', 'Non connecté')}
              />
            )}
          </div>
          {!status.configured ? (
            <div className="mt-1.5 space-y-2 text-[13px] leading-relaxed text-fg-muted">
              <p>{t('metaNotConfiguredText', 'La publication directe sur Meta n’est pas encore activée sur ce site. En attendant, télécharge tes visuels et tes textes depuis l’onglet Publicités et importe-les dans le Gestionnaire de publicités Meta.')}</p>
              {status.missing && status.missing.length > 0 && (
                <p className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2 text-xs">
                  {t('metaAdminMissing', 'Réglages serveur manquants (visible par les admins) :')}{' '}
                  <code dir="ltr" className="text-fg">{status.missing.join(', ')}</code>
                </p>
              )}
            </div>
          ) : status.connected && !status.expired ? (
            <p className="mt-1.5 text-[13px] text-fg-muted">
              {t('metaConnectedAs', 'Connecté en tant que {name}.', { name: status.user?.name || '—' })}{' '}
              {status.expiresAt && t('metaExpiresOn', 'Accès valable jusqu’au {date}.', { date: formatDate(status.expiresAt, language, { dateStyle: 'medium' }) })}
            </p>
          ) : (
            <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">
              {status.expired
                ? t('metaExpiredText', 'L’accès donné par Meta a expiré. Reconnecte ton compte pour continuer à publier.')
                : t('metaConnectText', 'Connecte ton compte Meta pour créer tes campagnes directement depuis l’app. Tu choisiras le compte publicitaire et la Page à utiliser ; rien n’est publié sans ta confirmation.')}
            </p>
          )}
          {!compact && status.configured && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-fg-faint"><ShieldCheck size={13} /> {t('metaTokenSafe', 'Ton accès Meta est chiffré sur le serveur et n’est jamais envoyé au navigateur.')}</p>
          )}
        </div>
        {status.configured && (
          <div className="flex gap-2">
            {status.connected && !status.expired ? (
              <button type="button" onClick={disconnect} disabled={busy} className="btn-dz-secondary !min-h-9 !py-1.5 !text-[13px]">
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Link2Off size={15} />} {t('metaDisconnect', 'Déconnecter')}
              </button>
            ) : (
              <a href={metaApi.connectUrl(returnTo)} className="btn-dz-primary !min-h-9 !py-1.5 !text-[13px]">
                <Link2 size={15} /> {status.expired ? t('metaReconnect', 'Reconnecter Meta') : t('metaConnect', 'Connecter Meta')}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
