import { useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink, Globe, Loader2, Monitor, Smartphone, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import '../i18n/funnels';
import { escapeHtml } from '../lib/html';
import { buildLandingHtml, type LpSection } from '../lib/landingHtml';
import { sectionImagePrompt, type ImageSection } from '../lib/landingImages';
import { fileToUploadDataUrl } from '../lib/imageCompress';
import { generateSectionImage } from '../services/gemini';
import { cn } from '../lib/utils';

const WHATSAPP_KEY = 'dzads_lp_whatsapp';
const fileSlug = (name: string) =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'landing-page';

interface Props {
  lpData: { sections?: (LpSection & ImageSection)[]; colorPalette?: string[]; productName?: string };
  productName: string;
  photos: string[];
  /** The language chosen in the tool for the page copy. */
  language?: string;
  sectionImages?: (string | null)[];
  /** Price shown when the page opens (the campaign's price). */
  defaultPrice?: string;
}

/** The generated structure as a real landing page: live preview and a self-contained HTML file to publish. */
/** AI images come back as large PNGs; a 1080 px JPEG keeps the page light on phones. */
async function compressDataUrl(dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  return fileToUploadDataUrl(new File([blob], 'section.png', { type: blob.type || 'image/png' }), { maxDimension: 1080, quality: 0.82 });
}

export default function LandingPublisher({ lpData, productName, photos, language, sectionImages, defaultPrice }: Props) {
  const { t } = useLanguage();
  const [aiImages, setAiImages] = useState<(string | null)[]>(() => (lpData.sections ?? []).map((_, i) => sectionImages?.[i] ?? null));
  const [aiRunning, setAiRunning] = useState<number | null>(null);
  const [aiError, setAiError] = useState('');
  const [price, setPrice] = useState(defaultPrice ?? '');
  const [oldPrice, setOldPrice] = useState('');
  const [whatsapp, setWhatsapp] = useState(() => { try { return localStorage.getItem(WHATSAPP_KEY) ?? ''; } catch { return ''; } });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');

  useEffect(() => { try { localStorage.setItem(WHATSAPP_KEY, whatsapp); } catch { /* storage unavailable */ } }, [whatsapp]);

  const name = lpData.productName || productName;
  const html = useMemo(
    () => buildLandingHtml({ productName: name, language, sections: lpData.sections ?? [], colorPalette: lpData.colorPalette, photos, sectionImages: aiImages, price, oldPrice, whatsapp, webhookUrl }),
    [name, language, lpData.sections, lpData.colorPalette, photos, aiImages, price, oldPrice, whatsapp, webhookUrl],
  );
  const hasDestination = whatsapp.replace(/\D/g, '').length >= 9 || /^https:\/\//.test(webhookUrl.trim());

  const blobUrl = () => URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const download = () => {
    const url = blobUrl();
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileSlug(name)}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };
  // The full-page preview runs in a sandboxed frame, like the preview above: a page opened from a blob would
  // otherwise run on this site's origin, with the seller's session.
  const openTab = () => {
    const shell = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(name)}</title><style>html,body{margin:0;height:100%}iframe{display:block;border:0;width:100%;height:100%}</style></head><body><iframe sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox" srcdoc="${escapeHtml(html)}"></iframe></body></html>`;
    const url = URL.createObjectURL(new Blob([shell], { type: 'text/html;charset=utf-8' }));
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const makeImages = async () => {
    setAiError('');
    const sections = lpData.sections ?? [];
    for (let i = 0; i < sections.length; i++) {
      if (aiImages[i]) continue;
      setAiRunning(i);
      try {
        const image = await compressDataUrl(await generateSectionImage(sectionImagePrompt(sections[i]), photos[0]));
        setAiImages((prev) => prev.map((v, j) => (j === i ? image : v)));
      } catch (err) {
        const e = err as { message?: string; status?: number };
        setAiError(e?.message || t('shAiError', 'Erreur IA. Réessaie.'));
        // no billing, no key, no plan or no quota: the next sections would fail the same way
        if ([400, 402, 403, 429].includes(e?.status ?? 0)) break;
      }
    }
    setAiRunning(null);
  };
  const sectionCount = lpData.sections?.length ?? 0;
  const imagesReady = aiImages.filter(Boolean).length;

  const field = 'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <section className="space-y-6" aria-labelledby="lp-publisher-title">
      <div>
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-primary-ink" />
          <h4 id="lp-publisher-title" className="text-base font-semibold text-fg">{t('lppTitle', 'Ta landing page prête à publier')}</h4>
        </div>
        <p className="mt-1 text-sm text-fg-muted">{t('lppIntro', 'Une vraie page avec tes textes, tes photos, tes couleurs et un formulaire de commande (paiement à la livraison, 58 wilayas). Les commandes arrivent sur ton WhatsApp.')}</p>
        {photos.length === 0 && <p className="mt-2 text-xs text-warning-ink">{t('lppNoPhoto', "Ajoute des photos du produit dans le formulaire pour qu'elles apparaissent sur la page.")}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-fg-muted">
          {t('lppPrice', 'Prix affiché')}
          <input className={cn(field, 'mt-1.5')} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="2 900 DA" dir="ltr" />
        </label>
        <label className="block text-xs font-semibold text-fg-muted">
          {t('lppOldPrice', 'Ancien prix (barré, optionnel)')}
          <input className={cn(field, 'mt-1.5')} value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} placeholder="4 500 DA" dir="ltr" />
        </label>
        <label className="block text-xs font-semibold text-fg-muted">
          {t('lppWhatsapp', 'Ton numéro WhatsApp pour recevoir les commandes')}
          <input className={cn(field, 'mt-1.5')} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} inputMode="tel" placeholder="213555000000" dir="ltr" />
          <span className="mt-1 block font-normal text-fg-faint">{t('lppWhatsappHint', 'Format international sans « + », ex : 213555000000')}</span>
        </label>
        <label className="block text-xs font-semibold text-fg-muted">
          {t('lppWebhook', 'Adresse qui reçoit aussi les commandes (optionnel, ex. Google Sheets)')}
          <input className={cn(field, 'mt-1.5')} value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://script.google.com/…" dir="ltr" />
        </label>
      </div>

      <div className="rounded-2xl border border-line bg-surface-2 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Sparkles size={16} className="text-accent-ink" />
          <p className="text-sm font-semibold text-fg">{t('lppAiTitle', 'Images IA des sections')}</p>
          {aiRunning !== null ? (
            <span className="ms-auto flex items-center gap-2 text-xs font-semibold text-fg-muted" role="status"><Loader2 size={14} className="animate-spin" /> {t('lppAiRunning', 'Image de la section {n} en cours…', { n: aiRunning + 1 })}</span>
          ) : imagesReady < sectionCount && (
            <button type="button" onClick={makeImages} disabled={photos.length === 0} className="btn-dz-secondary ms-auto !py-1.5 !text-xs disabled:opacity-50">
              <Sparkles size={13} /> {t('lppAiGenerate', 'Générer les images IA ({count} sections)', { count: sectionCount - imagesReady })}
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-fg-muted">{photos.length === 0 ? t('lppAiNeedPhoto', "Ajoute d'abord une photo du produit dans le formulaire : l'IA en a besoin pour garder ton vrai produit.") : t('lppAiIntro', "L'IA crée une image pour chaque section à partir de ta photo produit. Il faut une clé Gemini avec facturation.")}</p>
        {imagesReady > 0 && <p className="mt-1 text-xs text-success-ink">{t('lppAiDone', '{done}/{total} images prêtes, déjà placées dans la page.', { done: imagesReady, total: sectionCount })}</p>}
        {aiError && <p className="mt-2 text-xs text-warning-ink" role="alert">{aiError}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={download} disabled={!hasDestination} className="btn-dz-primary disabled:opacity-50">
          <Download size={16} /> {t('lppDownload', 'Télécharger la page (HTML)')}
        </button>
        <button type="button" onClick={openTab} className="btn-dz-secondary">
          <ExternalLink size={15} /> {t('lppOpen', 'Ouvrir dans un nouvel onglet')}
        </button>
        <div className="ms-auto flex rounded-xl border border-line p-0.5" role="group" aria-label={t('lppPreviewTitle', 'Aperçu de la landing page')}>
          {(['mobile', 'desktop'] as const).map((d) => (
            <button key={d} type="button" onClick={() => setDevice(d)} aria-pressed={device === d} className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold', device === d ? 'bg-primary text-white' : 'text-fg-muted hover:text-fg')}>
              {d === 'mobile' ? <Smartphone size={13} /> : <Monitor size={13} />}
              {d === 'mobile' ? t('lppMobile', 'Téléphone') : t('lppDesktop', 'Ordinateur')}
            </button>
          ))}
        </div>
      </div>
      {!hasDestination && <p className="text-xs text-warning-ink">{t('lppNeedDestination', "Indique ton numéro WhatsApp (ou une adresse de réception) pour que les commandes t'arrivent.")}</p>}

      <div className="flex justify-center rounded-2xl border border-line bg-surface-2 p-3">
        <iframe
          title={t('lppPreviewTitle', 'Aperçu de la landing page')}
          srcDoc={html}
          sandbox="allow-scripts allow-forms allow-popups"
          className={cn('h-[720px] rounded-xl border border-line bg-white transition-all', device === 'mobile' ? 'w-[390px] max-w-full' : 'w-full')}
        />
      </div>
      <p className="text-xs text-fg-faint">{t('lppPublishHelp', 'Pour la mettre en ligne : envoie ce fichier sur ton hébergeur (Hostinger, Netlify Drop, GitHub Pages…) ou colle son contenu dans ton site.')}</p>
    </section>
  );
}
