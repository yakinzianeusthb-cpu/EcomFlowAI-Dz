import { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useToast } from '../../../context/ToastContext';
import { TIKTOK_CAROUSEL, TIKTOK_SAFE_ZONE } from '../../../lib/adCreative';
import { renderCreativeBlob, shrinkJpeg } from '../../../lib/adCreativeRender';
import { PACK_LIMITS, packIssue, platformCta } from '../../../lib/adPlatforms';
import { guideText, packImageName, packZipName, tiktokCsv } from '../../../lib/adPlatformExport';
import { creativeInput } from '../../ads/CreativeCard';
import { CtaChip, DownloadBar, GuideSteps, LimitField, PackImages, PackIntro, PackSection, VideoAdvice } from './PackParts';
import { downloadPack, type PackProps } from './packZip';
import { usePackImages, type PackPicture } from './usePackImages';
import '../../../i18n/campaigns';

/** TikTok: a caption per concept, the display name, the button, and 9:16 carousel images for sellers without a video. */
export default function TikTokPack({ copy, onChange, concepts, assets, productName }: PackProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  // a carousel takes two images at least: a single concept is drawn twice, with another layout and photo
  const slides = concepts.length >= 2 ? concepts.map((concept, index) => ({ concept, index })) : [{ concept: concepts[0], index: 0 }, { concept: concepts[0], index: 1 }];
  const pictureKey = JSON.stringify([
    slides.map(({ concept: c, index }) => [c.id, c.overlay, c.headline, c.callToAction, index]),
    assets && [assets.photos.length, assets.brandColor, assets.price, Boolean(assets.logo)],
  ]);
  const { images, failed } = usePackImages(assets ? async () => {
    const pictures: PackPicture[] = [];
    for (const [n, { concept, index }] of slides.entries()) {
      const full = await renderCreativeBlob({ ...creativeInput(concept, index, 'story', assets), safeZone: TIKTOK_SAFE_ZONE });
      const blob = await shrinkJpeg(full, TIKTOK_CAROUSEL.width, TIKTOK_CAROUSEL.height, TIKTOK_CAROUSEL.maxBytes);
      pictures.push({ name: packImageName('carousel', productName, n + 1), blob, width: TIKTOK_CAROUSEL.width, height: TIKTOK_CAROUSEL.height });
    }
    return pictures;
  } : null, pictureKey);

  const steps = [
    t('pkTtStep1', 'Dans TikTok Ads Manager, crée une campagne (objectif Trafic ou Ventes), puis un groupe d’annonces qui cible l’Algérie.'),
    t('pkTtStep2', 'Dans l’annonce, importe ta vidéo 9:16 en MP4 (onglet Vidéo). Sans vidéo, choisis le format Carrousel, importe les images du pack et ajoute une musique.'),
    t('pkTtStep3', 'Colle un des textes (100 caractères au plus) et le nom affiché, puis choisis le bouton conseillé.'),
    t('pkTtStep4', 'Colle l’adresse https de ta page de vente et vérifie l’aperçu avant de publier.'),
  ];

  const download = async () => {
    if (!images) return;
    setBusy(true);
    try {
      await downloadPack(packZipName(productName, 'tiktok'), [
        { name: 'tiktok-ad-texts.csv', data: tiktokCsv(copy, concepts, images.map((img) => img.name)) },
        { name: 'guide.txt', data: guideText(`TikTok - ${productName}`, steps, [t('pkLimitsNote', 'Limites tirées de la documentation de chaque plateforme (octobre 2026). Elles peuvent changer : l’aperçu de la plateforme fait foi.')]) },
      ], images);
    } catch {
      toast.error(t('pkDownloadFailed', 'Le pack n’a pas pu être créé. Réessaie.'));
    } finally {
      setBusy(false);
    }
  };

  const setText = (index: number, adText: string) => onChange({ ...copy, tiktok: copy.tiktok.map((ad, i) => (i === index ? { ...ad, adText } : ad)) });

  return (
    <div className="space-y-6">
      <PackIntro title={t('pkTiktokTitle', 'Pack TikTok')} intro={t('pkTiktokIntro', 'Un texte par concept (100 caractères au plus, sans hashtag, @ ni lien), le nom affiché, le bouton conseillé, et des images 9:16 pour une publicité carrousel si tu n’as pas de vidéo.')} />
      <PackSection title={t('pkTexts', 'Textes')}>
        <LimitField label={t('pkBrandName', 'Nom affiché (ta marque)')} value={copy.brandName} limit={PACK_LIMITS.brandName} onChange={(brandName) => onChange({ ...copy, brandName })} hint={t('pkBrandHint', 'Le même nom sert sur TikTok (20 caractères au plus), Snapchat et Google.')} />
        {copy.tiktok.map((ad, i) => {
          const concept = concepts.find((c) => c.id === ad.conceptId);
          return (
            <div key={ad.conceptId} className="space-y-2 border-t border-line pt-4">
              <p className="eyebrow" dir="auto">{concept?.angle || t('cmpConcept', 'Concept {n}', { n: i + 1 })}</p>
              <LimitField multiline label={t('pkAdText', 'Texte de la pub')} value={ad.adText} limit={PACK_LIMITS.tiktokText} onChange={(value) => setText(i, value)} />
              <CtaChip label={platformCta('tiktok', concept?.callToAction ?? 'SHOP_NOW')} />
            </div>
          );
        })}
      </PackSection>
      <VideoAdvice needsMp4 text={t('pkVideoTiktok', 'Sur TikTok, la vidéo verticale 9:16 marche le mieux. Crée-la dans l’onglet Vidéo (bouton Créer la vidéo), au format 9:16 : elle se télécharge prête à importer.')} />
      <PackSection title={t('pkCarouselTitle', 'Images du carrousel (720 × 1280)')} note={t('pkCarouselNote', 'Pour une publicité carrousel TikTok : 2 images au moins et une musique choisie dans TikTok. Le texte reste loin du bas et des côtés, que l’interface de TikTok recouvre.')}>
        <PackImages images={images} failed={failed} count={slides.length} aspect="9 / 16" />
      </PackSection>
      <GuideSteps steps={steps} />
      <DownloadBar issue={packIssue(copy, 'tiktok')} busy={busy} picturesReady={images !== null && !failed} onDownload={() => void download()} />
    </div>
  );
}
