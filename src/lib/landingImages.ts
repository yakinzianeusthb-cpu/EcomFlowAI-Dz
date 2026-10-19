/** The description sent to the image model for one landing-page section. */
export interface ImageSection {
  title?: string;
  prompt?: string;
  imagePrompt?: Partial<Record<'subject' | 'environment' | 'lighting' | 'textInstructions' | 'composition' | 'technical', string>>;
}

const MAX = 1800;
const RULES = 'Keep the exact product from the reference photo (same shape, colours and details). Professional e-commerce photo. No text, no letters, no logos.';

export function sectionImagePrompt(section: ImageSection): string {
  // the copywriter AI puts the ready-to-use image prompt inside a ``` block
  const fenced = /```(?:\w+)?\s*\n([\s\S]*?)```/.exec(section.prompt ?? '')?.[1]?.trim();
  const structured = section.imagePrompt
    ? ['subject', 'environment', 'lighting', 'composition'].map((k) => section.imagePrompt?.[k as keyof typeof section.imagePrompt]?.trim()).filter(Boolean).join('. ')
    : '';
  const description = fenced || structured || `Marketing photo of the product for a section titled "${(section.title ?? '').trim()}"`;
  const body = description.slice(0, MAX - RULES.length - 2);
  return `${body}\n${RULES}`;
}
