import type { ProjectLanguage, ProjectObjective, ProjectPlatform } from '../../lib/projectRules';
import type { OutputKind } from '../../lib/projectRules';
import '../../i18n/campaigns';

type T = (key: string, fallback: string, vars?: Record<string, string | number>) => string;

export const objectiveOptions = (t: T): { value: ProjectObjective; label: string }[] => [
  { value: 'sales', label: t('cmpObjSales', 'Ventes') },
  { value: 'leads', label: t('cmpObjLeads', 'Prospects') },
  { value: 'traffic', label: t('cmpObjTraffic', 'Visites') },
  { value: 'awareness', label: t('cmpObjAwareness', 'Notoriété') },
];

export const platformOptions = (t: T): { value: ProjectPlatform; label: string }[] => [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'snapchat', label: 'Snapchat' },
  { value: 'web', label: t('cmpPlatformWeb', 'Site web') },
];

export const languageOptions = (t: T): { value: ProjectLanguage; label: string }[] => [
  { value: 'ar', label: t('cmpLangAr', 'Arabe / darija') },
  { value: 'fr', label: t('cmpLangFr', 'Français') },
  { value: 'en', label: t('cmpLangEn', 'Anglais') },
];

export const outputLabel = (kind: OutputKind, t: T) =>
  ({
    landing: t('menuLanding', 'Landing pages'),
    video: t('cmpOutVideo', 'Vidéo'),
    ads: t('menuAds', 'Publicités'),
    meta_campaign: 'Meta',
  })[kind];
