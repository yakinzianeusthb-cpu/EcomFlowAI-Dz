import { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useToast } from '../../../context/ToastContext';
import { AD_FORMATS } from '../../../lib/adCreative';
import { renderCreativeBlob } from '../../../lib/adCreativeRender';
import { PACK_LIMITS, packIssue, platformCta } from '../../../lib/adPlatforms';
import { guideText, packImageName, packZipName, snapchatCsv } from '../../../lib/adPlatformExport';
import { creativeInput } from '../../ads/CreativeCard';
import { CtaChip, DownloadBar, GuideSteps, LimitField, PackImages, PackIntro, PackSection, VideoAdvice } from './PackParts';
import { downloadPack, type PackProps } from './packZip';
import { usePackImages, type PackPicture } from './usePackImages';
import '../../../i18n/campaigns';

/** Snapchat: a headline per concept, the brand name, the button, and a full-screen 9:16 image per concept. */
export default function SnapchatPack({ copy, onChange, concepts, assets, productName }: PackProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const { width, height } = AD_FORMATS.story;

  const pictureKey = JSON.stringify([
    concepts.map((c) => [c.id, c.overlay, c.headline, c.callToAction]),
    assets && [assets.photos.length, assets.brandColor, assets.price, Boolean(assets.logo)],
  ]);
  // the story layout's safe zone already keeps clear of what Snapchat covers at the top and bottom
  const { images, failed } = usePackImages(assets ? async () => {
    const pictures: PackPicture[] = [];
    for (const [i, concept] of concepts.entries()) {
      pictures.push({ name: packImageName('images', productName, i + 1, 'snapchat'), blob: await renderCreativeBlob(creativeInput(concept, i, 'story', assets)), width, height });
    }
    return pictures;
  } : null, pictureKey);

  const steps = [
    t('pkScStep1', 'Dans Snapchat Ads Manager, crée une campagne (objectif Trafic ou Ventes) et un groupe d’annonces qui cible l’Algérie.'),
    t('pkScStep2', 'Choisis une annonce Image ou vidéo unique et importe une image 9:16 du pack, ou ta vidéo 9:16 en MP4.'),
    t('pkScStep3', 'Colle le nom de marque et un titre (34 caractères au plus), choisis le bouton conseillé et colle l’adresse de ta page de vente.'),
    t('pkScStep4', 'Vérifie dans l’aperçu que rien d’important n’est caché en haut ou en bas de l’écran.'),
  ];

  const download = async () => {
    if (!images) return;
    setBusy(true);
    try {
      await downloadPack(packZipName(productName, 'snapchat'), [
        { name: 'snapchat-ads.csv', data: snapchatCsv(copy, concepts, images.map((img) => img.name)) },
        { name: 'guide.txt', data: guideText(`Snapchat - ${productName}`, steps, [t('pkLimitsNote', 'Limites tirées de la documentation de chaque plateforme (octobre 2026). Elles peuvent changer : l’aperçu de la plateforme fait foi.')]) },
      ], images);
    } catch {
      toast.error(t('pkDownloadFailed', 'Le pack n’a pas pu être créé. Réessaie.'));
    } finally {
      setBusy(false);
    }
  };

  const setHeadline = (index: number, headline: string) => onChange({ ...copy, snapchat: copy.snapchat.map((ad, i) => (i === index ? { ...ad, headline } : ad)) });

  return (
    <div className="space-y-6">
      <PackIntro title={t('pkSnapTitle', 'Pack Snapchat')} intro={t('pkSnapIntro', 'Un titre par concept (34 caractères au plus), le nom de marque, le bouton conseillé et une image plein écran 9:16 par concept.')} />
      <PackSection title={t('pkTexts', 'Textes')}>
        <LimitField label={t('pkBrandName', 'Nom affiché (ta marque)')} value={copy.brandName} limit={PACK_LIMITS.brandName} onChange={(brandName) => onChange({ ...copy, brandName })} hint={t('pkBrandHint', 'Le même nom sert sur TikTok (20 caractères au plus), Snapchat et Google.')} />
        {copy.snapchat.map((ad, i) => {
          const concept = concepts.find((c) => c.id === ad.conceptId);
          return (
            <div key={ad.conceptId} className="space-y-2 border-t border-line pt-4">
              <p className="eyebrow" dir="auto">{concept?.angle || t('cmpConcept', 'Concept {n}', { n: i + 1 })}</p>
              <LimitField label={t('pkSnapHeadline', 'Titre Snapchat')} value={ad.headline} limit={PACK_LIMITS.snapHeadline} onChange={(value) => setHeadline(i, value)} />
              <CtaChip label={platformCta('snapchat', concept?.callToAction ?? 'SHOP_NOW')} />
            </div>
          );
        })}
      </PackSection>
      <PackSection title={t('pkSnapImages', 'Images plein écran (1080 × 1920)')} note={t('pkSnapImagesNote', 'Le texte et le bouton restent loin du haut et du bas de l’écran, que Snapchat recouvre.')}>
        <PackImages images={images} failed={failed} count={concepts.length} aspect="9 / 16" />
      </PackSection>
      <VideoAdvice needsMp4 text={t('pkVideoSnap', 'Snapchat accepte aussi une vidéo 9:16 à la place d’une image : crée-la dans l’onglet Vidéo, au format 9:16.')} />
      <GuideSteps steps={steps} />
      <DownloadBar issue={packIssue(copy, 'snapchat')} busy={busy} picturesReady={images !== null && !failed} onDownload={() => void download()} />
    </div>
  );
}
