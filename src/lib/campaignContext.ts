/**
 * Turns a campaign brief and the brand kit into the inputs the existing generators already take, so the landing
 * page, the video and the ads all start from the same product facts. The generators' own prompts are untouched.
 */
import type { ProjectLanguage, ProjectObjective, ProjectPlatform } from './projectRules';

export interface BriefFields {
  name: string;
  productName: string;
  description: string;
  audience: string;
  objective: ProjectObjective;
  tone: string;
  platforms: ProjectPlatform[];
  language: ProjectLanguage;
  price: string;
}

export interface BrandFields {
  brandName: string;
  colors: string[];
  tone: string;
  audience: string;
  instructions: string;
  styles: string[];
}

/** The language values the landing page generator understands. */
export const LANDING_LANGUAGE: Record<ProjectLanguage, string> = {
  ar: 'Arabe / Darija Algérienne',
  fr: 'Français',
  en: 'Anglais',
};

/** The video styles of the video tool (its prompt reads these exact names). */
export const VIDEO_STYLES = [
  'User-Generated Content (UGC)',
  'Studio Premium & Cinematic',
  'Démonstration & Test (Crash test)',
  'Unboxing ASMR & Mystère',
  'Témoignage Client Réaliste',
] as const;

const PAGE_TYPE: Record<ProjectObjective, string> = {
  sales: 'Page de Vente Directe',
  leads: 'Opt-in / Pre-sell',
  traffic: 'Landing Page Classique',
  awareness: 'Landing Page Classique',
};

const OBJECTIVE_ANGLE: Record<ProjectObjective, string> = {
  sales: 'Vente directe en paiement à la livraison',
  leads: 'Collecte de contacts intéressés',
  traffic: 'Visites qualifiées vers la page produit',
  awareness: 'Faire connaître la marque et le produit',
};

function designStyle(styles: string[]): string | undefined {
  if (styles.includes('minimal')) return 'Moderne / Minimaliste';
  if (styles.includes('tech')) return 'Brutalist / High-tech';
  if (styles.includes('luxury') || styles.includes('classic')) return 'Élégant / Classique';
  if (styles.includes('playful') || styles.includes('bold')) return 'Coloré / Dynamique';
  return undefined;
}

const describe = (brief: BriefFields, brand: BrandFields | null) =>
  [
    brief.description,
    brief.price && `Prix : ${brief.price}`,
    brand?.instructions && `Consignes de la marque : ${brand.instructions}`,
  ].filter(Boolean).join('\n');

/** Input for generateLandingPageCopy (services/gemini.ts). */
export function landingInputFromBrief(brief: BriefFields, brand: BrandFields | null) {
  const styles = brand?.styles ?? [];
  return {
    name: brief.productName || brief.name,
    brand: brand?.brandName || undefined,
    description: describe(brief, brand),
    targetAudience: brief.audience || brand?.audience || undefined,
    tone: brief.tone || brand?.tone || undefined,
    colorPalette: brand?.colors?.length ? brand.colors : undefined,
    language: LANDING_LANGUAGE[brief.language],
    marketingAngle: styles.includes('luxury') ? 'Luxe Accessible' : undefined,
    designStyle: designStyle(styles),
    pageType: PAGE_TYPE[brief.objective],
    targetMarket: 'Algérie',
    funnelStrategy: 'AIDA',
    numSections: 6,
  };
}

/** The product sheet the video tool sends to generateVideoAdScript, written the same way. */
export function videoContextFromBrief(
  brief: BriefFields,
  brand: BrandFields | null,
  options: { style: string; format: string; duration: string },
): string {
  return `
=== FICHE D'ANALYSE PRODUIT COMPLÈTE ===
Nom commercial du Produit : ${brief.productName || brief.name}
Description, caractéristiques & points forts : ${describe(brief, brand) || brief.name}
Prix promotionnel conseillé : ${brief.price || 'Non précisé'}

=== CAHIER DES CHARGES PUBLICITAIRE ===
Type de Vidéo (Esthétique) : ${options.style}
Durée ciblée : ${options.duration}
Format géométrique d'écran : ${options.format}

=== STRATÉGIE MARKETING ET CIBLAGE (DZ) ===
Angle Marketing Majeur : ${OBJECTIVE_ANGLE[brief.objective]}
Marché Ciblé (Audience Idéale en Algérie) : ${brief.audience || brand?.audience || 'Grand public'}
Ton de la marque : ${brief.tone || brand?.tone || 'Persuasif'}
`.trim();
}
