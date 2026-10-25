/**
 * The AI voices that read a video's voice-over: ElevenLabs (the seller's ElevenLabs key) or Pollinations (the same
 * key as the Pollinations images). This file builds each service's request and reads its answers, without any
 * network call: the server route makes them, with the seller's key, which never leaves the server.
 */
export type VoiceProvider = 'elevenlabs' | 'pollinations';
/** In the order the settings list them; the first is the default. */
export const VOICE_PROVIDERS: readonly VoiceProvider[] = ['elevenlabs', 'pollinations'];
export const DEFAULT_VOICE_PROVIDER: VoiceProvider = 'elevenlabs';
export const VOICE_PROVIDER_NAMES: Record<VoiceProvider, string> = { elevenlabs: 'ElevenLabs', pollinations: 'Pollinations' };

export const isVoiceProvider = (value: unknown): value is VoiceProvider => VOICE_PROVIDERS.includes(value as VoiceProvider);
/** A voice id goes into ElevenLabs' address: letters, digits, - and _ only. */
export const isVoiceId = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value);

/** One scene's line at most (ElevenLabs v3 takes 5,000 characters; a scene says far less). */
export const VOICE_TEXT_MAX = 2500;

/** The words to say, trimmed; null when there are none or too many. */
export function readVoiceText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text && text.length <= VOICE_TEXT_MAX ? text : null;
}

export const VOICE_HOSTS = {
  elevenlabs: 'https://api.elevenlabs.io',
  pollinations: 'https://gen.pollinations.ai',
} as const;

export interface VoiceCall {
  url: string;
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body: string;
}

/** v3 reads Arabic with expression; Multilingual v2 for an account that cannot use v3. */
export const ELEVENLABS_MODELS = ['eleven_v3', 'eleven_multilingual_v2'] as const;

export function elevenLabsSpeechCall(text: string, key: string, voiceId: string, model: string, host: string = VOICE_HOSTS.elevenlabs): VoiceCall {
  return {
    url: `${host}/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: model }),
  };
}

export function elevenLabsVoicesCall(key: string, host: string = VOICE_HOSTS.elevenlabs): VoiceCall {
  return { url: `${host}/v2/voices?page_size=100&sort=name&sort_direction=asc`, method: 'GET', headers: { 'xi-api-key': key }, body: '' };
}

export interface VoiceOption {
  id: string;
  name: string;
  /** gender, accent… as one short line */
  detail: string;
  /** a sample to listen to (ElevenLabs voices) */
  preview?: string;
}

const PREVIEW_URL = /^https:\/\/[a-z0-9.-]+\/\S+$/i;

/** The voices in ElevenLabs' answer; anything without a usable id is left out. */
export function readElevenLabsVoices(answer: unknown): VoiceOption[] {
  const voices = (answer as { voices?: unknown } | null)?.voices;
  if (!Array.isArray(voices)) return [];
  return voices.flatMap((v) => {
    const voice = (v ?? {}) as { voice_id?: unknown; name?: unknown; labels?: Record<string, unknown>; preview_url?: unknown };
    if (!isVoiceId(voice.voice_id)) return [];
    const detail = ['gender', 'age', 'accent'].map((k) => voice.labels?.[k]).filter((x): x is string => typeof x === 'string' && x.length > 0).join(' · ');
    const preview = typeof voice.preview_url === 'string' && PREVIEW_URL.test(voice.preview_url) ? voice.preview_url : undefined;
    return [{ id: voice.voice_id, name: typeof voice.name === 'string' ? voice.name.slice(0, 80) : voice.voice_id, detail, ...(preview ? { preview } : {}) }];
  });
}

/** ElevenLabs v3 through Pollinations (paid Pollen), then OpenAI's voice, open to free accounts. */
export const POLLINATIONS_VOICE_MODELS = ['elevenlabs/eleven-v3', 'openai/tts-1'] as const;

/** The voices offered with Pollinations: an ElevenLabs voice and its stand-in with OpenAI's model. */
export const POLLINATIONS_VOICES: readonly (VoiceOption & { openai: string })[] = [
  { id: 'sarah', name: 'Sarah', detail: 'female', openai: 'nova' },
  { id: 'charlotte', name: 'Charlotte', detail: 'female', openai: 'shimmer' },
  { id: 'lily', name: 'Lily', detail: 'female', openai: 'fable' },
  { id: 'adam', name: 'Adam', detail: 'male', openai: 'onyx' },
  { id: 'daniel', name: 'Daniel', detail: 'male', openai: 'echo' },
  { id: 'george', name: 'George', detail: 'male', openai: 'alloy' },
];
export const DEFAULT_POLLINATIONS_VOICE = POLLINATIONS_VOICES[0].id;

export function pollinationsSpeechCall(text: string, key: string, voice: string, model: string, host: string = VOICE_HOSTS.pollinations): VoiceCall {
  return {
    url: `${host}/v1/audio/speech`,
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ model, input: text, voice, response_format: 'mp3' }),
  };
}

/** The messages a seller can get (French, translated on the way out: src/i18n/serverMessages.ts). */
export const VOICE_ERRORS = {
  badRequest: "Écris le texte de la voix off (2 500 caractères au plus).",
  noKey: "Ajoute la clé du service de voix choisi dans Paramètres (Voix off).",
  badKey: "Le service de voix refuse ta clé (mal copiée, expirée ou sans accès). Vérifie-la dans Paramètres.",
  noCredit: "Ton compte du service de voix n'a plus de crédit pour ce mois, ou ce modèle demande un abonnement.",
  busy: "Le service de voix est occupé ou ta limite est atteinte. Réessaie dans un instant.",
  refused: "Le service de voix a refusé ce texte (règles de contenu). Modifie-le et réessaie.",
  failed: "Le service de voix n'a pas pu créer la voix. Réessaie.",
  noVoice: "Aucune voix trouvée sur ton compte ElevenLabs : ajoute une voix dans ta bibliothèque ElevenLabs.",
} as const;

/** A service's refusal as the seller's message and the status to answer with; nothing of the service's text is passed on. */
export function voiceError(status: number, text: string): { status: number; error: string } {
  const body = text.toLowerCase();
  if (status === 402 || /quota_exceeded|payment_required|insufficient|credits|paid_plan_required|subscription/.test(body)) return { status: 402, error: VOICE_ERRORS.noCredit };
  if (status === 401 || status === 403) return { status: 403, error: VOICE_ERRORS.badKey };
  if (status === 429 || status === 503) return { status: 429, error: VOICE_ERRORS.busy };
  if (/content_blocked|moderation|safety|blocked/.test(body)) return { status: 422, error: VOICE_ERRORS.refused };
  return { status: 502, error: VOICE_ERRORS.failed };
}

/** An answer that means "this model is not open to this account": the next model is tried. */
export const isVoiceModelUnavailable = (status: number, text: string): boolean =>
  status === 404 || ((status === 400 || status === 402 || status === 403 || status === 422) && /model|paid|tier|plan|access/i.test(text));
