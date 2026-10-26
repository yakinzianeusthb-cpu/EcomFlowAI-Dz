/**
 * The videos' voice-over, read by the voice service chosen in Paramètres (src/routes/voice.ts): one line at a time,
 * answered as an MP3 data URL, and the voices that service offers.
 */
import { translate } from '../i18n/runtime';
import type { VoiceOption, VoiceProvider } from '../lib/voiceProviders';

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new Error(translate('shAiServerUnreachable', 'Impossible de joindre le serveur IA. Réessaie.'));
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    const err = new Error(data?.error || translate('shAiError', 'Erreur IA. Réessaie.')) as Error & { status?: number };
    err.status = res.ok ? 502 : res.status;
    throw err;
  }
  return data as T;
}

/** `text` read aloud, as an MP3 data URL; `voiceId` overrides the voice saved in Paramètres. */
export async function generateVoice(text: string, voiceId?: string | null): Promise<string> {
  const data = await call<{ audio?: unknown }>('/api/ai/voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId: voiceId || null }),
  });
  if (typeof data.audio !== 'string' || !data.audio.startsWith('data:audio/')) throw new Error(translate('shAiError', 'Erreur IA. Réessaie.'));
  return data.audio;
}

export interface VoiceList {
  provider: VoiceProvider;
  selected: string | null;
  voices: VoiceOption[];
}

/** The voices of the service saved in Paramètres (its key must be saved). */
export const listVoices = () => call<VoiceList>('/api/ai/voices');
