/**
 * Calls a text engine other than Gemini (src/lib/textEngines.ts) with the seller's own key, and lists a service's
 * current models for the settings page. Server only: the keys never leave it. Claude goes through Anthropic's
 * official SDK; OpenAI through its Responses API; Mistral, DeepSeek, xAI and OpenRouter through their
 * chat-completions APIs. Tests point every service at a local stand-in (TEXT_PROVIDERS_BASE_URL, ignored in
 * production).
 */
import Anthropic from '@anthropic-ai/sdk';
import {
  EngineRefusal, chatCompletionsBody, engineError, openAiResponsesBody, readChatCompletions, readOpenAiResponses, toGeminiShape, unfenceJson,
  type ChatRequest, type GeminiShapedAnswer,
} from './textEngineRequest';
import { TEXT_ENGINES, TEXT_ENGINE_ERRORS, type TextProvider } from './textEngines';

type HostedProvider = Exclude<TextProvider, 'gemini' | 'anthropic'>;
const HOSTS: Record<HostedProvider, string> = {
  openai: 'https://api.openai.com/v1',
  mistral: 'https://api.mistral.ai/v1',
  deepseek: 'https://api.deepseek.com',
  xai: 'https://api.x.ai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
};
const STAND_IN = process.env.NODE_ENV !== 'production' ? process.env.TEXT_PROVIDERS_BASE_URL : undefined;
const hostOf = (provider: HostedProvider) => (STAND_IN ? `${STAND_IN}/${provider}` : HOSTS[provider]);

/** long landing pages can take a while to write */
const TIMEOUT_MS = 170_000;
const LIST_TIMEOUT_MS = 20_000;
const MAX_TOKENS = 16_000;
/** Claude models that take the server-side fallback on a safety decline ("default" routes it by category) */
const FALLBACK_MODELS = new Set(['claude-opus-5-5', 'claude-fable-5-1', 'claude-opus-5', 'claude-sonnet-5-5']);

/** A refusal from a text engine, already in the words and status sent to the seller. */
export class TextEngineError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'TextEngineError';
  }
}

async function postJson(url: string, key: string, body: unknown, extraHeaders: Record<string, string> = {}): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, ...extraHeaders },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new TextEngineError(504, TEXT_ENGINE_ERRORS.busy);
  }
  const text = await response.text();
  if (!response.ok) {
    // the service's own words stay here: they can quote part of the key
    console.error(`Text engine answered ${response.status}`);
    const { status, error } = engineError(response.status, text);
    throw new TextEngineError(status, error);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new TextEngineError(502, TEXT_ENGINE_ERRORS.failed);
  }
}

const OPENROUTER_HEADERS = { 'X-Title': 'EcomFlow AI' };

function anthropicClient(key: string) {
  return new Anthropic({ apiKey: key, maxRetries: 1, timeout: TIMEOUT_MS, ...(STAND_IN ? { baseURL: `${STAND_IN}/anthropic` } : {}) });
}

async function callClaude(key: string, model: string, req: ChatRequest): Promise<{ text: string; totalTokens: number }> {
  const client = anthropicClient(key);
  const messages: Anthropic.Beta.BetaMessageParam[] = req.messages.map((m) => ({
    role: m.role,
    content: m.parts.map((p) =>
      p.image
        ? { type: 'image' as const, source: { type: 'base64' as const, media_type: p.image.mimeType as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif', data: p.image.data } }
        : { type: 'text' as const, text: p.text ?? '' },
    ),
  }));
  const current = /^claude-(fable|opus|sonnet|haiku)-5/.test(model);
  const withFallback = FALLBACK_MODELS.has(model);
  try {
    const response = await client.beta.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      ...(req.system ? { system: req.system } : {}),
      messages,
      // current models think adaptively; a medium effort keeps copywriting quick and affordable
      ...(current ? { output_config: { effort: 'medium' as const } } : {}),
      ...(withFallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
    });
    if (response.stop_reason === 'refusal') throw new EngineRefusal('refused');
    const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
    return { text, totalTokens: (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0) };
  } catch (err) {
    if (err instanceof EngineRefusal) throw err;
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) throw new TextEngineError(400, TEXT_ENGINE_ERRORS.badKey);
    if (err instanceof Anthropic.NotFoundError) throw new TextEngineError(400, TEXT_ENGINE_ERRORS.model);
    if (err instanceof Anthropic.RateLimitError) throw new TextEngineError(429, TEXT_ENGINE_ERRORS.busy);
    if (err instanceof Anthropic.APIError) {
      console.error(`Claude answered ${err.status}`);
      const { status, error } = engineError(err.status ?? 502, err.message ?? '');
      throw new TextEngineError(status, error);
    }
    if (err instanceof Anthropic.APIConnectionError) throw new TextEngineError(504, TEXT_ENGINE_ERRORS.busy);
    throw err;
  }
}

