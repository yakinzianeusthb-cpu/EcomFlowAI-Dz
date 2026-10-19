/** Asks the AI for an ad pack (see lib/adPack.ts), through the same server proxy as every other tool. */
import { callGeminiWithRetry, MODEL_NAME, safeParseJSON } from './gemini';
import { buildAdPackPrompt, normalizeAdPack, type AdPack } from '../lib/adPack';
import type { BrandFields, BriefFields } from '../lib/campaignContext';

export async function generateAdPack(
  brief: BriefFields,
  brand: BrandFields | null,
  options: { count?: number; photo?: { data: string; mimeType: string } | null } = {},
): Promise<AdPack> {
  const prompt = buildAdPackPrompt(brief, brand, options.count ?? 4);
  return callGeminiWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: options.photo ? [{ text: prompt }, { inlineData: options.photo }] : prompt,
      config: { responseMimeType: 'application/json', maxOutputTokens: 8192 },
    });
    const parsed = safeParseJSON(response.text || '{}');
    // some answers wrap the whole pack in a one-item list
    const root = Array.isArray(parsed) && parsed.length === 1 && parsed[0]?.concepts ? parsed[0] : parsed;
    return normalizeAdPack(root);
  });
}
