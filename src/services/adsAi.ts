/** Asks the AI for an ad pack (see lib/adPack.ts), through the same server proxy as every other tool. */
import { callGeminiWithRetry, MODEL_NAME, safeParseJSON } from './gemini';
import { buildAdPackPrompt, normalizeAdPack, type AdConcept, type AdPack } from '../lib/adPack';
import { buildPlatformCopyPrompt, normalizePlatformCopy, type PlatformCopy } from '../lib/adPlatforms';
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

/** The TikTok, Snapchat and Google versions of the concepts, in one AI call (see lib/adPlatforms.ts). */
export async function generatePlatformCopy(brief: BriefFields, brand: BrandFields | null, concepts: AdConcept[]): Promise<PlatformCopy> {
  const prompt = buildPlatformCopyPrompt(brief, brand, concepts);
  return callGeminiWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: 'application/json', maxOutputTokens: 8192 },
    });
    const parsed = safeParseJSON(response.text || '{}');
    const root = Array.isArray(parsed) && parsed.length === 1 ? parsed[0] : parsed;
    return normalizePlatformCopy(root, concepts, { brandName: brand?.brandName ?? '', productName: brief.productName || brief.name });
  });
}
