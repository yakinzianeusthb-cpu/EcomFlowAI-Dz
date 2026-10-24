import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Megaphone, Package, RefreshCw, Save } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { formatRelative } from '../../i18n/dates';
import type { AdConcept } from '../../lib/adPack';
import { currentCopy, type PackPlatform, type PlatformCopy } from '../../lib/adPlatforms';
import { generatePlatformCopy } from '../../services/adsAi';
import { ChipToggles, EmptyState, StatusChip } from '../ui/primitives';
import type { CreativeAssets } from '../ads/CreativeCard';
import { useCreativeImages } from '../ads/useCreativeImages';
import { GenerateState } from './OutputControls';
import { useBrandKit, type ProjectHandle } from './useProject';
import { brandFields, type AdsOutput } from './useGenerators';
import GooglePack from './packs/GooglePack';
import SnapchatPack from './packs/SnapchatPack';
import TikTokPack from './packs/TikTokPack';
import '../../i18n/campaigns';

const PACKS = { tiktok: TikTokPack, snapchat: SnapchatPack, google: GooglePack };

type AdsVersion = { version: number; createdAt: string; data: AdsOutput };

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Unsaved edits are kept for the browser session, so leaving the tab and coming back does not lose them. */
const draftKey = (projectId: string) => `dz_pack_draft_${projectId}`;

function restoreDraft(projectId: string, version: number | undefined, saved: PlatformCopy | null): PlatformCopy | null {
  if (!saved) return saved;
  try {
    const stored = JSON.parse(sessionStorage.getItem(draftKey(projectId)) ?? 'null') as { version?: number; copy?: PlatformCopy } | null;
    // only a draft of this very version, written from the same concepts
    return stored?.version === version && stored.copy && same(stored.copy.conceptIds, saved.conceptIds) ? stored.copy : saved;
  } catch {
    return saved;
  }
}

/**
 * The TikTok, Snapchat and Google packs of a campaign (Publish tab). One AI call writes the copy of all three from
 * the concepts picked here; it is saved with the ads, so it follows their versions. Edits stay a draft until saved.
 */
