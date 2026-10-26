/**
 * The AI service that makes the seller's images, as chosen in Paramètres (Gemini by default), and the call to it
 * when it is not Gemini: POST /api/ai/image, where the server uses the seller's stored key. Gemini images keep going
 * through src/services/gemini.ts.
 */
import { translate } from '../i18n/runtime';
import { DEFAULT_IMAGE_PROVIDER, isImageProvider, type AspectRatio, type ImageProvider } from '../lib/imageProviders';
import { settingsApi } from './api';

/** The service the seller chose, read from the settings each time (it may have changed in another tab). */
export async function chosenImageProvider(): Promise<ImageProvider> {
  try {
    const settings = await settingsApi.get();
    return isImageProvider(settings?.imageProvider) ? settings.imageProvider : DEFAULT_IMAGE_PROVIDER;
  } catch {
    return DEFAULT_IMAGE_PROVIDER;
  }
}

/** One image from the chosen service (not Gemini). A refusal is thrown with its status, like the Gemini calls. */
export async function imageFromService(params: { prompt: string; reference?: string | null; aspectRatio: AspectRatio }): Promise<string> {
  let res: Response;
  try {
    res = await fetch('/api/ai/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: params.prompt, reference: params.reference ?? null, aspectRatio: params.aspectRatio }),
    });
  } catch {
    throw new Error(translate('shAiServerUnreachable', 'Impossible de joindre le serveur IA. Réessaie.'));
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || typeof data?.image !== 'string') {
    const err = new Error(data?.error || translate('shAiError', 'Erreur IA. Réessaie.')) as Error & { status?: number };
    err.status = res.ok ? 502 : res.status;
    throw err;
  }
  return data.image;
}