/** One answer from `provider`, in Gemini's shape (JSON answers unwrapped from a markdown fence). */
export async function callTextEngine(provider: Exclude<TextProvider, 'gemini'>, key: string, model: string, req: ChatRequest): Promise<GeminiShapedAnswer> {
  let answer: { text: string; totalTokens: number };
  try {
    if (provider === 'anthropic') answer = await callClaude(key, model, req);
    else if (provider === 'openai') answer = readOpenAiResponses(await postJson(`${hostOf('openai')}/responses`, key, openAiResponsesBody(model, req)));
    else {
      const body = chatCompletionsBody(provider, model, req, TEXT_ENGINES[provider].vision);
      answer = readChatCompletions(await postJson(`${hostOf(provider)}/chat/completions`, key, body, provider === 'openrouter' ? OPENROUTER_HEADERS : {}));
    }
  } catch (err) {
    if (err instanceof EngineRefusal) throw new TextEngineError(422, TEXT_ENGINE_ERRORS.refused);
    throw err;
  }
  if (!answer.text.trim()) throw new TextEngineError(502, TEXT_ENGINE_ERRORS.failed);
  return toGeminiShape(req.json ? unfenceJson(answer.text) : answer.text, answer.totalTokens);
}

/** Model ids that do not write text (images, audio, embeddings...), left out of the lists. */
const NOT_TEXT = /(embed|tts|whisper|transcri|audio|realtime|dall-e|image|imagine|video|moderation|search|ocr|vision-preview|computer-use)/i;

/** The service's current text models, newest names first as the service lists them, for the settings page. */
export async function listTextModels(provider: Exclude<TextProvider, 'gemini'>, key: string): Promise<string[]> {
  if (provider === 'anthropic') {
    const ids: string[] = [];
    try {
      for await (const model of anthropicClient(key).models.list({ limit: 100 })) ids.push(model.id);
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) throw new TextEngineError(400, TEXT_ENGINE_ERRORS.badKey);
      throw new TextEngineError(502, TEXT_ENGINE_ERRORS.failed);
    }
    return ids;
  }
  let response: Response;
  try {
    response = await fetch(`${hostOf(provider)}/models`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(LIST_TIMEOUT_MS) });
  } catch {
    throw new TextEngineError(504, TEXT_ENGINE_ERRORS.busy);
  }
  if (!response.ok) {
    const { status, error } = engineError(response.status, await response.text());
    throw new TextEngineError(status, error);
  }
  const data = (await response.json().catch(() => null)) as { data?: { id?: unknown; architecture?: { output_modalities?: unknown } }[] } | null;
  const ids = (data?.data ?? [])
    // OpenRouter says what each model outputs: keep those that write text
    .filter((m) => !Array.isArray(m.architecture?.output_modalities) || (m.architecture.output_modalities as unknown[]).includes('text'))
    .map((m) => m.id)
    .filter((id): id is string => typeof id === 'string' && !NOT_TEXT.test(id));
  return provider === 'openai' ? ids.filter((id) => /^(gpt|o\d|chatgpt)/.test(id)) : ids;
}
