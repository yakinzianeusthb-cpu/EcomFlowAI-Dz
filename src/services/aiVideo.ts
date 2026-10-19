/**
 * AI video clips with Google Veo, through the server (the user's Gemini key never reaches the browser).
 * A clip is a long-running job: start it, poll until it is done, then play or download it from the server.
 */
import { translate } from '../i18n/runtime';
import '../i18n/video';

export class AiVideoError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'AiVideoError';
  }
}

async function readError(res: Response): Promise<AiVideoError> {
  const data = await res.json().catch(() => ({}));
  return new AiVideoError(typeof data?.error === 'string' ? data.error : translate('shAiError', 'Erreur IA. Réessaie.'), res.status);
}

/** Starts filming one clip; resolves with the job token. */
export async function startAiClip(input: { prompt: string; aspectRatio: string; image?: string | null; signal?: AbortSignal }): Promise<string> {
  const res = await fetch('/api/ai/video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: input.prompt, aspectRatio: input.aspectRatio, image: input.image || undefined }),
    signal: input.signal,
  });
  if (!res.ok) throw await readError(res);
  const data = await res.json();
  return String(data.job);
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
  });

/** Waits for the clip; resolves with the address the video can be played or downloaded from. */
export async function waitForAiClip(job: string, options: { signal?: AbortSignal; intervalMs?: number; timeoutMs?: number } = {}): Promise<string> {
  const { signal, intervalMs = 8000, timeoutMs = 8 * 60_000 } = options;
  const path = `/api/ai/video/${encodeURIComponent(job)}`;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    await sleep(intervalMs, signal);
    const res = await fetch(path, { signal });
    if (!res.ok) throw await readError(res);
    const data = await res.json();
    if (data.done) return `${path}/file`;
  }
  throw new AiVideoError(translate('vmAiTimeout', 'Google met trop de temps à créer ce clip. Réessaie plus tard.'), 504);
}
