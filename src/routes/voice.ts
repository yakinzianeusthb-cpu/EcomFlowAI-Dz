/**
 * The voice-over of the videos: POST /api/ai/voice reads one line with the voice service the seller chose in
 * Paramètres (ElevenLabs or Pollinations), with their own stored key, and answers it as an MP3 data URL;
 * GET /api/ai/voices lists the voices that service offers. The key never leaves the server, and the service's own
 * words (which may quote part of the key) are logged redacted, never passed on. Tests point the services at a local
 * stand-in (VOICE_PROVIDERS_BASE_URL, ignored in production).
 */
import { Router, type RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { revealSecret } from '../lib/crypto';
import { refusalForLog } from '../lib/refusalLog';
import type { SessionPayload } from '../lib/session';
import {
  DEFAULT_POLLINATIONS_VOICE, DEFAULT_VOICE_PROVIDER, ELEVENLABS_MODELS, POLLINATIONS_VOICES, POLLINATIONS_VOICE_MODELS, VOICE_ERRORS, VOICE_HOSTS,
  elevenLabsSpeechCall, elevenLabsVoicesCall, isVoiceId, isVoiceModelUnavailable, isVoiceProvider, pollinationsSpeechCall, readElevenLabsVoices,
  readVoiceText, voiceError, type VoiceCall, type VoiceOption, type VoiceProvider,
} from '../lib/voiceProviders';

const VOICE_BASE = process.env.NODE_ENV !== 'production' ? process.env.VOICE_PROVIDERS_BASE_URL : undefined;
const voiceHost = (provider: VoiceProvider) => (VOICE_BASE ? `${VOICE_BASE}/${provider}` : VOICE_HOSTS[provider]);
const VOICE_TIMEOUT_MS = 90_000;
/** a scene's line is a few seconds of MP3; anything far bigger is not an answer we asked for */
const AUDIO_MAX_BYTES = 8 * 1024 * 1024;

/** A refusal already worded for the seller. */
class VoiceFailure extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

/** One call to a voice service; a refusal is thrown with the service's status and text (kept on the server). */
async function send(call: VoiceCall): Promise<Response> {
  const response = await fetch(call.url, { method: call.method, headers: call.headers, body: call.body || undefined, signal: AbortSignal.timeout(VOICE_TIMEOUT_MS) });
  if (!response.ok) throw Object.assign(new Error(`voice service answered ${response.status}`), { status: response.status, text: await response.text() });
  return response;
}

async function sendForAudio(call: VoiceCall): Promise<Buffer> {
  const response = await send(call);
  const type = (response.headers.get('content-type') ?? '').split(';')[0];
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!/^audio\//.test(type) || !bytes.length || bytes.length > AUDIO_MAX_BYTES) throw new VoiceFailure(502, VOICE_ERRORS.failed);
  return bytes;
}

/** Each model in turn until one speaks; `next` decides whether a refusal is worth trying the next model for. */
async function firstAudio(models: readonly string[], call: (model: string) => VoiceCall, next: (error: any) => boolean): Promise<Buffer> {
  for (const [i, model] of models.entries()) {
    try {
      return await sendForAudio(call(model));
    } catch (error: any) {
      if (i < models.length - 1 && !(error instanceof VoiceFailure) && next(error)) {
        console.warn('AI Voice model refused, trying the next one:', model, refusalForLog(error));
        continue;
      }
      throw error;
    }
  }
  throw new VoiceFailure(502, VOICE_ERRORS.failed);
}

/** The seller's voice service, the voice chosen there and the keys (decrypted here, used here only). */
async function voiceServiceOf(userId: string) {
  const row = await prisma.apiSettings.findUnique({ where: { userId }, select: { voiceProvider: true, voiceId: true, elevenlabsApiKey: true, pollinationsApiKey: true } });
  return {
    provider: isVoiceProvider(row?.voiceProvider) ? row.voiceProvider : DEFAULT_VOICE_PROVIDER,
    voiceId: isVoiceId(row?.voiceId) ? row.voiceId : null,
    elevenlabs: revealSecret(row?.elevenlabsApiKey),
    pollinations: revealSecret(row?.pollinationsApiKey),
  };
}
type VoiceService = Awaited<ReturnType<typeof voiceServiceOf>>;

async function elevenLabsVoices(key: string): Promise<VoiceOption[]> {
  return readElevenLabsVoices(await (await send(elevenLabsVoicesCall(key, voiceHost('elevenlabs')))).json());
}

/** The line read by the seller's service, with `voice` (or the one saved in Paramètres, or the service's first). */
async function speak(service: VoiceService, text: string, voice: string | null): Promise<Buffer> {
  if (service.provider === 'elevenlabs') {
    const key = service.elevenlabs;
    if (!key) throw new VoiceFailure(400, VOICE_ERRORS.noKey);
    const voiceId = voice ?? service.voiceId ?? (await elevenLabsVoices(key))[0]?.id;
    if (!voiceId) throw new VoiceFailure(400, VOICE_ERRORS.noVoice);
    return firstAudio(ELEVENLABS_MODELS, (model) => elevenLabsSpeechCall(text, key, voiceId, model, voiceHost('elevenlabs')), (e) => isVoiceModelUnavailable(e?.status, e?.text ?? ''));
  }
  const key = service.pollinations;
  if (!key) throw new VoiceFailure(400, VOICE_ERRORS.noKey);
  const chosen = POLLINATIONS_VOICES.find((v) => v.id === (voice ?? service.voiceId)) ?? POLLINATIONS_VOICES.find((v) => v.id === DEFAULT_POLLINATIONS_VOICE)!;
  // ElevenLabs v3 needs paid Pollen; a free account gets OpenAI's voice, with the stand-in of the voice chosen
  return firstAudio(POLLINATIONS_VOICE_MODELS, (model) => pollinationsSpeechCall(text, key, model.startsWith('openai/') ? chosen.openai : chosen.id, model, voiceHost('pollinations')),
    (e) => e?.status === 402 || isVoiceModelUnavailable(e?.status, e?.text ?? ''));
}

/** Answers a failure in the seller's words; the service's own words go to the logs only. */
function sendFailure(res: Parameters<RequestHandler>[1], error: any, provider: VoiceProvider) {
  if (error instanceof VoiceFailure) return res.status(error.status).json({ error: error.message });
  console.error('AI Voice Error:', provider, refusalForLog(error));
  if (error?.name === 'TimeoutError') return res.status(504).json({ error: VOICE_ERRORS.busy });
  const { status, error: message } = typeof error?.status === 'number' ? voiceError(error.status, error.text ?? '') : { status: 502, error: VOICE_ERRORS.failed };
  return res.status(status).json({ error: message });
}

/** The routes, behind the app's guards (sign-in, plan, AI rate limit) given in order. */
export function createVoiceRouter(guards: RequestHandler[]): Router {
  const router = Router();

  router.post('/api/ai/voice', ...guards, async (req, res) => {
    const text = readVoiceText(req.body?.text);
    const voice = req.body?.voiceId == null || req.body.voiceId === '' ? null : req.body.voiceId;
    if (!text || (voice !== null && !isVoiceId(voice))) return res.status(400).json({ error: VOICE_ERRORS.badRequest });
    const service = await voiceServiceOf((req.user as SessionPayload).sub);
    try {
      const audio = await speak(service, text, voice);
      res.json({ audio: `data:audio/mpeg;base64,${audio.toString('base64')}`, provider: service.provider });
    } catch (error) {
      sendFailure(res, error, service.provider);
    }
  });

  router.get('/api/ai/voices', ...guards, async (req, res) => {
    const service = await voiceServiceOf((req.user as SessionPayload).sub);
    try {
      if (service.provider === 'pollinations') {
        if (!service.pollinations) return res.status(400).json({ error: VOICE_ERRORS.noKey });
        return res.json({ provider: service.provider, selected: service.voiceId, voices: POLLINATIONS_VOICES.map(({ id, name, detail }) => ({ id, name, detail })) });
      }
      if (!service.elevenlabs) return res.status(400).json({ error: VOICE_ERRORS.noKey });
      res.json({ provider: service.provider, selected: service.voiceId, voices: (await elevenLabsVoices(service.elevenlabs)).slice(0, 100) });
    } catch (error) {
      sendFailure(res, error, service.provider);
    }
  });

  return router;
}
