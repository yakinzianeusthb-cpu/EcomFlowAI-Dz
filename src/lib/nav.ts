import {
  BookImage,
  Clapperboard,
  Coins,
  FolderKanban,
  Layers,
  LayoutDashboard,
  Megaphone,
  Palette,
  Wand2,
  type LucideIcon,
} from 'lucide-react';

export type NavItem =
  | 'dashboard' | 'projects' | 'video' | 'landing' | 'ads' | 'brand' | 'assets' | 'assembler' | 'calculator'
  | 'settings' | 'contact'
  // built tools that are not linked from the sidebar
  | 'trends' | 'images' | 'darja' | 'analyzer' | 'catalog' | 'scout' | 'calendar';

export interface NavEntry {
  id: NavItem;
  /** Translation key + French fallback for the sidebar label. */
  labelKey: string;
  fallback: string;
  icon: LucideIcon;
}

export interface NavGroup {
  id: 'workspace' | 'studios' | 'library' | 'tools';
  labelKey: string;
  fallback: string;
  items: NavEntry[];
}

/** The sidebar, grouped the way people work: their campaigns, the studios that make content, their brand, tools. */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'workspace',
    labelKey: 'navGroupWorkspace',
    fallback: 'Espace de travail',
    items: [
      { id: 'dashboard', labelKey: 'menuDashboard', fallback: 'Tableau de bord', icon: LayoutDashboard },
      { id: 'projects', labelKey: 'menuProjects', fallback: 'Campagnes', icon: FolderKanban },
    ],
  },
  {
    id: 'studios',
    labelKey: 'navGroupStudios',
    fallback: 'Studios',
    items: [
      { id: 'landing', labelKey: 'menuLanding', fallback: 'Landing pages', icon: Wand2 },
      { id: 'video', labelKey: 'menuVideo', fallback: 'Pubs vidéo', icon: Clapperboard },
      { id: 'ads', labelKey: 'menuAds', fallback: 'Publicités', icon: Megaphone },
    ],
  },
  {
    id: 'library',
    labelKey: 'navGroupLibrary',
    fallback: 'Bibliothèque',
    items: [
      { id: 'brand', labelKey: 'menuBrand', fallback: 'Identité de marque', icon: Palette },
      { id: 'assets', labelKey: 'menuAssets', fallback: 'Fichiers', icon: BookImage },
    ],
  },
  {
    id: 'tools',
    labelKey: 'navGroupTools',
    fallback: 'Outils',
    items: [
      { id: 'assembler', labelKey: 'menuAssembler', fallback: 'Constructeur de page', icon: Layers },
      { id: 'calculator', labelKey: 'menuCalculator', fallback: 'Calcul de marge COD', icon: Coins },
    ],
  },
];

/** Every sidebar entry, in sidebar order. */
export const PRIMARY_NAV: NavEntry[] = NAV_GROUPS.flatMap((group) => group.items);

/** Page titles shown in the top bar (translation key + French fallback): the sidebar name for the pages it lists. */
export const TAB_TITLES: Record<NavItem, { key: string; fallback: string }> = {
  dashboard: { key: 'menuDashboard', fallback: 'Tableau de bord' },
  projects: { key: 'menuProjects', fallback: 'Campagnes' },
  video: { key: 'menuVideo', fallback: 'Pubs vidéo' },
  landing: { key: 'menuLanding', fallback: 'Landing pages' },
  ads: { key: 'menuAds', fallback: 'Publicités' },
  brand: { key: 'menuBrand', fallback: 'Identité de marque' },
  assets: { key: 'menuAssets', fallback: 'Fichiers' },
  assembler: { key: 'menuAssembler', fallback: 'Constructeur de page' },
  calculator: { key: 'menuCalculator', fallback: 'Calcul de marge COD' },
  trends: { key: 'tabTrends', fallback: 'Produits gagnants' },
  settings: { key: 'menuSettings', fallback: 'Paramètres' },
  darja: { key: 'tabDarja', fallback: 'Annonces Darja' },
  analyzer: { key: 'tabAnalyzer', fallback: 'Consultant expert IA' },
  catalog: { key: 'tabCatalog', fallback: 'Catalogue produits' },
  scout: { key: 'tabScout', fallback: 'Scout Telegram' },
  calendar: { key: 'tabCalendar', fallback: 'Calendrier de contenu' },
  images: { key: 'tabImages', fallback: 'Studio photos produit' },
  contact: { key: 'menuContact', fallback: 'Contact & support' },
};

/** The address of every page, so a refresh, the back button or a shared link opens the same screen. */
export const TAB_PATHS: Record<NavItem, string> = {
  dashboard: '/',
  projects: '/projects',
  landing: '/studio/landing',
  video: '/studio/video',
  ads: '/studio/ads',
  brand: '/brand',
  assets: '/assets',
  assembler: '/tools/page-builder',
  calculator: '/tools/calculator',
  settings: '/settings',
  contact: '/support',
  trends: '/lab/trends',
  images: '/lab/images',
  darja: '/lab/darja',
  analyzer: '/lab/analyzer',
  catalog: '/lab/catalog',
  scout: '/lab/scout',
  calendar: '/lab/calendar',
};

const PATH_TO_TAB = new Map(Object.entries(TAB_PATHS).map(([tab, path]) => [path, tab as NavItem]));
const PROJECT_PATH = /^\/projects\/([\w-]{1,64})$/;

export const projectPath = (id: string) => `/projects/${id}`;

/** The page an address opens (unknown addresses open the overview). */
export function tabFromPath(pathname: string): { tab: NavItem; projectId?: string } {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const project = PROJECT_PATH.exec(path);
  if (project) return { tab: 'projects', projectId: project[1] };
  if (path.startsWith('/projects/')) return { tab: 'projects' };
  return { tab: PATH_TO_TAB.get(path) ?? 'dashboard' };
}
