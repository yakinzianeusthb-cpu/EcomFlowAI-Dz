import { History, Loader2, Lock, RefreshCw, Sparkles, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hasActivePlan } from '../../lib/access';
import { formatRelative } from '../../i18n/dates';
import { Skeleton } from '../ui/primitives';
import type { ProjectHandle } from './useProject';
import '../../i18n/campaigns';

// Controls shared by the landing page, video and ads tabs of a campaign.

/** Picks a saved version of an output. */
export function VersionPicker({ project, kind }: { project: ProjectHandle; kind: 'landing' | 'video' | 'ads' }) {
  const { t, language } = useLanguage();
  const toast = useToast();
  const versions = project.detail!.versions.filter((v) => v.kind === kind);
  const current = project.detail!.outputs[kind]?.version;
  if (versions.length < 2) return null;
  return (
    <label className="inline-flex items-center gap-2 text-[13px] text-fg-muted">
      <History size={14} aria-hidden="true" />
      <span className="sr-only">{t('cmpVersions', 'Versions')}</span>
      <select
        className="input-dz !w-auto !py-1.5 text-[13px]"
        value={current}
        onChange={(e) => project.openVersion(kind, Number(e.target.value)).catch(() => toast.error(t('cmpVersionFailed', 'Cette version n’a pas pu être ouverte.')))}
      >
        {versions.map((v) => (
          <option key={v.id} value={v.version}>{`v${v.version} · ${formatRelative(v.createdAt, language)}`}</option>
        ))}
      </select>
    </label>
  );
}

/** Shown before anything was generated, while it runs, or when it failed. */
export function GenerateState({ title, intro, running, runningText, error, onGenerate, label, icon: Icon }: {
  title: string;
  intro: string;
  running: boolean;
  runningText: string;
  error?: string;
  onGenerate: () => void;
  label: string;
  icon: LucideIcon;
}) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const locked = !hasActivePlan(user);
  if (running) {
    return (
      <div className="ui-card space-y-4 p-6" aria-busy="true">
        <p className="flex items-center gap-2 text-sm font-medium text-fg" role="status"><Loader2 size={16} className="animate-spin text-primary-ink" /> {runningText}</p>
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }
  return (
    <div className="ui-card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
      <span className="grid size-12 shrink-0 place-items-center rounded-[var(--radius-md)] bg-primary/10 text-primary-ink"><Icon size={22} /></span>
      <div className="min-w-0 flex-1">
        <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{intro}</p>
        {error !== undefined && (
          <p role="alert" className="mt-2 text-[13px] text-danger-ink">{error || t('cmpGenFailed', 'La génération a échoué. Réessaie dans un instant.')}</p>
        )}
      </div>
      {locked ? (
        <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('dz_open_checkout'))} className="btn-dz-secondary shrink-0"><Lock size={15} /> {t('sidebarSubUpgrade', 'Voir les plans')}</button>
      ) : (
        <button type="button" onClick={onGenerate} className="btn-dz-primary shrink-0">
          {error !== undefined ? <RefreshCw size={16} /> : <Sparkles size={16} />} {error !== undefined ? t('cmpRetry', 'Réessayer') : label}
        </button>
      )}
    </div>
  );
}
