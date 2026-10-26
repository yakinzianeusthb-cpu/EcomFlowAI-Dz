/**
 * The direction sent to Google's video model (Gemini Omni Flash) to film one scene of a generated video script.
 * Written in English, the language the model follows best; the words of the ad are added by the video maker as
 * captions, so the picture carries no text and the soundtrack no voice.
 */
export interface PromptScene {
  visual?: string;
  actorDirection?: string;
}

export interface PromptOptions {
  productName: string;
  format: string;
  /** position of the scene in the ad, to give each shot its role */
  index?: number;
  total?: number;
  durationSeconds?: number;
}

const MAX = 2000;

/** What each shot is for: the opening has to stop the scroll, the last one leaves the product on screen. */
function shotRole(index: number | undefined, total: number | undefined): string {
  if (index === undefined || total === undefined || total < 2) {
    return 'A single hero shot: reveal the product with a slow push-in, then show it in use.';
  }
  if (index === 0) return 'Opening shot: grab attention within the first second with a bold, dynamic reveal of the product (fast push-in or whip pan, striking light).';
  if (index === total - 1) return 'Final shot: a clean hero shot of the product on a simple, elegant background, slow orbit, ending on a steady frame of the product that leaves room for an end card.';
  return 'Middle shot: the product in use, real hands and close-ups of its details and of the result it gives, natural everyday setting.';
}

export function buildScenePrompt(scene: PromptScene, options: PromptOptions): string {
  const framing = options.format === '16:9' ? 'Landscape 16:9 video' : 'Vertical 9:16 smartphone video';
  const product = options.productName.trim() || 'the product in the photo';
  const seconds = options.durationSeconds ?? 8;
  // long descriptions are shortened first, so the fixed direction always fits
  const visual = (scene.visual ?? '').trim().slice(0, 700);
  const action = (scene.actorDirection ?? '').trim().slice(0, 300);
  const parts = [
    `${framing}, about ${seconds} seconds, for a premium social media ad: high-end commercial look, shot on a cinema camera, shallow depth of field, soft key light with a gentle rim light, rich true-to-life colours, smooth stabilised camera movement.`,
    shotRole(options.index, options.total),
    `Product: ${product}. Keep it exactly as in the photo (same shape, colours, materials, label and proportions); it is the hero of every frame and always in sharp focus.`,
    visual ? `Scene: ${visual}` : 'Scene: the product presented and used in a bright, modern home.',
    action ? `Action: ${action}` : '',
    'Sound: upbeat modern background music suited to a short ad, with subtle sound effects that match the action. No voice, no speech, no singing.',
    'No on-screen text, captions, subtitles, logos or watermarks. No children.',
  ].filter(Boolean);
  const prompt = parts.join('\n');
  return prompt.length > MAX ? prompt.slice(0, MAX) : prompt;
}
