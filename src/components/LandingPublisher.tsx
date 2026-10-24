import { useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink, Globe, Info, Monitor, Smartphone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import '../i18n/funnels';
import { escapeHtml } from '../lib/html';
import { TEXT } from '../lib/landingCopy';
import { buildLandingHtml, pageLanguage, posterText, sectionRoles, type LpSection, type SellerReview } from '../lib/landingHtml';
import { posterAspect, posterImagePrompt, sectionImagePrompt, type ImageSection } from '../lib/landingImages';
import { DEFAULT_SETTINGS, readSettings, type PublisherSettings } from '../lib/landingSettings';
import { POSTER_PALETTE, landingColors } from '../lib/landingTheme';
import { fileToUploadDataUrl } from '../lib/imageCompress';
import { stackImages } from '../lib/longImage';
import { generateSectionImage } from '../services/gemini';
import { chosenImageProvider, imageFromService } from '../services/imageService';
import { KEEPS_PRODUCT, type AspectRatio, type ImageProvider } from '../lib/imageProviders';
import { formatImageCost } from '../lib/imageCost';
import { DATE_LOCALE } from '../i18n/dates';
import { cn } from '../lib/utils';
import PageOptions from './landing/PageOptions';
import PosterColorsPicker from './landing/PosterColorsPicker';
import ReviewsEditor from './landing/ReviewsEditor';
import SectionImages from './landing/SectionImages';
import TemplatePicker from './landing/TemplatePicker';
import { FIELD } from './landing/styles';

const WHATSAPP_KEY = 'dzads_lp_whatsapp';
const SETTINGS_KEY = 'dzads_lp_settings';
/** narrower photos look blurry across a phone screen (the long-image page shows them from edge to edge) */
const SHARP_WIDTH = 700;

const naturalWidth = (src: string) =>
  new Promise<number>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth);
    img.onerror = () => resolve(0);
    img.src = src;
  });
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

/** AI images come back as large PNGs; a 1080 px JPEG keeps the page light on phones. */
async function compressDataUrl(dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  return fileToUploadDataUrl(new File([blob], 'section.png', { type: blob.type || 'image/png' }), { maxDimension: 1080, quality: 0.82 });
}

