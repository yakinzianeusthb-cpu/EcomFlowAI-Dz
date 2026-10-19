import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookImage, Download, FolderOpen, Loader2, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { DATE_LOCALE, formatRelative } from '../../i18n/dates';
import { projectPath } from '../../lib/nav';
import { cn } from '../../lib/utils';
import { assetDownloadUrl, assetsApi, assetUrl, type AssetMeta, type AssetPage } from '../../services/campaigns';
import PageHeader from '../PageHeader';
import { ConfirmButton, EmptyState, ImageDrop, Segmented, Skeleton } from '../ui/primitives';
import '../../i18n/campaigns';

type KindFilter = 'all' | 'product' | 'creative' | 'logo' | 'ai_image';

const formatBytes = (bytes: number, language: keyof typeof DATE_LOCALE) => {
  const locale = DATE_LOCALE[language];
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toLocaleString(locale, { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(bytes / 1024)).toLocaleString(locale)} KB`;
};

/** Every stored image: product photos, ad creatives, logos and AI images, with their campaign. */
export default function AssetLibrary() {
  const { t, language } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const [kind, setKind] = useState<KindFilter>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState<AssetPage | null>(null);
  const [items, setItems] = useState<AssetMeta[]>([]);
  const [failed, setFailed] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploading, setUploading] = useState(0);
  const debounce = useRef<number | undefined>(undefined);
  // only the newest request may fill the list: an answer for an older search or filter is dropped
  const requestId = useRef(0);

  const load = useCallback(async (cursor?: string) => {
    const id = ++requestId.current;
    setFailed(false);
    try {
      const next = await assetsApi.list({ kind: kind === 'all' ? undefined : kind, q: query.trim() || undefined, cursor });
      if (id !== requestId.current) return;
      setPage(next);
      setItems((prev) => (cursor ? [...prev, ...next.items] : next.items));
    } catch {
      if (id === requestId.current) setFailed(true);
    }
  }, [kind, query]);

  useEffect(() => {
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => { setPage(null); void load(); }, query ? 300 : 0);
    return () => window.clearTimeout(debounce.current);
  }, [load, query]);

  const remove = async (asset: AssetMeta) => {
    try {
      await assetsApi.remove(asset.id);
      setItems((list) => list.filter((a) => a.id !== asset.id));
      setPage((p) => (p ? { ...p, storage: { ...p.storage, used: Math.max(0, p.storage.used - asset.size) } } : p));
    } catch (err) {
      toast.error((err as Error).message || t('cmpDeleteFailed', 'Suppression impossible. Réessaie.'));
    }
  };

  const upload = async (files: File[]) => {
    setUploading(files.length);
    for (const file of files) {
      try {
        await assetsApi.uploadFile(file, { kind: 'product' });
      } catch (err) {
        toast.error((err as Error).message || t('cmpUploadFailed', 'Une photo n’a pas pu être envoyée.'));
      }
      setUploading((n) => n - 1);
    }
    void load();
  };

  const kindLabel = (k: AssetMeta['kind']) =>
    ({ product: t('libKindProduct', 'Photo produit'), creative: t('libKindCreative', 'Visuel pub'), logo: t('libKindLogo', 'Logo'), ai_image: t('libKindAi', 'Image IA'), other: t('libKindOther', 'Autre') })[k];
  const storage = page?.storage;
  const usedShare = storage ? Math.min(100, (storage.used / storage.quota) * 100) : 0;

  return (
    <div className="space-y-8">
      <PageHeader icon={BookImage} title={t('menuAssets', 'Fichiers')} subtitle={t('libSubtitle', 'Toutes tes photos produit, tes visuels publicitaires et ton logo, au même endroit.')} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Segmented<KindFilter>
              label={t('libFilter', 'Type de fichier')}
              value={kind}
              onChange={setKind}
              options={[
                { value: 'all', label: t('libAll', 'Tout') },
                { value: 'product', label: t('libProducts', 'Photos produit') },
                { value: 'creative', label: t('libCreatives', 'Visuels pub') },
                { value: 'logo', label: t('libLogos', 'Logos') },
                { value: 'ai_image', label: t('libAiImages', 'Images IA') },
              ]}
            />
            <label className="relative ms-auto min-w-48 flex-1 sm:max-w-64">
              <span className="sr-only">{t('libSearch', 'Rechercher un fichier')}</span>
              <Search size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-fg-faint" aria-hidden="true" />
              <input className="input-dz !ps-9" placeholder={t('libSearch', 'Rechercher un fichier')} value={query} onChange={(e) => setQuery(e.target.value)} maxLength={80} />
            </label>
          </div>

          {failed ? (
            <EmptyState icon={RefreshCw} title={t('libLoadFailed', 'Impossible de charger tes fichiers.')} action={<button type="button" onClick={() => void load()} className="btn-dz-secondary">{t('cmpRetry', 'Réessayer')}</button>} />
          ) : page === null ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-square w-full" />)}</div>
          ) : items.length === 0 ? (
            <EmptyState icon={BookImage} title={query || kind !== 'all' ? t('libNoMatch', 'Aucun fichier ne correspond.') : t('libEmpty', 'Ta bibliothèque est vide.')} body={!query && kind === 'all' ? t('libEmptyText', 'Les photos ajoutées à tes campagnes et les visuels enregistrés depuis l’onglet Publicités apparaissent ici.') : undefined} />
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {items.map((a) => (
                <li key={a.id} className="ui-card group flex flex-col overflow-hidden">
                  <a href={assetUrl(a.id)} target="_blank" rel="noopener noreferrer" className={cn('relative block aspect-square overflow-hidden', a.kind === 'logo' ? 'bg-white' : 'bg-surface-2')}>
                    <img src={assetUrl(a.id)} alt={a.name} loading="lazy" decoding="async" className={cn('size-full transition-transform duration-500 group-hover:scale-[1.03]', a.kind === 'logo' ? 'object-contain p-4' : 'object-cover')} />
                    <span className="absolute start-2 top-2 rounded-[var(--radius-xs)] bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">{kindLabel(a.kind)}</span>
                  </a>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="truncate text-[13px] font-medium text-fg" title={a.name}>{a.name}</p>
                    <p className="mt-0.5 text-xs text-fg-faint">{formatRelative(a.createdAt, language)} · {formatBytes(a.size, language)}</p>
                    {a.projectName && (
                      <button type="button" onClick={() => navigate(projectPath(a.projectId!))} className="mt-1 inline-flex items-center gap-1 truncate text-start text-xs font-medium text-primary-ink hover:underline">
                        <FolderOpen size={12} className="shrink-0" /> <span className="truncate">{a.projectName}</span>
                      </button>
                    )}
                    <div className="mt-auto flex items-center justify-end gap-1 pt-2">
                      <a href={assetDownloadUrl(a.id)} aria-label={t('libDownload', 'Télécharger {name}', { name: a.name })} className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-fg-muted hover:bg-surface-2 hover:text-fg"><Download size={15} /></a>
                      <ConfirmButton icon={Trash2} label="" ariaLabel={t('libDeleteName', 'Supprimer {name}', { name: a.name })} confirmLabel={t('libDeleteConfirm', 'Supprimer')} cancelLabel={t('cmpCancel', 'Annuler')} onConfirm={() => void remove(a)} className="!px-2" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {page?.nextCursor && (
            <div className="flex justify-center">
              <button type="button" disabled={loadingMore} onClick={async () => { setLoadingMore(true); await load(page.nextCursor!); setLoadingMore(false); }} className="btn-dz-secondary">
                {loadingMore && <Loader2 size={15} className="animate-spin" />} {t('libMore', 'Afficher plus')}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-0">
          <ImageDrop onFiles={upload} label={uploading ? t('cmpUploadingOne', 'Envoi de la photo…') : t('libUpload', 'Ajouter des photos produit')} hint={t('cmpPhotoFormats', 'JPG, PNG ou WebP · glisse-les ici ou clique')} disabled={uploading > 0} />
          {storage && (
            <div className="ui-card p-4">
              <p className="flex justify-between text-[13px]"><span className="font-medium text-fg">{t('libStorage', 'Stockage')}</span><span className="tabular-nums text-fg-muted">{formatBytes(storage.used, language)} / {formatBytes(storage.quota, language)}</span></p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fg/10" role="progressbar" aria-valuenow={Math.round(usedShare)} aria-valuemin={0} aria-valuemax={100} aria-label={t('libStorage', 'Stockage')}>
                <div className={cn('h-full rounded-full', usedShare > 90 ? 'bg-danger' : 'bg-primary')} style={{ width: `${Math.max(1, usedShare)}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
