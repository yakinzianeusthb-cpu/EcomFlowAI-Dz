/**
 * The AI services that can make the images. Gemini is the main one and the default; the seller can pick another in
 * Paramètres: OpenAI's GPT Image, FLUX Kontext on fal.ai, FLUX.2 klein on Cloudflare Workers AI (free within a
 * daily allowance) or Pollinations (one key for many models, a fraction of a cent an image). Text and video stay
 * on Gemini.
 *
 * This file builds each service's request and reads its answer, without any network call (the server route makes
 * them, with the seller's key, which never leaves the server).
 */
export type ImageProvider = 'gemini' | 'openai' | 'fal' | 'cloudflare' | 'pollinations';
/** In the order the settings list them; the first is the default. */
export const IMAGE_PROVIDERS: readonly ImageProvider[] = ['gemini', 'openai', 'fal', 'cloudflare', 'pollinations'];
export const DEFAULT_IMAGE_PROVIDER: ImageProvider = 'gemini';

export const isImageProvider = (value: unknown): value is ImageProvider => IMAGE_PROVIDERS.includes(value as ImageProvider);

/** Brand names, the same in every language. */
export const IMAGE_PROVIDER_NAMES: Record<ImageProvider, string> = { gemini: 'Google Gemini', openai: 'OpenAI', fal: 'FLUX (fal.ai)', cloudflare: 'Cloudflare', pollinations: 'Pollinations' };

/**
 * Whether a service can start from the seller's photo and keep the product as it is. One that cannot only draws
 * from words, so it is never used where the page promises the real product (landing-page images, posters).
 */
export const KEEPS_PRODUCT: Record<ImageProvider, boolean> = { gemini: true, openai: true, fal: true, cloudflare: true, pollinations: true };

export const ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];
export const isAspectRatio = (value: unknown): value is AspectRatio => ASPECT_RATIOS.includes(value as AspectRatio);

/** GPT Image 2 and 2.5 take any size in multiples of 16 (ratio between 1:3 and 3:1): one per shape. */
export const OPENAI_SIZES: Record<AspectRatio, string> = {
  '1:1': '1024x1024', '2:3': '1024x1536', '3:2': '1536x1024', '3:4': '1152x1536', '4:3': '1536x1152',
  '4:5': '1024x1280', '5:4': '1280x1024', '9:16': '1008x1792', '16:9': '1792x1008', '21:9': '2016x864',
};
/** With the seller's photo, the model that edits most precisely; from words alone, the fast one; then GPT Image 2. */
export const OPENAI_EDIT_MODELS = ['gpt-image-2.5-sunburst', 'gpt-image-2'] as const;
export const OPENAI_DRAW_MODELS = ['gpt-image-2.5-flare', 'gpt-image-2'] as const;

/** FLUX Kontext's shapes on fal.ai; 4:5 and 5:4 are not offered, the nearest one is used. */
export const FAL_RATIOS: Record<AspectRatio, string> = {
  '1:1': '1:1', '2:3': '2:3', '3:2': '3:2', '3:4': '3:4', '4:3': '4:3',
  '4:5': '3:4', '5:4': '4:3', '9:16': '9:16', '16:9': '16:9', '21:9': '21:9',
};
/**
 * FLUX.2 klein 4B: it edits from the seller's photo, and an image costs about 125 of the 10,000 free daily Neurons
 * (about 80 images a day free). It takes multipart forms, even for a prompt alone.
 */
export const CLOUDFLARE_MODEL = '@cf/black-forest-labs/flux-2-klein-4b';
/** the longest prompt sent to Cloudflare */
export const CLOUDFLARE_PROMPT_MAX = 2048;
/** Its reference photos must be under 512 px a side; the browser shrinks them before sending (src/services/sectionImage.ts). */
export const CLOUDFLARE_REFERENCE_MAX = 511;
/** About one megapixel per shape, in multiples of 16 between 256 and 1920 a side. */
export const CLOUDFLARE_SIZES: Record<AspectRatio, string> = {
  '1:1': '1024x1024', '2:3': '832x1248', '3:2': '1248x832', '3:4': '896x1184', '4:3': '1184x896',
  '4:5': '912x1136', '5:4': '1136x912', '9:16': '768x1360', '16:9': '1360x768', '21:9': '1568x672',
};

/** When FLUX.2 klein is refused, an image from words alone is drawn by FLUX.1 schnell (JSON, words only). */
export const CLOUDFLARE_FALLBACK_MODEL = '@cf/black-forest-labs/flux-1-schnell';

/**
 * Pollinations' models, cheapest first: FLUX.2 klein (0.005 Pollen an image), then models open to free accounts.
 * With the seller's photo, only models that edit from it.
 */