function loadSettings(): PublisherSettings {
  try {
    return readSettings(localStorage.getItem(SETTINGS_KEY));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** The generated structure as a real landing page: its look and promises, a live preview and a self-contained HTML file to publish. */
export default function LandingPublisher({ lpData, productName, photos, language, sectionImages, defaultPrice }: Props) {
  const { t, language: uiLanguage } = useLanguage();
  const [aiImages, setAiImages] = useState<(string | null)[]>(() => (lpData.sections ?? []).map((_, i) => sectionImages?.[i] ?? null));
  // posters of the long-image template, kept apart: their words are drawn in, so other templates cannot use them
  const [posterImages, setPosterImages] = useState<(string | null)[]>(() => (lpData.sections ?? []).map(() => null));
  const [longImageBusy, setLongImageBusy] = useState(false);
  const [aiRunning, setAiRunning] = useState<number | null>(null);
  const [aiError, setAiError] = useState('');
  const [price, setPrice] = useState(defaultPrice ?? '');
  const [oldPrice, setOldPrice] = useState('');
  const [whatsapp, setWhatsapp] = useState(() => { try { return localStorage.getItem(WHATSAPP_KEY) ?? ''; } catch { return ''; } });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [settings, setSettings] = useState<PublisherSettings>(loadSettings);
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [reviewShots, setReviewShots] = useState<string[]>([]);
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');

  // the narrowest product photo, to warn when the photos are too small to look sharp
  const [narrowest, setNarrowest] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    void Promise.all(photos.map(naturalWidth)).then((widths) => {
      const known = widths.filter((w) => w > 0);
      if (alive) setNarrowest(known.length ? Math.min(...known) : null);
    });
    return () => { alive = false; };
  }, [photos]);

  // the chosen image service, to show what an image costs before the seller makes it
  const [service, setService] = useState<ImageProvider | null>(null);
  useEffect(() => {
    let alive = true;
    void chosenImageProvider().then((provider) => { if (alive) setService(provider); });
    return () => { alive = false; };
  }, []);

  useEffect(() => { try { localStorage.setItem(WHATSAPP_KEY, whatsapp); } catch { /* storage unavailable */ } }, [whatsapp]);
  useEffect(() => { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* storage unavailable */ } }, [settings]);

  const name = lpData.productName || productName;
  const isPoster = settings.template === 'poster';
  // the long-image page is deep blue and yellow unless the seller picks the product's palette
  const palette = isPoster && settings.posterColors === 'blue' ? POSTER_PALETTE : lpData.colorPalette;
  const html = useMemo(
    () => buildLandingHtml({
      productName: name, language, sections: lpData.sections ?? [], colorPalette: palette, photos, sectionImages: aiImages,
      posterImages, price, oldPrice, whatsapp, webhookUrl,
      template: settings.template, storeName: settings.storeName, delivery: { mode: settings.deliveryMode, fee: settings.deliveryFee },
      promises: settings.promises, reviews, reviewShots,
    }),
    [name, language, lpData.sections, palette, photos, aiImages, posterImages, price, oldPrice, whatsapp, webhookUrl, settings, reviews, reviewShots],
  );
  // the preview reloads the whole page (images included): it follows the typing once the typing pauses
  const [previewHtml, setPreviewHtml] = useState(html);
  useEffect(() => {
    const id = setTimeout(() => setPreviewHtml(html), 350);
    return () => clearTimeout(id);
  }, [html]);
  const hasDestination = whatsapp.replace(/\D/g, '').length >= 9 || /^https:\/\//.test(webhookUrl.trim());

  const saveFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };
  const download = () => saveFile(new Blob([html], { type: 'text/html;charset=utf-8' }), `${fileSlug(name)}.html`);
  // The full-page preview runs in a sandboxed frame, like the preview above: a page opened from a blob would
  // otherwise run on this site's origin, with the seller's session.
  const openTab = () => {
    const shell = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(name)}</title><style>html,body{margin:0;height:100%}iframe{display:block;border:0;width:100%;height:100%}</style></head><body><iframe sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox" srcdoc="${escapeHtml(html)}"></iframe></body></html>`;
    const url = URL.createObjectURL(new Blob([shell], { type: 'text/html;charset=utf-8' }));
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  // images only for the sections the page shows: one left out (invented reviews, a guarantee not offered) costs nothing
  const shownIndices = sectionRoles(lpData.sections ?? [], settings.promises).flatMap((role, i) => (role === 'shown' ? [i] : []));
  const images = isPoster ? posterImages : aiImages;
  const pageLang = pageLanguage(language, (lpData.sections ?? []).flatMap((s) => [s.title ?? '', s.content ?? '']));

  // the posters are drawn in the page's canvas colours, so they melt into it
  const posterColors = landingColors(palette, 'poster');
  /** What the AI receives for a section: drawn here, or copied by the seller into another image tool. */
  const promptFor = (i: number) => {
    const section = (lpData.sections ?? [])[i];
    return isPoster
      ? posterImagePrompt(section, posterText(section, TEXT[pageLang]), { language: pageLang, hero: i === 0, colors: [posterColors.canvas, posterColors.highlight] })
      : sectionImagePrompt(section);
  };

  const makeImages = async (indices: number[]) => {
    setAiError('');
    // the kind is fixed when the run starts: switching templates meanwhile does not mix posters and pictures
    const poster = isPoster;
    const setImages = poster ? setPosterImages : setAiImages;
    // Gemini unless the seller chose another service; one that cannot keep the product is never used for the page.
    // The first section shows as running while the choice is read, so the click answers at once.
    if (indices.length) setAiRunning(indices[0]);
    const provider = await chosenImageProvider();
    setService(provider);
    if (!KEEPS_PRODUCT[provider]) {
      setAiRunning(null);
      setAiError(t('lppServiceNoPhoto', 'Le service d’images choisi dans Paramètres (Cloudflare) ne garde pas ton produit : choisis Gemini, OpenAI ou FLUX pour les images de ta page.'));
      return;
    }
    const draw = (prompt: string, aspectRatio?: AspectRatio) =>
      provider === 'gemini' ? generateSectionImage(prompt, photos[0], aspectRatio) : imageFromService({ prompt, reference: photos[0], aspectRatio: aspectRatio ?? '1:1' });
    for (const i of indices) {
      setAiRunning(i);
      try {
        const raw = await draw(promptFor(i), poster ? posterAspect(i === 0) : undefined);
        const image = await compressDataUrl(raw);
        setImages((prev) => prev.map((v, j) => (j === i ? image : v)));
      } catch (err) {
        const e = err as { message?: string; status?: number };
        setAiError(e?.message || t('shAiError', 'Erreur IA. Réessaie.'));
        // no billing, no key, no plan or no quota: the next sections would fail the same way
        if ([400, 402, 403, 429].includes(e?.status ?? 0)) break;
      }
    }
    setAiRunning(null);
  };
  const removeImage = (index: number) => (isPoster ? setPosterImages : setAiImages)((prev) => prev.map((v, j) => (j === index ? null : v)));

  const postersDone = isPoster && shownIndices.length > 0 && shownIndices.every((i) => posterImages[i]);
  const downloadLongImage = async () => {
    setLongImageBusy(true);
    setAiError('');
    try {
      saveFile(await stackImages(shownIndices.map((i) => posterImages[i] as string)), `${fileSlug(name)}-image-longue.jpg`);
    } catch {
      setAiError(t('lppLongImageError', "L'image longue n'a pas pu être créée. Réessaie."));
    } finally {
      setLongImageBusy(false);
    }
  };

  const sectionImagesBlock = (
    <SectionImages
      isPoster={isPoster}
      shownIndices={shownIndices}
      images={images}
      running={aiRunning}
      error={aiError}
      hasPhoto={photos.length > 0}
      onGenerate={(indices) => void makeImages(indices)}
      onRemove={removeImage}
      promptOf={promptFor}
      service={service}
      costOf={(count) => (service ? formatImageCost(service, DATE_LOCALE[uiLanguage], count) : null)}
      onLongImage={postersDone ? () => void downloadLongImage() : null}
      longImageBusy={longImageBusy}
    />
  );

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

      <TemplatePicker
        value={settings.template}
        onChange={(template) => setSettings((s) => ({ ...s, template }))}
        palette={lpData.colorPalette}
        posterPalette={settings.posterColors === 'blue' ? POSTER_PALETTE : undefined}
      />
      {isPoster && <PosterColorsPicker value={settings.posterColors} onChange={(posterColors) => setSettings((s) => ({ ...s, posterColors }))} palette={lpData.colorPalette} />}
      {isPoster && sectionImagesBlock}
      {narrowest !== null && narrowest < SHARP_WIDTH && (
        <p className="flex items-start gap-2 rounded-2xl border border-warning/30 bg-warning/10 p-3.5 text-xs text-fg" role="note">
          <Info size={16} className="mt-px shrink-0 text-warning-ink" aria-hidden="true" />
          {t('lppSmallPhotos', "Certaines de tes photos sont petites ({width} px de large) : en grand sur la page, elles seront floues. Ajoute des photos d'au moins 800 px de large, ou crée les affiches IA.", { width: narrowest })}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-fg-muted">
          {t('lppPrice', 'Prix affiché')}
          <input className={cn(FIELD, 'mt-1.5')} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="2 900 DA" dir="ltr" />
        </label>
        <label className="block text-xs font-semibold text-fg-muted">
          {t('lppOldPrice', 'Ancien prix (barré, optionnel)')}
          <input className={cn(FIELD, 'mt-1.5')} value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} placeholder="4 500 DA" dir="ltr" />
        </label>
        <label className="block text-xs font-semibold text-fg-muted">
          {t('lppWhatsapp', 'Ton numéro WhatsApp pour recevoir les commandes')}
          <input className={cn(FIELD, 'mt-1.5')} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} inputMode="tel" placeholder="213555000000" dir="ltr" />
          <span className="mt-1 block font-normal text-fg-faint">{t('lppWhatsappHint', 'Format international sans « + », ex : 213555000000')}</span>
        </label>
        <label className="block text-xs font-semibold text-fg-muted">
          {t('lppWebhook', 'Adresse qui reçoit aussi les commandes (optionnel, ex. Google Sheets)')}
          <input className={cn(FIELD, 'mt-1.5')} value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://script.google.com/…" dir="ltr" />
        </label>
      </div>

      <PageOptions settings={settings} onChange={setSettings} />

      <ReviewsEditor reviews={reviews} onReviews={setReviews} shots={reviewShots} onShots={setReviewShots} />

      {!isPoster && sectionImagesBlock}

      <p className="flex items-start gap-2 rounded-2xl border border-warning/30 bg-warning/10 p-3.5 text-xs text-fg">
        <Info size={16} className="mt-px shrink-0 text-warning-ink" aria-hidden="true" />
        {t('lppCheckCopy', "Relis les textes avant de publier : l'IA peut inventer des détails (délais de livraison, stock, chiffres, caractéristiques). Corrige ce qui n'est pas vrai pour ton produit.")}
      </p>

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
          srcDoc={previewHtml}
          sandbox="allow-scripts allow-forms allow-popups"
          className={cn('h-[720px] rounded-xl border border-line bg-white', device === 'mobile' ? 'w-[390px] max-w-full' : 'w-full')}
        />
      </div>
      <p className="text-xs text-fg-faint">{t('lppPublishHelp', 'Pour la mettre en ligne : envoie ce fichier sur ton hébergeur (Hostinger, Netlify Drop, GitHub Pages…) ou colle son contenu dans ton site.')}</p>
    </section>
  );
}
