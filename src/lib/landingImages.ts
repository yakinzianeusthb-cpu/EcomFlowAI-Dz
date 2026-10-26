/** The description sent to the image model for one landing-page section. */
export interface ImageSection {
  title?: string;
  prompt?: string;
  imagePrompt?: Partial<Record<'subject' | 'environment' | 'lighting' | 'textInstructions' | 'composition' | 'technical', string>>;
}

const MAX = 1800;
const RULES = 'Keep the exact product from the reference photo (same shape, colours and details). Professional e-commerce photo. No text, no letters, no logos.';

/** The scene the copywriter AI described for a section: its ready-made image prompt, its structured fields, or the title. */
function sceneOf(section: ImageSection): string {
  // the copywriter AI puts the ready-to-use image prompt inside a ``` block
  const fenced = /```(?:\w+)?\s*\n([\s\S]*?)```/.exec(section.prompt ?? '')?.[1]?.trim();
  const structured = section.imagePrompt
    ? ['subject', 'environment', 'lighting', 'composition'].map((k) => section.imagePrompt?.[k as keyof typeof section.imagePrompt]?.trim()).filter(Boolean).join('. ')
    : '';
  return fenced || structured || `Marketing photo of the product for a section titled "${(section.title ?? '').trim()}"`;
}

export function sectionImagePrompt(section: ImageSection): string {
  const body = sceneOf(section).slice(0, MAX - RULES.length - 2);
  return `${body}\n${RULES}`;
}

/** The shape of a poster of the long-image page: a tall opening, then the sections; all as wide as the strip. */
export const posterAspect = (hero: boolean) => (hero ? '2:3' : '4:5');

/** The words drawn on a poster: the section's own copy, which the seller can edit. */
export interface PosterText {
  headline: string;
  subline?: string;
  /** short feature labels, at most three are drawn */
  labels: string[];
  button: string;
}

const LANGUAGE_NAME = { ar: 'Arabic', fr: 'French', en: 'English' } as const;
const SCENE_MAX = 900;
// quotes would break the quoted words of the prompt; long words would not fit a poster
const clean = (text: string | undefined, max: number) => (text ?? '').replace(/["«»“”]/g, '').replace(/\s+/g, ' ').trim().slice(0, max).trim();

/**
 * The prompt for one poster of a long-image landing page (the Algerian "long photo" format): a vertical ad with the
 * section's headline, line, feature labels and button drawn in, over the scene the copywriter AI described, with the
 * product kept exactly as in the photo. Every poster of a page gets the same look and edges that continue, so stacked
 * they read as one long image. The words are copied as given, large only (image models garble small Arabic), and the
 * model is told to write nothing else: no price (it would go stale), and none of the customer counts, ratings or
 * reviews that nobody vouched for.
 */
export function posterImagePrompt(section: ImageSection, text: PosterText, options: { language: keyof typeof LANGUAGE_NAME; hero: boolean; colors: string[] }): string {
  const headline = clean(text.headline, 70);
  const subline = clean(text.subline, 90);
  const labels = text.labels.map((l) => clean(l, 32)).filter(Boolean).slice(0, 3);
  const button = clean(text.button, 32);
  const rtl = options.language === 'ar' ? ', written right to left with every letter correctly joined' : '';
  const words = [
    `Headline at the top, very bold, its last words in the highlight colour: "${headline}"`,
    subline && `Under it, a short line on a dark rounded pill: "${subline}"`,
    labels.length && `${labels.length} feature labels, each next to a round icon that matches it: ${labels.map((l) => `"${l}"`).join(' · ')}`,
    button && `Near the bottom, a big rounded call-to-action button with a cart icon: "${button}"`,
  ].filter(Boolean).map((line, i) => `${i + 1}. ${line}`);
  const [main, highlight] = options.colors;
  const look = main ? `a background in ${main} tones${highlight ? ` with ${highlight} highlights` : ''}` : 'a bold coloured background with bright highlights';
  const layout = options.hero
    ? 'the headline at the top; a large photo of a person using the product in a real Algerian setting; the features as round icons with their labels; the button at the bottom'
    : 'the headline at the top; a collage of 2 or 3 photos (the product in use, close-ups of its details); the features as rows, each with its round icon; the button at the bottom';
  return [
    `A vertical advertising poster (${posterAspect(options.hero)}): ${options.hero ? 'the opening' : 'one section'} of a long landing-page image for mobile phones that sells this product in Algeria. The sections of the page are stacked one under another and must read as one continuous image.`,
    'Product: keep the exact product from the reference photo (same shape, colours, materials and details); never replace it with another one.',
    `Scene: ${sceneOf(section).slice(0, SCENE_MAX)}`,
    `Layout: ${layout}.`,
    `Text drawn on the poster, in ${LANGUAGE_NAME[options.language]}${rtl}, copied exactly as given, large, bold and sharp, with no small print:`,
    ...words,
    `Look shared by every section of the page: ${look}, bold modern Arabic e-commerce typography with a soft shadow, the same round icon style, photographic quality; the top and bottom edges continue the background with no frame, no border, no rounded corners and no white margin, so the stacked sections join seamlessly.`,
    'Write no other words, letters or numbers anywhere: no prices, no customer counts, no ratings or stars, no reviews, no phone numbers, no website, no brand logos, no watermark.',
  ].join('\n');
}
