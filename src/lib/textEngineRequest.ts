/**
 * The app's tools build their AI requests in Gemini's shape ({ contents, config }). For the other text engines
 * (src/lib/textEngines.ts) the server turns that into a neutral chat, then into each service's request, and turns
 * the answer back into Gemini's shape, so no tool needs to know which engine runs. Pure: no network here (see
 * src/lib/textEngineCall.ts).
 */
import { TEXT_ENGINE_ERRORS, type TextProvider } from './textEngines';

export interface ChatPart {
  text?: string;
  image?: { mimeType: string; data: string };
}
export interface ChatMessage {
  role: 'user' | 'assistant';
  parts: ChatPart[];
}
export interface ChatRequest {
  system: string;
  messages: ChatMessage[];
  /** the tool asked for JSON (responseMimeType application/json) */
  json: boolean;
  /** the JSON answer is an object (so the services' "JSON object" mode can be used) */
  jsonObject: boolean;
}

/** The answer in the shape the tools read from Gemini. */
export interface GeminiShapedAnswer {
  text: string;
  candidates: { content: { role: 'model'; parts: { text: string }[] } }[];
  usageMetadata: { totalTokenCount: number };
}

type GeminiPart = { text?: unknown; inlineData?: { mimeType?: unknown; data?: unknown } };
type GeminiContent = { role?: unknown; parts?: unknown };

const IMAGE_MIME = /^image\/(png|jpeg|webp|gif)$/;

function toPart(part: unknown): ChatPart | null {
  if (typeof part === 'string') return part ? { text: part } : null;
  const p = (part ?? {}) as GeminiPart;
  if (typeof p.text === 'string' && p.text) return { text: p.text };
  const mime = p.inlineData?.mimeType;
  const data = p.inlineData?.data;
  if (typeof mime === 'string' && IMAGE_MIME.test(mime) && typeof data === 'string' && data) return { image: { mimeType: mime, data } };
  return null;
}

const partsOf = (value: unknown): ChatPart[] => (Array.isArray(value) ? value : [value]).map(toPart).filter((p): p is ChatPart => p !== null);

/** Gemini's contents: a string, a list of parts, one content ({ parts }) or a list of contents ({ role, parts }). */
function messagesOf(contents: unknown): ChatMessage[] {
  if (typeof contents === 'string') return [{ role: 'user', parts: partsOf(contents) }];
  const list = Array.isArray(contents) ? contents : [contents];
  const isContentList = list.some((c) => c && typeof c === 'object' && 'parts' in (c as object));
  if (!isContentList) return [{ role: 'user', parts: partsOf(list) }];
  return list
    .map((c) => {
      const content = (c ?? {}) as GeminiContent;
      return { role: content.role === 'model' || content.role === 'assistant' ? 'assistant' : 'user', parts: partsOf(content.parts) } as ChatMessage;
    })
    .filter((m) => m.parts.length > 0);
}

function systemOf(instruction: unknown): string {
  if (typeof instruction === 'string') return instruction;
  if (instruction && typeof instruction === 'object') {
    return partsOf((instruction as GeminiContent).parts ?? instruction).map((p) => p.text ?? '').filter(Boolean).join('\n');
  }
  return '';
}

/** Gemini's schema types are upper case (Type.OBJECT = "OBJECT"); JSON Schema's are lower case. */
export function toJsonSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toJsonSchema);
  if (!schema || typeof schema !== 'object') return schema;
  return Object.fromEntries(Object.entries(schema).map(([k, v]) => [k, k === 'type' && typeof v === 'string' ? v.toLowerCase() : toJsonSchema(v)]));
}

/** The neutral chat behind a Gemini-shaped request. */
export function fromGemini(contents: unknown, config: unknown): ChatRequest {
  const c = (config ?? {}) as Record<string, unknown>;
  const schema = c.responseSchema ?? c.responseJsonSchema ?? null;
  const json = c.responseMimeType === 'application/json' || schema !== null;
  const topType = schema && typeof schema === 'object' ? String((schema as { type?: unknown }).type ?? '').toLowerCase() : '';
  let system = systemOf(c.systemInstruction);
  if (json) {
    // the services' JSON modes need the word "JSON" in the request, and the tools parse the answer as it comes
    system += `${system ? '\n\n' : ''}Answer with valid JSON only: no markdown fence, no text before or after it.`;
    if (schema) system += ` The JSON must follow this JSON Schema: ${JSON.stringify(toJsonSchema(schema))}`;
  }
  return { system, messages: messagesOf(contents), json, jsonObject: json && (topType === '' || topType === 'object') };
}

const dataUrl = (image: { mimeType: string; data: string }) => `data:${image.mimeType};base64,${image.data}`;

