export type NavItem =
  | 'dashboard' | 'video' | 'landing' | 'assets' | 'assembler' | 'calculator'
  | 'settings' | 'contact'
  // built tools that are not linked from the sidebar
  | 'trends' | 'darja' | 'analyzer' | 'catalog' | 'scout' | 'calendar';

/** A sidebar entry; its picture comes from src/lib/sections.ts. */
export interface NavEntry {
  id: NavItem;
  /** Translation key + French fallback for the sidebar label. */
  labelKey: string;
  fallback: string;
}

export interface NavGroup {
  id: 'workspace' | 'studios' | 'library' | 'tools';
  labelKey: string;
  fallback: string;
  items: NavEntry[];
}

/** The sidebar, grouped the way people work: the overview, the studios that make content, their files, tools. */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'workspace',
    labelKey: 'navGroupWorkspace',
    fallback: 'Espace de travail',
    items: [
      { id: 'dashboard', labelKey: 'menuDashboard', fallback: 'Tableau de bord' },
    ],
  },
  {
    id: 'studios',
    labelKey: 'navGroupStudios',
    fallback: 'Studios',
    items: [
      { id: 'landing', labelKey: 'menuLanding', fallback: 'Landing pages' },
      { id: 'video', labelKey: 'menuVideo', fallback: 'Pubs vidéo' },
    ],
  },
  {
    id: 'library',
    labelKey: 'navGroupLibrary',
    fallback: 'Bibliothèque',
    items: [
      { id: 'assets', labelKey: 'menuAssets', fallback: 'Fichiers' },
    ],
  },
  {
    id: 'tools',
    labelKey: 'navGroupTools',
    fallback: 'Outils',
    items: [
      { id: 'assembler', labelKey: 'menuAssembler', fallback: 'Constructeur de page' },
      { id: 'calculator', labelKey: 'menuCalculator', fallback: 'Calcul de marge COD' },
    ],
  },
];

/** Every sidebar entry, in sidebar order. */
export const PRIMARY_NAV: NavEntry[] = NAV_GROUPS.flatMap((group) => group.items);

/** Page titles shown in the top bar (translation key + French fallback): the sidebar name for the pages it lists. */
export const TAB_TITLES: Record<NavItem, { key: string; fallback: string }> = {
  dashboard: { key: 'menuDashboard', fallback: 'Tableau de bord' },
  video: { key: 'menuVideo', fallback: 'Pubs vidéo' },
  landing: { key: 'menuLanding', fallback: 'Landing pages' },
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
  contact: { key: 'menuContact', fallback: 'Contact & support' },
};

/** The address of every page, so a refresh, the back button or a shared link opens the same screen. */
export const TAB_PATHS: Record<NavItem, string> = {
  dashboard: '/',
  landing: '/studio/landing',
  video: '/studio/video',
  assets: '/assets',
  assembler: '/tools/page-builder',
  calculator: '/tools/calculator',
  settings: '/settings',
  contact: '/support',
  trends: '/lab/trends',
  darja: '/lab/darja',
  analyzer: '/lab/analyzer',
  catalog: '/lab/catalog',
  scout: '/lab/scout',
  calendar: '/lab/calendar',
};

const PATH_TO_TAB = new Map(Object.entries(TAB_PATHS).map(([tab, path]) => [path, tab as NavItem]));

/** The page an address opens (unknown addresses, such as the old campaign pages, open the overview). */
export function tabFromPath(pathname: string): { tab: NavItem } {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return { tab: PATH_TO_TAB.get(path) ?? 'dashboard' };
}
