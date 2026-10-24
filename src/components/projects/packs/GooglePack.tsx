import { useId, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useToast } from '../../../context/ToastContext';
import { GOOGLE_IMAGE_FORMATS, type GoogleImageFormat } from '../../../lib/adCreative';
import { renderPlainImageBlob } from '../../../lib/adCreativeRender';
import { GOOGLE_COUNTS, PACK_LIMITS, isHttpsUrl, packIssue, youtubeCta, type GoogleAssets } from '../../../lib/adPlatforms';
import { googleAssetsCsv, googleSearchCsv, guideText, packImageName, packZipName } from '../../../lib/adPlatformExport';
import { cn } from '../../../lib/utils';
import { CtaChip, DownloadBar, GuideSteps, LimitField, PackImages, PackIntro, PackSection, VideoAdvice } from './PackParts';
import { downloadPack, type PackProps } from './packZip';
import { usePackImages, type PackPicture } from './usePackImages';
import '../../../i18n/campaigns';

/** A list of texts with the same limit (Google's headlines or descriptions), each removable down to the minimum. */
function TextList({ items, limit, min, max, label, addLabel, multiline, onChange }: {
  items: string[];
  limit: number;
  min: number;
  max: number;
  label: (n: number) => string;
  addLabel: string;
  multiline?: boolean;
  onChange: (items: string[]) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <LimitField label={label(i + 1)} value={item} limit={limit} multiline={multiline} onChange={(value) => onChange(items.map((x, j) => (j === i ? value : x)))} />
          </div>
          {items.length > min && (
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={t('pkRemove', 'Retirer « {label} »', { label: label(i + 1) })} className="mt-6 grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] text-fg-muted hover:bg-surface-2 hover:text-fg">
              <X size={16} />
            </button>
          )}
        </div>
      ))}
      {items.length < max && (
        <button type="button" onClick={() => onChange([...items, ''])} className="btn-dz-secondary !min-h-9 !py-1.5 !text-[13px]"><Plus size={15} /> {addLabel}</button>
      )}
    </div>
  );
}

