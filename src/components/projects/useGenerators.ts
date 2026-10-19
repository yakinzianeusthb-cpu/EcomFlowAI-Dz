import { useCallback, useRef, useState } from 'react';
import { generateLandingPageCopy, generateVideoAdScript } from '../../services/gemini';
import { generateAdPack } from '../../services/adsAi';
import { assetAsDataUrl, type BrandKit, type ProjectDetail } from '../../services/campaigns';
import { landingInputFromBrief, videoContextFromBrief, type BrandFields } from '../../lib/campaignContext';
import type { AdPack } from '../../lib/adPack';
import type { OutputKind } from '../../lib/projectRules';

export type GenKind = Exclude<OutputKind, 'meta_campaign'>;
export type GenStatus = 'idle' | 'running' | 'failed';

export interface VideoOptions {
  style: string;
  format: '9:16' | '1:1' | '16:9';
  duration: string;
}

export interface LandingOutput {
  lpData: { sections: any[]; colorPalette?: string[]; productName?: string; generalNotes?: string; [key: string]: unknown };
}
export interface VideoOutput {
  script: { scenes: any[]; [key: string]: unknown };
  options: VideoOptions;
}
export interface AdsOutput {
  pack: AdPack;
  selected: string[];
}

const toInline = (dataUrl: string) => {
  const [head, data] = dataUrl.split(',');
  return { data, mimeType: /data:([^;]+)/.exec(head)?.[1] ?? 'image/jpeg' };
};

const brandFields = (kit: BrandKit | null): BrandFields | null => (kit ? { brandName: kit.brandName, colors: kit.colors, tone: kit.tone, audience: kit.audience, instructions: kit.instructions, styles: kit.styles } : null);

/**
 * Runs the three generators for a campaign. Each output succeeds or fails on its own, and each success is saved
 * as a new version right away, so a later failure never loses earlier work.
 */
export function useGenerators(detail: ProjectDetail | null, kit: BrandKit | null, saveOutput: (kind: OutputKind, data: object) => Promise<unknown>) {
  const [status, setStatus] = useState<Record<GenKind, GenStatus>>({ landing: 'idle', video: 'idle', ads: 'idle' });
  const [errors, setErrors] = useState<Partial<Record<GenKind, string>>>({});
  // read at run time, not when the button was rendered: a brief edit saved a moment earlier is always included
  const latest = useRef({ detail, kit });
  latest.current = { detail, kit };

  const productPhotos = useCallback(
    async (max: number) => {
      const ids = (latest.current.detail?.assets ?? []).filter((a) => a.kind === 'product').slice(0, max).map((a) => a.id);
      return Promise.all(ids.map((id) => assetAsDataUrl(id)));
    },
    [],
  );

  const run = useCallback(async (kind: GenKind, work: () => Promise<object>) => {
    setStatus((s) => ({ ...s, [kind]: 'running' }));
    setErrors((e) => ({ ...e, [kind]: undefined }));
    try {
      const data = await work();
      await saveOutput(kind, data);
      setStatus((s) => ({ ...s, [kind]: 'idle' }));
      return true;
    } catch (err) {
      setErrors((e) => ({ ...e, [kind]: (err as Error)?.message || '' }));
      setStatus((s) => ({ ...s, [kind]: 'failed' }));
      return false;
    }
  }, [saveOutput]);

  const generateLanding = useCallback(() => run('landing', async () => {
    const { detail, kit } = latest.current;
    if (!detail) throw new Error('');
    const photos = await productPhotos(3);
    const data = await generateLandingPageCopy(landingInputFromBrief(detail.project, brandFields(kit)), photos.length ? photos.map(toInline) : undefined, '16:9');
    if (!data || !Array.isArray(data.sections) || data.sections.length === 0) throw new Error('');
    const stamp = Date.now();
    const lpData = { ...data, sections: data.sections.map((s: any, i: number) => ({ ...s, id: `section-${i}-${stamp}` })) };
    return { lpData } satisfies LandingOutput;
  }), [productPhotos, run]);

  const generateVideo = useCallback((options: VideoOptions) => run('video', async () => {
    const { detail, kit } = latest.current;
    if (!detail) throw new Error('');
    const script = await generateVideoAdScript(videoContextFromBrief(detail.project, brandFields(kit), options), options.style, options.format);
    if (!script || !Array.isArray(script.scenes) || script.scenes.length === 0) throw new Error('');
    return { script, options } satisfies VideoOutput;
  }), [run]);

  const generateAds = useCallback(() => run('ads', async () => {
    const { detail, kit } = latest.current;
    if (!detail) throw new Error('');
    const [photo] = await productPhotos(1);
    const pack = await generateAdPack(detail.project, brandFields(kit), { count: 4, photo: photo ? toInline(photo) : null });
    return { pack, selected: pack.concepts.map((c) => c.id) } satisfies AdsOutput;
  }), [productPhotos, run]);

  return { status, errors, generateLanding, generateVideo, generateAds, productPhotos };
}

export type Generators = ReturnType<typeof useGenerators>;

export const DEFAULT_VIDEO_OPTIONS: VideoOptions = { style: 'User-Generated Content (UGC)', format: '9:16', duration: '30 secondes' };
