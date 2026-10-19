import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiError, assetsApi, brandApi, projectsApi, type AssetMeta, type BrandKit, type Project, type ProjectDetail, type ProjectInput } from '../../services/campaigns';
import type { OutputKind } from '../../lib/projectRules';

export type LoadState = 'loading' | 'ready' | 'missing' | 'error';

/** One campaign: loaded from the server, edited in place, outputs saved as new versions. */
export function useProject(projectId: string) {
  const [state, setState] = useState<LoadState>('loading');
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const detailRef = useRef(detail);
  detailRef.current = detail;
  const briefSeq = useRef(0);

  /** Loads (or refreshes) the campaign. A failed refresh keeps what is on screen and answers false. */
  const load = useCallback(async () => {
    try {
      setDetail(await projectsApi.get(projectId));
      setState('ready');
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setState('missing');
      else if (!detailRef.current) setState('error');
      return false;
    }
  }, [projectId]);

  useEffect(() => {
    setState('loading');
    void load();
  }, [load]);

  /**
   * Applies the edit at once (a generation started right after uses it), then keeps the server's copy. If the save
   * fails the fields go back to what they were; an older answer arriving after a newer edit is ignored.
   */
  const updateBrief = useCallback(async (input: ProjectInput) => {
    const seq = ++briefSeq.current;
    const current = detailRef.current?.project;
    const before = current ? (Object.fromEntries(Object.keys(input).map((k) => [k, current[k as keyof Project]])) as Partial<Project>) : {};
    setDetail((d) => (d ? { ...d, project: { ...d.project, ...input } } : d));
    try {
      const project = await projectsApi.update(projectId, input);
      if (seq === briefSeq.current) setDetail((d) => (d ? { ...d, project } : d));
      return project;
    } catch (err) {
      if (seq === briefSeq.current) setDetail((d) => (d ? { ...d, project: { ...d.project, ...before } } : d));
      throw err;
    }
  }, [projectId]);

  const addPhoto = useCallback(async (file: File) => {
    const asset = await assetsApi.uploadFile(file, { kind: 'product', projectId });
    setDetail((d) => (d ? { ...d, assets: [...d.assets, asset] } : d));
    return asset;
  }, [projectId]);

  const addAsset = useCallback((asset: AssetMeta) => {
    setDetail((d) => (d ? { ...d, assets: [...d.assets, asset] } : d));
  }, []);

  const removeAsset = useCallback(async (assetId: string) => {
    await assetsApi.remove(assetId);
    setDetail((d) => (d ? { ...d, assets: d.assets.filter((a) => a.id !== assetId) } : d));
  }, []);

  const saveOutput = useCallback(async (kind: OutputKind, data: object) => {
    const saved = await projectsApi.saveOutput(projectId, kind, data);
    setDetail((d) => {
      if (!d) return d;
      const versions = [{ id: saved.id, kind, version: saved.version, createdAt: saved.createdAt }, ...d.versions];
      return { ...d, outputs: { ...d.outputs, [kind]: { id: saved.id, version: saved.version, createdAt: saved.createdAt, data } }, versions };
    });
    return saved;
  }, [projectId]);

  /** Shows an older version (it becomes the current one only once saved again). */
  const openVersion = useCallback(async (kind: OutputKind, version: number) => {
    const v = await projectsApi.getVersion(projectId, kind, version);
    setDetail((d) => (d ? { ...d, outputs: { ...d.outputs, [kind]: { id: v.id, version: v.version, createdAt: v.createdAt, data: v.data } } } : d));
  }, [projectId]);

  return { state, detail, reload: load, updateBrief, addPhoto, addAsset, removeAsset, saveOutput, openVersion };
}

export type ProjectHandle = ReturnType<typeof useProject>;

// One request per account and page view, shared by every screen that needs the kit. Keyed by account so that
// signing out and in as someone else in the same tab never shows the previous person's brand.
let brandCache: { userId: string; promise: Promise<BrandKit> } | null = null;

/** The brand kit of the signed-in account. */
export function useBrandKit() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [kit, setKit] = useState<BrandKit | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    setFailed(false);
    if (!brandCache || brandCache.userId !== userId) {
      const promise = brandApi.get();
      brandCache = { userId, promise };
      promise.catch(() => {
        if (brandCache?.promise === promise) brandCache = null;
      });
    }
    brandCache.promise.then((k) => alive && setKit(k)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [userId, attempt]);

  const save = useCallback(async (input: Partial<BrandKit>) => {
    const next = await brandApi.save(input);
    brandCache = { userId, promise: Promise.resolve(next) };
    setKit(next);
    return next;
  }, [userId]);
  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return { kit, failed, retry, save };
}
