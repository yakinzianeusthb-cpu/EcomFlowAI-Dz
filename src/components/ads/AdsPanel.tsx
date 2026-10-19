import { useEffect, useMemo, useState } from 'react';
import { Download, FileSpreadsheet, FolderInput, Loader2, Megaphone, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { formatRelative } from '../../i18n/dates';
import { AD_FORMATS, type AdFormat } from '../../lib/adCreative';
import { blobToDataUrl, renderCreativeBlob } from '../../lib/adCreativeRender';
import { adPackToCsv, creativeFileName } from '../../lib/adExport';
import type { AdConcept } from '../../lib/adPack';
import { assetsApi, type BrandKit } from '../../services/campaigns';
import { Segmented, Skeleton, StatusChip } from '../ui/primitives';
import type { ProjectHandle } from '../projects/useProject';
import type { AdsOutput, Generators } from '../projects/useGenerators';
import { GenerateState, VersionPicker } from '../projects/OutputControls';
import CreativeCard, { creativeInput, type CreativeAssets } from './CreativeCard';
import { useCreativeImages } from './useCreativeImages';
import '../../i18n/campaigns';

const saveFile = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

export default function AdsPanel({ project, gen, kit }: { project: ProjectHandle; gen: Generators; kit: BrandKit | null }) {
  const { t, language } = useLanguage();
  const toast = useToast();
  const p = project.detail!.project;
  const output = project.detail!.outputs.ads as { version: number; createdAt: string; data: AdsOutput } | undefined;
  const [format, setFormat] = useState<AdFormat>('square');
  const [selected, setSelected] = useState<string[]>(() => output?.data.selected ?? []);
  const [busy, setBusy] = useState<null | 'download' | 'library'>(null);
  const running = gen.status.ads === 'running';

  useEffect(() => setSelected(output?.data.selected ?? []), [output?.version]); // follow the saved version, not each new copy of the output object

  const images = useCreativeImages(project.detail!.assets.filter((a) => a.kind === 'product').map((a) => a.id), kit?.logoAssetId);

  const assets = useMemo<CreativeAssets | null>(
    () => (images ? { ...images, brandColor: kit?.colors?.[0], price: p.price || undefined, language: p.language, productName: p.productName || p.name } : null),
    [images, kit?.colors, p.price, p.language, p.productName, p.name],
  );

  if (!output || running) {
    return (
      <GenerateState
        icon={Megaphone}
        title={t('cmpAdsTitle', 'Tes publicités')}
        intro={t('cmpAdsIntro', 'L’IA propose 4 concepts publicitaires différents, avec textes prêts pour Facebook et Instagram. L’app les met en image avec tes photos et ta marque, aux formats carré, 4:5 et story.')}
        running={running}
        runningText={t('cmpAdsRunning', 'L’IA écrit les concepts… environ 30 secondes.')}
        error={gen.status.ads === 'failed' ? gen.errors.ads ?? '' : undefined}
        onGenerate={() => void gen.generateAds()}
        label={t('cmpGenerateAds', 'Générer les publicités')}
      />
    );
  }

  const pack = output.data.pack;
  const chosen = pack.concepts.filter((c) => selected.includes(c.id));
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const saveConcept = async (next: AdConcept) => {
    try {
      await project.saveOutput('ads', { pack: { ...pack, concepts: pack.concepts.map((c) => (c.id === next.id ? next : c)) }, selected });
      toast.success(t('cmpVersionSaved', 'Nouvelle version enregistrée.'));
    } catch (err) {
      toast.error((err as Error).message || t('cmpSaveFailed', 'Modification non enregistrée. Réessaie.'));
      throw err;
    }
  };

  const renderChosen = async (each: (blob: Blob, concept: AdConcept, index: number) => Promise<void>) => {
    if (!assets) return;
    for (const c of chosen) {
      const index = pack.concepts.indexOf(c);
      await each(await renderCreativeBlob(creativeInput(c, index, format, assets)), c, index);
    }
  };

  const downloadChosen = async () => {
    setBusy('download');
    try {
      await renderChosen(async (blob, _c, i) => {
        saveFile(blob, creativeFileName(p.productName || p.name, i + 1, format));
        await new Promise((r) => setTimeout(r, 350)); // browsers drop downloads fired too close together
      });
    } catch {
      toast.error(t('cmpDownloadFailed', 'Les visuels n’ont pas pu être créés. Réessaie.'));
    } finally {
      setBusy(null);
    }
  };

  const saveToLibrary = async () => {
    setBusy('library');
    let saved = 0;
    try {
      await renderChosen(async (blob, _c, i) => {
        const asset = await assetsApi.uploadDataUrl({ kind: 'creative', name: creativeFileName(p.productName || p.name, i + 1, format), dataUrl: await blobToDataUrl(blob), projectId: p.id });
        project.addAsset(asset);
        saved++;
      });
      toast.success(t('cmpSavedToLibrary', '{count} visuels enregistrés dans tes fichiers.', { count: saved }));
    } catch (err) {
      toast.error((err as Error).message || t('cmpLibraryFailed', 'Les visuels n’ont pas pu être enregistrés.'));
    } finally {
      setBusy(null);
    }
  };

  const exportCopy = () => saveFile(new Blob([adPackToCsv({ ...pack, concepts: chosen.length ? chosen : pack.concepts })], { type: 'text/csv;charset=utf-8' }), `${creativeFileName(p.productName || p.name, 0, format).replace(/-concept-0-.*$/, '')}-ads.csv`);

  return (
    <div className="space-y-6">
      {/* the concepts below are h3 cards: give them their section heading (read by screen readers, not shown) */}
      <h2 className="sr-only">{t('cmpAdsTitle', 'Tes publicités')}</h2>
      <div className="flex flex-wrap items-center gap-3">
        <StatusChip state="ready" label={`v${output.version} · ${formatRelative(output.createdAt, language)}`} />
        <VersionPicker project={project} kind="ads" />
        <Segmented<AdFormat>
          label={t('cmpAdFormat', 'Format des visuels')}
          value={format}
          onChange={setFormat}
          options={(Object.keys(AD_FORMATS) as AdFormat[]).map((f) => ({
            value: f,
            label: { square: t('cmpAdSquare', 'Carré 1:1'), portrait: t('cmpAdPortrait', 'Feed 4:5'), story: t('cmpAdStory', 'Story 9:16') }[f],
          }))}
        />
        <button type="button" onClick={() => void gen.generateAds()} className="btn-dz-secondary ms-auto !min-h-9 !py-1.5 !text-[13px]">
          <RefreshCw size={15} /> {t('cmpNewConcepts', 'Nouveaux concepts')}
        </button>
      </div>
      {gen.status.ads === 'failed' && <p role="alert" className="text-[13px] text-danger-ink">{gen.errors.ads || t('cmpGenFailed', 'La génération a échoué. Réessaie dans un instant.')}</p>}

      {!assets ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{pack.concepts.map((c) => <Skeleton key={c.id} className="aspect-square w-full" />)}</div>
      ) : (
        <div className={format === 'story' ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4' : 'grid gap-5 sm:grid-cols-2 xl:grid-cols-4'}>
          {pack.concepts.map((c, i) => (
            <CreativeCard key={c.id} concept={c} index={i} format={format} assets={assets} selected={selected.includes(c.id)} onToggle={() => toggle(c.id)} onSave={saveConcept} />
          ))}
        </div>
      )}

      <div className="ui-card flex flex-wrap items-center gap-3 p-4">
        <p className="me-auto text-[13px] text-fg-muted">{t('cmpSelectedCount', '{count} sur {total} choisis', { count: chosen.length, total: pack.concepts.length })}</p>
        <button type="button" onClick={exportCopy} className="btn-dz-secondary !min-h-9 !py-1.5 !text-[13px]"><FileSpreadsheet size={15} /> {t('cmpExportCopy', 'Exporter les textes (CSV)')}</button>
        <button type="button" onClick={saveToLibrary} disabled={!chosen.length || busy !== null} className="btn-dz-secondary !min-h-9 !py-1.5 !text-[13px] disabled:opacity-50">
          {busy === 'library' ? <Loader2 size={15} className="animate-spin" /> : <FolderInput size={15} />} {t('cmpSaveToLibrary', 'Enregistrer dans mes fichiers')}
        </button>
        <button type="button" onClick={downloadChosen} disabled={!chosen.length || busy !== null} className="btn-dz-primary !min-h-9 !py-1.5 !text-[13px] disabled:opacity-50">
          {busy === 'download' ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} {t('cmpDownloadChosen', 'Télécharger les visuels')}
        </button>
      </div>

      {(pack.audiences.length > 0 || pack.testPlan.length > 0) && (
        <section aria-labelledby="ads-suggestions" className="ui-card p-5">
          <h2 id="ads-suggestions" className="text-[15px] font-semibold text-fg">{t('cmpAiSuggestions', 'Suggestions de l’IA')}</h2>
          <p className="mt-1 text-xs text-fg-faint">{t('cmpSuggestionsNote', 'Des pistes à tester, pas des résultats mesurés.')}</p>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {pack.audiences.length > 0 && (
              <div>
                <h3 className="text-[13px] font-medium text-fg">{t('cmpAudiencesToTest', 'Audiences à tester')}</h3>
                <ul className="mt-2 space-y-1.5 text-[13px] text-fg-muted">{pack.audiences.map((a) => <li key={a} dir="auto">• {a}</li>)}</ul>
              </div>
            )}
            {pack.testPlan.length > 0 && (
              <div>
                <h3 className="text-[13px] font-medium text-fg">{t('cmpTestPlan', 'Plan de test')}</h3>
                <ul className="mt-2 space-y-1.5 text-[13px] text-fg-muted">{pack.testPlan.map((a) => <li key={a} dir="auto">• {a}</li>)}</ul>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