export const POLLINATIONS_EDIT_MODELS = ['black-forest-labs/flux.2-klein-4b', 'black-forest-labs/flux.1-kontext-pro', 'openai/gpt-image-1-mini'] as const;
export const POLLINATIONS_DRAW_MODELS = ['black-forest-labs/flux.2-klein-4b', 'black-forest-labs/flux.1-schnell'] as const;

export const PROVIDER_HOSTS = {
  openai: 'https://api.openai.com',
  fal: 'https://fal.run',
  cloudflare: 'https://api.cloudflare.com',
  pollinations: 'https://gen.pollinations.ai',
} as const;

/** What a seller sends to make one image. */
export interface ImageRequest {
  prompt: string;
  /** the product photo, decoded from its data URL */
  reference: { data: string; mimeType: string } | null;
  aspectRatio: AspectRatio;
}

export interface ProviderCall {
  url: string;
  method: 'POST';
  headers: Record<string, string>;
  /** JSON text, or the multipart form of OpenAI's edits */
  body: string | FormData;
}

/** The longest prompt sent anywhere (the app's prompts are far shorter). */
export const PROMPT_MAX = 8000;
/** the photo limit, as for AI video */
export const REFERENCE_MAX_BYTES = 6 * 1024 * 1024;

const DATA_URL = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

/** The product photo as sent by the page: a PNG, JPG or WebP data URL under the size limit; null otherwise. */
export function readReference(value: unknown): ImageRequest['reference'] | 'invalid' {
  if (value == null || value === '') return null;
  const match = typeof value === 'string' ? DATA_URL.exec(value) : null;
  if (!match || (match[2].length * 3) / 4 > REFERENCE_MAX_BYTES) return 'invalid';
  return { mimeType: match[1], data: match[2] };
}

export function openAiCall(request: ImageRequest, key: string, model: string, host: string = PROVIDER_HOSTS.openai): ProviderCall {
  const headers = { Authorization: `Bearer ${key}` };
  const size = OPENAI_SIZES[request.aspectRatio];
  if (request.reference) {
    // edits take a multipart form; the photo goes as a file
    const form = new FormData();
    form.set('model', model);
    form.set('prompt', request.prompt);
    form.set('size', size);
    form.set('n', '1');
    form.set('output_format', 'jpeg');
    form.set('output_compression', '90');
    const extension = request.reference.mimeType.split('/')[1].replace('jpeg', 'jpg');
    const bytes = Uint8Array.from(atob(request.reference.data), (c) => c.charCodeAt(0));
    form.set('image', new Blob([bytes], { type: request.reference.mimeType }), `product.${extension}`);
    return { url: `${host}/v1/images/edits`, method: 'POST', headers, body: form };
  }
  return {
    url: `${host}/v1/images/generations`,
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: request.prompt, size, n: 1, output_format: 'jpeg', output_compression: 90 }),
  };
}

export function falCall(request: ImageRequest, key: string, host: string = PROVIDER_HOSTS.fal): ProviderCall {
  return {
    url: `${host}/fal-ai/flux-pro/kontext${request.reference ? '' : '/text-to-image'}`,
    method: 'POST',
    headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: request.prompt,
      ...(request.reference ? { image_url: `data:${request.reference.mimeType};base64,${request.reference.data}` } : {}),
      aspect_ratio: FAL_RATIOS[request.aspectRatio],
      output_format: 'jpeg',
      num_images: 1,
      // the picture comes back in the answer itself, nothing to download from elsewhere
      sync_mode: true,
      safety_tolerance: '2',
    }),
  };
}

/** A Cloudflare account id: 32 hexadecimal characters (it goes into the address, so nothing else is accepted). */
export const isCloudflareAccountId = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{32}$/i.test(value);

export function cloudflareCall(request: ImageRequest, accountId: string, token: string, host: string = PROVIDER_HOSTS.cloudflare): ProviderCall {
  const [width, height] = CLOUDFLARE_SIZES[request.aspectRatio].split('x');
  const form = new FormData();
  form.set('prompt', request.prompt.slice(0, CLOUDFLARE_PROMPT_MAX));
  form.set('width', width);
  form.set('height', height);
  if (request.reference) {
    const bytes = Uint8Array.from(atob(request.reference.data), (c) => c.charCodeAt(0));
    form.set('input_image_0', new Blob([bytes], { type: request.reference.mimeType }), `product.${request.reference.mimeType.split('/')[1]}`);
  }
  return { url: `${host}/client/v4/accounts/${accountId}/ai/run/${CLOUDFLARE_MODEL}`, method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form };
}

export function cloudflareSchnellCall(request: ImageRequest, accountId: string, token: string, host: string = PROVIDER_HOSTS.cloudflare): ProviderCall {
  return {
    url: `${host}/client/v4/accounts/${accountId}/ai/run/${CLOUDFLARE_FALLBACK_MODEL}`,
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: request.prompt.slice(0, CLOUDFLARE_PROMPT_MAX), steps: 4 }),
  };
}