/** Google: a search ad for Google Ads Editor, a display ad with clean images, and a YouTube (Demand Gen) headline. */
export default function GooglePack({ copy, onChange, concepts, assets, productName, campaignName, language }: PackProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const urlId = useId();
  const [busy, setBusy] = useState(false);
  const g = copy.google;
  const setGoogle = (patch: Partial<GoogleAssets>) => onChange({ ...copy, google: { ...g, ...patch } });
  const cta = concepts[0]?.callToAction ?? 'SHOP_NOW';
  const urlInvalid = copy.finalUrl.trim() !== '' && !isHttpsUrl(copy.finalUrl);

  // one landscape and one square image per product photo (five photos at most), nothing drawn on top of them
  const photos = assets?.photos.slice(0, 5) ?? [];
  const { images, failed } = usePackImages(assets ? async () => {
    const pictures: PackPicture[] = [];
    for (const [i, photo] of photos.entries()) {
      for (const format of ['landscape', 'square'] as GoogleImageFormat[]) {
        const { width, height } = GOOGLE_IMAGE_FORMATS[format];
        pictures.push({ name: packImageName('images', productName, i + 1, format), blob: await renderPlainImageBlob(photo, format), width, height });
      }
    }
    return pictures;
  } : null, JSON.stringify(assets && photos.map((p) => p.src)));

  const steps = [
    t('pkGgStep1', 'Installe Google Ads Editor (gratuit), connecte ton compte Google Ads et télécharge-le.'),
    t('pkGgStep2', 'Crée ou choisis une campagne Search nommée « {campaign} » avec un groupe d’annonces « {adGroup} ».', { campaign: campaignName, adGroup: productName }),
    t('pkGgStep3', 'Menu Account > Import > From file (noms anglais de Google) : choisis google-ads-editor-search.csv, vérifie les colonnes, importe, garde les modifications proposées puis publie.'),
    t('pkGgStep4', 'Pour une campagne Display, crée une annonce display responsive avec les images du pack et les textes de google-display-youtube-texts.csv.'),
    t('pkGgStep5', 'Pour YouTube, mets ta vidéo sur ta chaîne (non répertoriée suffit), puis choisis-la dans une campagne Demand Gen avec le titre YouTube.'),
  ];

  const download = async () => {
    if (!images) return;
    setBusy(true);
    try {
      await downloadPack(packZipName(productName, 'google'), [
        { name: 'google-ads-editor-search.csv', data: googleSearchCsv(copy, { campaign: campaignName, adGroup: productName }) },
        { name: 'google-display-youtube-texts.csv', data: googleAssetsCsv(copy, cta, language) },
        { name: 'guide.txt', data: guideText(`Google - ${productName}`, steps, [t('pkLimitsNote', 'Limites tirées de la documentation de chaque plateforme (octobre 2026). Elles peuvent changer : l’aperçu de la plateforme fait foi.')]) },
      ], images);
    } catch {
      toast.error(t('pkDownloadFailed', 'Le pack n’a pas pu être créé. Réessaie.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PackIntro title={t('pkGoogleTitle', 'Pack Google et YouTube')} intro={t('pkGoogleIntro', 'Une annonce Search à importer dans Google Ads Editor, les textes et les images d’une annonce Display, et le titre d’une annonce vidéo YouTube.')} />

      <PackSection title={t('pkSearchTitle', 'Annonce Search (Google Ads Editor)')} note={t('pkSearchNote', 'De 3 à 15 titres de 30 caractères et de 2 à 4 descriptions de 90 caractères : Google les combine lui-même.')}>
        <TextList
          items={g.headlines}
          limit={PACK_LIMITS.googleHeadline}
          min={GOOGLE_COUNTS.headlines.min}
          max={GOOGLE_COUNTS.headlines.max}
          label={(n) => t('pkHeadline', 'Titre {n}', { n })}
          addLabel={t('pkAddHeadline', 'Ajouter un titre')}
          onChange={(headlines) => setGoogle({ headlines })}
        />
        <div className="border-t border-line pt-4">
          <TextList
            items={g.descriptions}
            limit={PACK_LIMITS.googleDescription}
            min={GOOGLE_COUNTS.descriptions.min}
            max={GOOGLE_COUNTS.descriptions.max}
            label={(n) => t('pkDescription', 'Texte de description {n}', { n })}
            addLabel={t('pkAddDescription', 'Ajouter une description')}
            multiline
            onChange={(descriptions) => setGoogle({ descriptions })}
          />
        </div>
        <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
          {/* a display path has no spaces: typed ones become dashes */}
          <LimitField label={t('pkPath', 'Chemin affiché {n}', { n: 1 })} value={g.path1} limit={PACK_LIMITS.googlePath} onChange={(value) => setGoogle({ path1: value.replace(/\s+/g, '-') })} hint={t('pkPathHint', 'Apparaît après ton domaine : exemple.com/chemin-1/chemin-2.')} />
          <LimitField label={t('pkPath', 'Chemin affiché {n}', { n: 2 })} value={g.path2} limit={PACK_LIMITS.googlePath} onChange={(value) => setGoogle({ path2: value.replace(/\s+/g, '-') })} />
        </div>
        <div className="border-t border-line pt-4">
          <label htmlFor={urlId} className="block text-[13px] font-medium text-fg">{t('pkFinalUrl', 'Adresse de ta page de vente (https://…)')}</label>
          <input
            id={urlId}
            type="url"
            inputMode="url"
            dir="ltr"
            placeholder="https://"
            value={copy.finalUrl}
            onChange={(e) => onChange({ ...copy, finalUrl: e.target.value })}
            aria-invalid={urlInvalid || undefined}
            aria-describedby={`${urlId}-hint`}
            className={cn('input-dz mt-1', urlInvalid && 'border-danger')}
          />
          <p id={`${urlId}-hint`} className={cn('mt-1 text-xs', urlInvalid ? 'text-danger-ink' : 'text-fg-faint')}>
            {urlInvalid ? t('pkFinalUrlInvalid', 'Ce n’est pas une adresse https complète.') : t('pkFinalUrlHint', 'L’adresse où ta landing page est en ligne : onglet Landing page, Page prête, puis mise en ligne chez ton hébergeur.')}
          </p>
        </div>
      </PackSection>

      <PackSection title={t('pkDisplayTitle', 'Annonce Display')} note={t('pkDisplayNote', 'Google demande des images sans texte, sans logo et sans bouton par-dessus : le produit seul, bien en vue. Les 5 premiers titres servent aussi ici.')}>
        <LimitField label={t('pkBrandName', 'Nom affiché (ta marque)')} value={copy.brandName} limit={PACK_LIMITS.brandName} onChange={(brandName) => onChange({ ...copy, brandName })} hint={t('pkBrandHint', 'Le même nom sert sur TikTok (20 caractères au plus), Snapchat et Google.')} />
        <LimitField label={t('pkLongHeadline', 'Titre long')} value={g.longHeadline} limit={PACK_LIMITS.googleLongHeadline} multiline onChange={(longHeadline) => setGoogle({ longHeadline })} />
        <PackImages images={images} failed={failed} count={Math.max(2, photos.length * 2)} aspect="1200 / 628" empty={t('pkNoPhotos', 'Ajoute des photos du produit dans le brief pour créer les images.')} />
      </PackSection>

      <PackSection title={t('pkYoutubeTitle', 'Annonce YouTube (Demand Gen)')}>
        <LimitField label={t('pkYoutubeHeadline', 'Titre YouTube')} value={g.youtubeHeadline} limit={PACK_LIMITS.youtubeHeadline} onChange={(youtubeHeadline) => setGoogle({ youtubeHeadline })} />
        <CtaChip label={youtubeCta(cta, language)} />
      </PackSection>

      <VideoAdvice text={t('pkVideoYoutube', 'Pour YouTube, une vidéo 16:9 d’au moins 10 secondes (annonces avant les vidéos) ou 9:16 (Shorts), créée dans l’onglet Vidéo. Google Ads la prend sur ta chaîne YouTube.')} />
      <GuideSteps steps={steps} />
      <DownloadBar issue={packIssue(copy, 'google')} busy={busy} picturesReady={images !== null && !failed} onDownload={() => void download()} />
    </div>
  );
}