/** OpenAI's Responses API (every current OpenAI model). */
export function openAiResponsesBody(model: string, req: ChatRequest) {
  return {
    model,
    ...(req.system ? { instructions: req.system } : {}),
    input: req.messages.map((m) => ({
      role: m.role,
      content: m.parts.map((p) =>
        p.image ? { type: 'input_image', image_url: dataUrl(p.image) } : { type: m.role === 'assistant' ? 'output_text' : 'input_text', text: p.text ?? '' },
      ),
    })),
    ...(req.jsonObject ? { text: { format: { type: 'json_object' } } } : {}),
  };
}

/** The chat-completions API of Mistral, DeepSeek, xAI and OpenRouter. Engines that read no images get the text only. */
export function chatCompletionsBody(provider: TextProvider, model: string, req: ChatRequest, vision: boolean) {
  const content = (m: ChatMessage) => {
    const parts = vision ? m.parts : m.parts.filter((p) => p.text);
    if (parts.every((p) => p.text !== undefined)) return parts.map((p) => p.text).join('\n');
    return parts.map((p) =>
      p.image
        // Mistral takes the image address as a plain string; the others as { url }
        ? { type: 'image_url', image_url: provider === 'mistral' ? dataUrl(p.image) : { url: dataUrl(p.image) } }
        : { type: 'text', text: p.text ?? '' },
    );
  };
  return {
    model,
    messages: [
      ...(req.system ? [{ role: 'system', content: req.system }] : []),
      ...req.messages.map((m) => ({ role: m.role, content: content(m) })).filter((m) => m.content.length > 0),
    ],
    ...(req.jsonObject ? { response_format: { type: 'json_object' } } : {}),
  };
}

export class EngineRefusal extends Error {}

/** The text of an OpenAI Responses answer; a refusal is thrown. */
export function readOpenAiResponses(answer: unknown): { text: string; totalTokens: number } {
  const a = (answer ?? {}) as { output?: { type?: string; content?: { type?: string; text?: string; refusal?: string }[] }[]; usage?: { total_tokens?: number } };
  const parts = (a.output ?? []).filter((o) => o.type === 'message').flatMap((o) => o.content ?? []);
  if (parts.some((p) => p.type === 'refusal')) throw new EngineRefusal('refused');
  return { text: parts.filter((p) => p.type === 'output_text').map((p) => p.text ?? '').join(''), totalTokens: a.usage?.total_tokens ?? 0 };
}

/** The text of a chat-completions answer; a refusal or content filter is thrown. */
export function readChatCompletions(answer: unknown): { text: string; totalTokens: number } {
  const a = (answer ?? {}) as { choices?: { finish_reason?: string; message?: { content?: unknown; refusal?: unknown } }[]; usage?: { total_tokens?: number } };
  const choice = a.choices?.[0];
  if (choice?.finish_reason === 'content_filter' || (typeof choice?.message?.refusal === 'string' && choice.message.refusal)) throw new EngineRefusal('refused');
  const content = choice?.message?.content;
  const text = typeof content === 'string' ? content : Array.isArray(content) ? content.map((p) => (typeof p?.text === 'string' ? p.text : '')).join('') : '';
  return { text, totalTokens: a.usage?.total_tokens ?? 0 };
}

/** A model wrapped in a markdown fence despite the instruction: the JSON inside it. */
export function unfenceJson(text: string): string {
  const fenced = /^\s*```(?:json)?\s*\n([\s\S]*?)\n?```\s*$/i.exec(text);
  return fenced ? fenced[1] : text;
}

export function toGeminiShape(text: string, totalTokens: number): GeminiShapedAnswer {
  return { text, candidates: [{ content: { role: 'model', parts: [{ text }] } }], usageMetadata: { totalTokenCount: totalTokens } };
}

/** A service's refusal as the status and plain message sent to the seller; the service's own words stay on the server. */
export function engineError(status: number, text: string): { status: number; error: string } {
  const t = text.toLowerCase();
  if (status === 401 || status === 403) return { status: 400, error: TEXT_ENGINE_ERRORS.badKey };
  if (status === 402 || /insufficient_quota|credit balance|billing|payment required/.test(t)) return { status: 402, error: TEXT_ENGINE_ERRORS.noCredit };
  if (status === 404 || (status === 400 && /model/.test(t) && /not.?found|does not exist|invalid|unknown|not supported|access/.test(t))) {
    return { status: 400, error: TEXT_ENGINE_ERRORS.model };
  }
  if (status === 429 || status === 503 || status === 529) return { status: 429, error: TEXT_ENGINE_ERRORS.busy };
  return { status: 502, error: TEXT_ENGINE_ERRORS.failed };
}