/** Pollinations speaks OpenAI's image API: edits (multipart, with the photo) or generations (JSON). */
export function pollinationsImageCall(request: ImageRequest, key: string, model: string, host: string = PROVIDER_HOSTS.pollinations): ProviderCall {
  const size = CLOUDFLARE_SIZES[request.aspectRatio];
  if (request.reference) {
    const form = new FormData();
    form.set('model', model);
    form.set('prompt', request.prompt);
    form.set('size', size);
    form.set('response_format', 'b64_json');
    const bytes = Uint8Array.from(atob(request.reference.data), (c) => c.charCodeAt(0));
    form.set('image', new Blob([bytes], { type: request.reference.mimeType }), `product.${request.reference.mimeType.split('/')[1]}`);
    return { url: `${host}/v1/images/edits`, method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form };
  }
  return {
    url: `${host}/v1/images/generations`,
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: request.prompt, size, n: 1, response_format: 'b64_json' }),
  };
}

const IMAGE_DATA_URL = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

/** The image in a service's answer, as a data URL; null when there is none. */
export function readImage(provider: Exclude<ImageProvider, 'gemini'>, answer: unknown): string | null {
  const body = (answer ?? {}) as Record<string, any>;
  if (provider === 'openai') {
    const b64 = body.data?.[0]?.b64_json;
    return typeof b64 === 'string' && BASE64.test(b64) ? `data:image/jpeg;base64,${b64}` : null;
  }
  if (provider === 'fal') {
    const url = body.images?.[0]?.url;
    return typeof url === 'string' && IMAGE_DATA_URL.test(url) ? url : null;
  }
  if (provider === 'pollinations') {
    const b64 = body.data?.[0]?.b64_json;
    return typeof b64 === 'string' && BASE64.test(b64) ? `data:${pictureType(b64)};base64,${b64}` : null;
  }
  const b64 = body.result?.image;
  return typeof b64 === 'string' && BASE64.test(b64) ? `data:${pictureType(b64)};base64,${b64}` : null;
}

/** A base64 picture's type from its first bytes (PNG and WebP have their own); JPEG otherwise. */
const pictureType = (b64: string) => (b64.startsWith('iVBOR') ? 'image/png' : b64.startsWith('UklGR') ? 'image/webp' : 'image/jpeg');

/** The messages a seller can get (French, translated on the way out: src/i18n/serverMessages.ts). */
export const IMAGE_ERRORS = {
  noKey: "Ajoute la clé du service d'images choisi dans Paramètres.",
  badKey: "Le service d'images choisi refuse ta clé (mal copiée, expirée ou sans accès). Vérifie-la dans Paramètres.",
  noCredit: "Ton compte du service d'images choisi n'a plus de crédit, ou sa facturation n'est pas activée.",
  busy: "Le service d'images est occupé ou ta limite est atteinte. Réessaie dans un instant.",
  refused: "Le service d'images a refusé cette demande (règles de contenu). Essaie une autre photo ou une autre description.",
  failed: "Le service d'images n'a pas pu créer l'image. Réessaie.",
  noReference: "Ce service ne peut pas partir de ta photo : il ne garderait pas ton produit. Choisis Gemini, OpenAI ou FLUX dans Paramètres.",
  badRequest: "Demande d'image invalide.",
  badImage: "Image invalide : utilise une photo PNG, JPG ou WebP de moins de 6 Mo.",
  photoTooLarge: "Cloudflare demande une photo de moins de 512 px de côté. Recharge la page et réessaie : elle sera réduite toute seule.",
  geminiChosen: "Gemini est le service d'images choisi : cette demande passe par Gemini.",
} as const;

/** A service's refusal as the seller's message and the status to answer with; nothing of the service's text is passed on. */
export function providerError(status: number, text: string): { status: number; error: string } {
  const body = text.toLowerCase();
  if (/insufficient_quota|billing|payment|credit|balance|exhausted balance/.test(body) || status === 402) return { status: 402, error: IMAGE_ERRORS.noCredit };
  if (status === 401 || status === 403) return { status: 403, error: IMAGE_ERRORS.badKey };
  if (status === 429 || status === 503 || status === 529) return { status: 429, error: IMAGE_ERRORS.busy };
  if (/moderation|safety|content policy|nsfw|blocked/.test(body)) return { status: 422, error: IMAGE_ERRORS.refused };
  return { status: 502, error: IMAGE_ERRORS.failed };
}

/** An answer that means "this model is not available to this account": the next model is tried. */
export const isModelUnavailable = (status: number, text: string): boolean =>
  status === 404 || (status === 400 && /model|not found|does not exist/i.test(text)) || (status === 403 && /model|verif/i.test(text));
