import { useEffect, useMemo, useRef, useState } from 'react';
import { Clapperboard, Download, ImagePlus, Loader2, RotateCcw, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import '../i18n/video';
import { useToast } from '../context/ToastContext';
import { fileToUploadDataUrl } from '../lib/imageCompress';
import { CANVAS_SIZE, buildTimeline, type VideoFormat, type VideoScript } from '../lib/videoTimeline';
import { canRecordVideo, drawFrame, loadClip, loadImage, loadVideoFonts, prepareAssets, recordVideo, type RenderAssets } from '../lib/videoRender';
import AiClipsPanel from './AiClipsPanel';

const FORMATS: VideoFormat[] = ['9:16', '1:1', '4:5', '16:9'];
const MAX_PHOTOS = 6;
const toFormat = (value: string): VideoFormat => (FORMATS.includes(value as VideoFormat) ? (value as VideoFormat) : '9:16');
const fileSlug = (name: string) =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'video-pub';

interface Props {
  script: VideoScript;
  /** The format chosen in the tool (9:16, 1:1, 4:5 or 16:9). */
  format: string;
  /** Product photo(s) already in the tool, as data URLs. */
  photos: string[];
  price?: string;
  productName?: string;
}

/** Turns a generated script into a real video file, entirely in the browser (no AI video model needed). */
export default function VideoMaker({ script, format, photos: initialPhotos, price, productName = '' }: Props) {
  const { t } = useLanguage();
  const toast = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>(initialPhotos.slice(0, MAX_PHOTOS));
  const [subtitles, setSubtitles] = useState(true);
  const [assets, setAssets] = useState<RenderAssets | null>(null);
  const [scrub, setScrub] = useState(0.5);
  const [recording, setRecording] = useState(false);
  const [percent, setPercent] = useState(0);
  const [video, setVideo] = useState<{ url: string; ext: string } | null>(null);
  // AI clip address per scene (from the Veo panel) and the loaded video elements drawn in their place
  const [clips, setClips] = useState<(string | null)[]>(() => (script.scenes ?? []).map(() => null));
  const [clipEls, setClipEls] = useState<(HTMLVideoElement | null)[]>([]);
  const supported = useMemo(() => canRecordVideo(), []);
  const videoFormat = toFormat(format);
  const size = CANVAS_SIZE[videoFormat];
  const timeline = useMemo(() => buildTimeline(script, { imageCount: assets?.images.length ?? 0, subtitles, price }), [script, assets, subtitles, price]);

  // photos and fonts are loaded once per change; a photo that fails to load is skipped
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadVideoFonts();
      const loaded = await Promise.all(photos.map((src) => loadImage(src).catch(() => null)));
      if (!cancelled) setAssets(prepareAssets(loaded.filter((img): img is HTMLImageElement => img !== null), size.width, size.height));
    })();
    return () => { cancelled = true; };
  }, [photos, size.width, size.height]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(clips.map((url) => (url ? loadClip(url).catch(() => null) : Promise.resolve(null)))).then((els) => { if (!cancelled) setClipEls(els); });
    return () => { cancelled = true; };
  }, [clips]);

  const renderAssets = useMemo(() => (assets ? { ...assets, clips: clipEls } : null), [assets, clipEls]);

  // still preview at the chosen position
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !renderAssets || recording) return;
    drawFrame(ctx, timeline, Math.min(scrub, timeline.duration), renderAssets);
  }, [renderAssets, timeline, scrub, recording, size.width, size.height]);

  useEffect(() => () => { if (video) URL.revokeObjectURL(video.url); }, [video]);

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const picked = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, room);
    const added = await Promise.all(picked.map((f) => fileToUploadDataUrl(f).catch(() => null)));
    setPhotos((prev) => [...prev, ...added.filter((p): p is string => p !== null)].slice(0, MAX_PHOTOS));
    if (fileRef.current) fileRef.current.value = '';
  };

  const create = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !renderAssets) return;
    setVideo(null);
    setPercent(0);
    setRecording(true);
    try {
      const blob = await recordVideo(canvas, timeline, renderAssets, (fraction) => {
        const next = Math.round(fraction * 100);
        setPercent((prev) => (prev === next ? prev : next));
      });
      setVideo({ url: URL.createObjectURL(blob), ext: blob.type.includes('mp4') ? 'mp4' : 'webm' });
    } catch (err) {
      console.error('Video creation failed:', err);
      toast.error(t('vmFailed', 'La création de la vidéo a échoué. Réessaie.'));
    } finally {
      setRecording(false);
    }
  };

  if (!supported) {
    return <p className="ui-card p-5 text-sm text-fg-muted">{t('vmUnsupported', 'Ce navigateur ne peut pas créer de vidéo. Utilise Chrome ou Edge sur ordinateur.')}</p>;
  }

  return (
    <div className="space-y-6">
    <section className="ui-card p-5 sm:p-6" aria-labelledby="video-maker-title">
      <div className="flex items-center gap-2 mb-1">
        <Clapperboard size={18} className="text-primary-ink" />
        <h4 id="video-maker-title" className="text-base font-semibold text-fg">{t('vmTitle', 'Ta vidéo publicitaire')}</h4>
        <span className="ms-auto text-xs text-fg-faint">{t('vmFormat', 'Format {format}', { format: videoFormat })}</span>
      </div>
      <p className="text-sm text-fg-muted mb-5">{t('vmIntro', "Transforme ce script en vraie vidéo : ta photo produit animée, le texte de chaque scène à l'écran et une fin avec le prix et « الدفع عند الاستلام ».")}</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col items-center gap-3">
          {video && !recording ? (
            <video src={video.url} controls autoPlay playsInline className="w-full max-h-[560px] rounded-xl bg-black" style={{ aspectRatio: `${size.width} / ${size.height}` }} />
          ) : (
            <canvas ref={canvasRef} width={size.width} height={size.height} aria-label={t('vmPreview', 'Aperçu')} className="w-full max-h-[560px] rounded-xl bg-black object-contain" style={{ aspectRatio: `${size.width} / ${size.height}` }} />
          )}
          {!video && !recording && (
            <label className="w-full text-xs text-fg-muted">
              <span className="sr-only">{t('vmScrub', 'Position dans la vidéo')}</span>
              <input type="range" min={0} max={timeline.duration} step={0.1} value={Math.min(scrub, timeline.duration)} onChange={(e) => setScrub(Number(e.target.value))} className="w-full accent-[var(--color-primary,#2563eb)]" aria-label={t('vmScrub', 'Position dans la vidéo')} />
            </label>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-fg-muted mb-2">{t('vmPhotos', 'Photos du produit')}</p>
            <div className="flex flex-wrap gap-2">
              {photos.map((src, i) => (
                <div key={i} className="relative size-16 overflow-hidden rounded-lg border border-line">
                  <img src={src} alt="" className="size-full object-cover" />
                  <button type="button" disabled={recording} onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))} aria-label={t('vmRemovePhoto', 'Retirer cette photo')} className="absolute end-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-black/70 text-white disabled:opacity-40">
                    <X size={12} />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button type="button" disabled={recording} onClick={() => fileRef.current?.click()} className="grid size-16 place-items-center rounded-lg border border-dashed border-line-strong text-fg-muted hover:text-fg disabled:opacity-40" aria-label={t('vmAddPhotos', 'Ajouter des photos')} title={t('vmAddPhotos', 'Ajouter des photos')}>
                  <ImagePlus size={18} />
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
            </div>
            {photos.length === 0 && <p className="mt-2 text-xs text-warning-ink">{t('vmNoPhoto', "Ajoute au moins une photo du produit : sans photo, la vidéo n'a qu'un fond coloré.")}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm text-fg-muted cursor-pointer">
            <input type="checkbox" checked={subtitles} disabled={recording} onChange={(e) => setSubtitles(e.target.checked)} className="size-4 accent-[var(--color-primary,#2563eb)]" />
            {t('vmSubtitles', 'Afficher la voix off en sous-titres')}
          </label>

          {recording ? (
            <div className="space-y-2" role="status">
              <div className="flex items-center gap-2 text-sm font-semibold text-fg">
                <Loader2 size={16} className="animate-spin" /> {t('vmRecording', 'Création de la vidéo… {percent} %', { percent })}
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-fg/10">
                <div className="h-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
              </div>
              <p className="text-xs text-fg-faint">{t('vmKeepTab', 'Garde cet onglet ouvert pendant la création.')}</p>
            </div>
          ) : video ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-success-ink">{t('vmReady', 'Ta vidéo est prête')}</p>
              <div className="flex flex-wrap gap-2">
                <a href={video.url} download={`${fileSlug(productName)}.${video.ext}`} className="btn-dz-primary">
                  <Download size={16} /> {t('vmDownload', 'Télécharger la vidéo')}
                </a>
                <button type="button" onClick={() => setVideo(null)} className="btn-dz-secondary">
                  <RotateCcw size={15} /> {t('vmRedo', 'Recréer')}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={create} disabled={!assets} className="btn-dz-primary w-full disabled:opacity-50">
              <Clapperboard size={16} /> {t('vmCreate', 'Créer la vidéo ({seconds} s)', { seconds: Math.round(timeline.duration) })}
            </button>
          )}

          <p className="text-xs text-fg-faint">{t('vmSilentNote', 'La vidéo est muette : ajoute ta musique ou ta voix off dans TikTok, CapCut ou Instagram avant de publier.')}</p>
        </div>
      </div>
    </section>
    {(script.scenes?.length ?? 0) > 0 && (
      <AiClipsPanel
        scenes={script.scenes ?? []}
        format={videoFormat}
        photo={photos[0] ?? null}
        productName={productName}
        clips={clips}
        onClip={(index, url) => { setClips((prev) => prev.map((c, i) => (i === index ? url : c))); setVideo(null); }}
      />
    )}
    </div>
  );
}
