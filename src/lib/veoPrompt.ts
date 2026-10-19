/** The description sent to Google Veo to film one scene of a generated video script. */
export interface PromptScene {
  visual?: string;
  actorDirection?: string;
}

const MAX = 2000;

export function buildScenePrompt(scene: PromptScene, options: { productName: string; format: string }): string {
  const framing = options.format === '16:9' ? 'Landscape 16:9 video' : 'Vertical 9:16 smartphone video';
  // long descriptions are shortened first, so the closing instructions always fit
  const visual = (scene.visual ?? '').trim().slice(0, 1200);
  const action = (scene.actorDirection ?? '').trim().slice(0, 400);
  const parts = [
    `${framing} for a social media ad, realistic, natural light, smooth camera movement.`,
    visual ? `Scene: ${visual}` : `Scene: a person presents the product and uses it at home.`,
    action ? `Action: ${action}` : '',
    `Product: ${options.productName.trim() || 'the product in the photo'}.`,
    'No text, no subtitles and no logos in the picture.',
  ].filter(Boolean);
  const prompt = parts.join('\n');
  return prompt.length > MAX ? prompt.slice(0, MAX) : prompt;
}