export default function PlatformPacks({ project, platform }: { project: ProjectHandle; platform: PackPlatform }) {
  const { t, language } = useLanguage();
  const toast = useToast();
  const { kit } = useBrandKit();
  const [, setParams] = useSearchParams();
  const detail = project.detail!;
  const p = detail.project;
  const output = detail.outputs.ads as AdsVersion | undefined;
  const allConcepts = output?.data.pack.concepts ?? [];
  const saved = currentCopy(output?.data.platforms, allConcepts);
  const stale = Boolean(output?.data.platforms) && !saved;

  const [draft, setDraft] = useState<PlatformCopy | null>(() => restoreDraft(p.id, output?.version, saved));
  // the concepts to adapt: those chosen in the Ads tab (all of them when none is)
  const [picked, setPicked] = useState<string[]>(() => {
    const chosen = (output?.data.selected ?? []).filter((id) => allConcepts.some((c) => c.id === id));
    return chosen.length ? chosen : allConcepts.map((c) => c.id);
  });
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  /** what the last save sent: letters typed while it was on the way are kept when the new version arrives */
  const sent = useRef<PlatformCopy | null>(null);
  const seenVersion = useRef(output?.version);

  // a new saved version (prepared, saved, restored) becomes the draft
  useEffect(() => {
    if (seenVersion.current === output?.version) return;
    seenVersion.current = output?.version;
    const sentCopy = sent.current;
    sent.current = null;
    setDraft((current) => (sentCopy && current && !same(current, sentCopy) ? current : saved));
  }, [output?.version]); // follow the saved version, not each new copy of the output object

  useEffect(() => {
    try {
      if (draft && saved && !same(draft, saved)) sessionStorage.setItem(draftKey(p.id), JSON.stringify({ version: output?.version, copy: draft }));
      else sessionStorage.removeItem(draftKey(p.id));
    } catch {
      /* storage unavailable: the draft lives as long as the page */
    }
  }, [draft, saved, p.id, output?.version]);

  const images = useCreativeImages(detail.assets.filter((a) => a.kind === 'product').map((a) => a.id), kit?.logoAssetId);
  const assets = useMemo<CreativeAssets | null>(
    () => (images ? { ...images, brandColor: kit?.colors?.[0], price: p.price || undefined, language: p.language, productName: p.productName || p.name } : null),
    [images, kit?.colors, p.price, p.language, p.productName, p.name],
  );

  if (!output) {
    return (
      <EmptyState
        icon={Megaphone}
        title={t('metaNeedAds', 'Génère d’abord tes publicités')}
        body={t('pkNeedAdsText', 'Les packs partent des concepts de l’onglet Publicités : génère-les d’abord.')}
        action={<button type="button" onClick={() => setParams({ tab: 'ads' }, { replace: true })} className="btn-dz-primary">{t('pkGoAds', 'Aller aux publicités')}</button>}
      />
    );
  }

  const prepare = async (concepts: AdConcept[]) => {
    if (!concepts.length || running) return;
    const startedOn = output.version;
    setRunning(true);
    setError(undefined);
    try {
      const copy = await generatePlatformCopy(p, brandFields(kit), concepts);
      // the AI takes a while: the ads may have been regenerated or edited meanwhile, and must not be overwritten
      const now = project.currentOutput('ads') as AdsVersion | undefined;
      if (!now || now.version !== startedOn) {
        setError(t('pkChangedMeanwhile', 'Tes publicités ont changé pendant la préparation : rien n’a été enregistré, prépare les packs à nouveau.'));
        return;
      }
      // the sales page address is the seller's: a new copy keeps it
      await project.saveOutput('ads', { ...now.data, platforms: { ...copy, finalUrl: draft?.finalUrl ?? '' } });
    } catch (err) {
      setError((err as Error)?.message || t('cmpGenFailed', 'La génération a échoué. Réessaie dans un instant.'));
    } finally {
      setRunning(false);
    }
  };

  if (!saved || !draft) {
    const toAdapt = allConcepts.filter((c) => picked.includes(c.id));
    return (
      <GenerateState
        icon={Package}
        title={t('pkTitle', 'Packs TikTok, Snapchat et Google')}
        intro={stale
          ? t('pkStale', 'Tes concepts ont changé depuis la préparation des packs : prépare-les à nouveau pour qu’ils suivent.')
          : t('pkIntro', 'L’IA adapte tes concepts aux règles de chaque plateforme (longueur des textes, formats d’image, bouton conseillé). Tu télécharges un pack et tu l’importes toi-même dans le gestionnaire de publicités.')}
        running={running}
        runningText={t('pkRunning', 'L’IA adapte tes textes pour TikTok, Snapchat et Google… environ 30 secondes.')}
        error={error}
        onGenerate={() => void prepare(toAdapt.length ? toAdapt : allConcepts)}
        label={t('pkGenerate', 'Préparer les packs')}
      >
        {allConcepts.length > 1 && (
          <>
            <p className="mb-2 text-xs font-medium text-fg-muted">{t('pkPickConcepts', 'Concepts à adapter')}</p>
            <ChipToggles
              label={t('pkPickConcepts', 'Concepts à adapter')}
              options={allConcepts.map((c, i) => ({ value: c.id, label: c.angle || t('cmpConcept', 'Concept {n}', { n: i + 1 }) }))}
              values={picked}
              // one concept at least
              onChange={(values) => values.length && setPicked(values)}
            />
          </>
        )}
      </GenerateState>
    );
  }

  const dirty = !same(draft, saved);
  const save = async () => {
    setSaving(true);
    try {
      sent.current = draft;
      await project.saveOutput('ads', { ...output.data, platforms: draft });
      toast.success(t('cmpVersionSaved', 'Nouvelle version enregistrée.'));
    } catch (err) {
      sent.current = null;
      toast.error((err as Error).message || t('cmpSaveFailed', 'Modification non enregistrée. Réessaie.'));
    } finally {
      setSaving(false);
    }
  };

  const byId = new Map(allConcepts.map((c) => [c.id, c]));
  const packConcepts = draft.conceptIds.map((id) => byId.get(id)).filter((c): c is AdConcept => Boolean(c));
  const Pack = PACKS[platform];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <StatusChip state="ready" label={t('pkPrepared', 'Packs préparés {when}', { when: formatRelative(saved.createdAt, language) })} />
        {dirty && <span className="text-[13px] text-warning-ink">{t('pkUnsaved', 'Modifications non enregistrées')}</span>}
        <div className="ms-auto flex flex-wrap gap-2">
          {/* rewritten from the same concepts as the current packs */}
          <button type="button" onClick={() => void prepare(packConcepts)} disabled={running || saving} className="btn-dz-secondary !min-h-9 !py-1.5 !text-[13px] disabled:opacity-50">
            {running ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} {t('pkRedo', 'Refaire les textes')}
          </button>
          {dirty && (
            <button type="button" onClick={() => void save()} disabled={saving || running} className="btn-dz-primary !min-h-9 !py-1.5 !text-[13px] disabled:opacity-50">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {t('pkSave', 'Enregistrer les modifications')}
            </button>
          )}
        </div>
      </div>
      {error && <p role="alert" className="text-[13px] text-danger-ink">{error}</p>}
      <Pack copy={draft} onChange={setDraft} concepts={packConcepts} assets={assets} productName={p.productName || p.name} campaignName={p.name} language={p.language} />
    </div>
  );
}
