/**
 * The ad pack: several distinct advertising concepts for one product, with Meta-ready copy.
 * The prompt asks for honest copy; the answer is cleaned up before anyone sees it (valid call to action,
 * length caps, no empty concepts).
 */
import type { BrandFields, BriefFields } from './campaignContext';

/** Call-to-action buttons offered (values of Meta's call_to_action.type). */
export const AD_CTAS = ['SHOP_NOW', 'ORDER_NOW', 'BUY_NOW', 'LEARN_MORE', 'GET_OFFER', 'SIGN_UP', 'CONTACT_US'] as const;
export type AdCta = (typeof AD_CTAS)[number];

/** `recommended`: what Meta shows before truncating. `max`: what we store. */
export const AD_LIMITS = {
  primaryText: { recommended: 125, max: 600 },
  headline: { recommended: 40, max: 90 },
  description: { recommended: 30, max: 120 },
  overlay: { recommended: 32, max: 60 },
  hook: { recommended: 80, max: 200 },
  angle: { recommended: 40, max: 80 },
  audience: { recommended: 120, max: 300 },
} as const;

export interface AdConcept {
  id: string;
  angle: string;
  hook: string;
  primaryText: string;
  headline: string;
  description: string;
  callToAction: AdCta;
  /** A few words written on the image. */
  overlay: string;
  audience: string;
}

export interface AdPack {
  concepts: AdConcept[];
  audiences: string[];
  testPlan: string[];
}

const COPY_LANGUAGE = {
  ar: 'arabe algérien (Darija) écrit en lettres arabes, compréhensible partout en Algérie',
  fr: 'français',
  en: 'anglais',
} as const;

const OBJECTIVE = {
  sales: 'ventes en paiement à la livraison',
  leads: 'collecte de contacts',
  traffic: 'visites vers la page produit',
  awareness: 'notoriété de la marque',
} as const;

const line = (label: string, value: string | undefined | null) => (value && value.trim() ? `- ${label} : ${value.trim()}\n` : '');

export function buildAdPackPrompt(brief: BriefFields, brand: BrandFields | null, count: number): string {
  return `
# RÔLE
Tu es directeur de création et media buyer senior Meta (Facebook et Instagram), spécialiste de l'e-commerce en paiement à la livraison en Algérie.

# PRODUIT ET CAMPAGNE
${line('Produit', brief.productName || brief.name)}${line('Description', brief.description)}${line('Prix', brief.price)}${line('Public cible', brief.audience || brand?.audience)}${line('Objectif', OBJECTIVE[brief.objective])}${line('Ton', brief.tone || brand?.tone)}${line('Marque', brand?.brandName)}${line('Consignes de la marque', brand?.instructions)}${line('Plateformes', brief.platforms.join(', '))}
# MISSION
Propose ${count} concepts publicitaires vraiment différents (angles distincts : problème et solution, démonstration, offre et urgence, preuve par l'usage, style de vie, comparaison...). Rédige tous les textes en ${COPY_LANGUAGE[brief.language]}.

# RÈGLES
- primaryText : ${AD_LIMITS.primaryText.recommended} caractères maximum de préférence ; la première phrase est l'accroche.
- headline : ${AD_LIMITS.headline.recommended} caractères maximum. description : ${AD_LIMITS.description.recommended} caractères maximum.
- overlay : 2 à 5 mots forts à écrire sur l'image.
- callToAction : une seule valeur parmi ${AD_CTAS.join(', ')}.
- Copie honnête : pas de faux avis ni de faux témoignages, pas de chiffres ou de résultats inventés, pas de promesse de santé.
- Mentionne le paiement à la livraison quand l'objectif est la vente.

# FORMAT : JSON UNIQUEMENT
{
  "concepts": [
    { "angle": "...", "hook": "...", "primaryText": "...", "headline": "...", "description": "...", "callToAction": "SHOP_NOW", "overlay": "...", "audience": "..." }
  ],
  "audiences": ["audience à tester 1", "audience à tester 2"],
  "testPlan": ["hypothèse de test 1", "hypothèse de test 2"]
}
`.trim();
}

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const list = (value: unknown, max: number) =>
  (Array.isArray(value) ? value : []).map((v) => text(v, 200)).filter(Boolean).slice(0, max);

/** Cleans the model's answer. Throws when nothing usable came back. */
export function normalizeAdPack(raw: unknown): AdPack {
  const root = Array.isArray(raw) ? { concepts: raw } : raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
  if (!root) throw new Error(''); // the interface shows its own translated message
  const rawConcepts = Array.isArray(root.concepts) ? root.concepts : root.concepts && typeof root.concepts === 'object' ? [root.concepts] : [];

  const concepts: AdConcept[] = [];
  for (const item of rawConcepts) {
    if (!item || typeof item !== 'object') continue;
    const c = item as Record<string, unknown>;
    const primaryText = text(c.primaryText, AD_LIMITS.primaryText.max);
    const headline = text(c.headline, AD_LIMITS.headline.max);
    if (!primaryText || !headline) continue;
    const cta = typeof c.callToAction === 'string' ? c.callToAction.trim().toUpperCase() : '';
    concepts.push({
      id: `c${concepts.length + 1}`,
      angle: text(c.angle, AD_LIMITS.angle.max),
      hook: text(c.hook, AD_LIMITS.hook.max),
      primaryText,
      headline,
      description: text(c.description, AD_LIMITS.description.max),
      callToAction: (AD_CTAS as readonly string[]).includes(cta) ? (cta as AdCta) : 'SHOP_NOW',
      overlay: text(c.overlay, AD_LIMITS.overlay.max) || headline.slice(0, AD_LIMITS.overlay.max),
      audience: text(c.audience, AD_LIMITS.audience.max),
    });
    if (concepts.length === 8) break;
  }
  if (!concepts.length) throw new Error(''); // the interface shows its own translated message
  return { concepts, audiences: list(root.audiences, 6), testPlan: list(root.testPlan, 6) };
}
