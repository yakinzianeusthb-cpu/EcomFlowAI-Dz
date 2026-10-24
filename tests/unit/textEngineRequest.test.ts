import { describe, expect, it } from 'vitest';
import {
  EngineRefusal, chatCompletionsBody, engineError, fromGemini, openAiResponsesBody, readChatCompletions, readOpenAiResponses,
  toGeminiShape, toJsonSchema, unfenceJson,
} from '../../src/lib/textEngineRequest';
import { TEXT_ENGINES, TEXT_ENGINE_ERRORS, isModelId, isTextProvider, modelFor } from '../../src/lib/textEngines';

const PHOTO = { inlineData: { mimeType: 'image/jpeg', data: 'AAAA' } };

describe('fromGemini', () => {
  it('reads the shapes the tools send: a string, parts, one content and a conversation', () => {
    expect(fromGemini('hello', {}).messages).toEqual([{ role: 'user', parts: [{ text: 'hello' }] }]);
    expect(fromGemini([{ text: 'look' }, PHOTO], {}).messages).toEqual([{ role: 'user', parts: [{ text: 'look' }, { image: { mimeType: 'image/jpeg', data: 'AAAA' } }] }]);
    expect(fromGemini({ parts: [{ text: 'one' }] }, {}).messages).toEqual([{ role: 'user', parts: [{ text: 'one' }] }]);
    const chat = fromGemini([{ role: 'user', parts: [{ text: 'hi' }] }, { role: 'model', parts: [{ text: 'hello!' }] }, { role: 'user', parts: [{ text: 'and?' }] }], {});
    expect(chat.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
  });

  it('drops what is not text or a supported image', () => {
    expect(fromGemini([{ text: '' }, { inlineData: { mimeType: 'application/pdf', data: 'x' } }, { text: 'kept' }], {}).messages[0].parts).toEqual([{ text: 'kept' }]);
  });

  it('keeps the system instruction and asks for JSON with the schema in JSON Schema terms', () => {
    const req = fromGemini('x', { systemInstruction: 'You write ads.', responseMimeType: 'application/json', responseSchema: { type: 'OBJECT', properties: { title: { type: 'STRING' } } } });
    expect(req.json).toBe(true);
    expect(req.jsonObject).toBe(true);
    expect(req.system).toMatch(/^You write ads\.\n\nAnswer with valid JSON only/);
    expect(req.system).toContain('"type":"object"');
    expect(req.system).toContain('"title":{"type":"string"}');
    expect(fromGemini('x', { systemInstruction: { parts: [{ text: 'A' }, { text: 'B' }] } }).system).toBe('A\nB');
  });

  it('does not force a JSON object when the answer is a list', () => {
    const req = fromGemini('x', { responseMimeType: 'application/json', responseSchema: { type: 'ARRAY', items: { type: 'STRING' } } });
    expect(req.json).toBe(true);
    expect(req.jsonObject).toBe(false);
  });
});

describe('toJsonSchema', () => {
  it('lower-cases every type, nested ones included', () => {
    expect(toJsonSchema({ type: 'ARRAY', items: { type: 'OBJECT', properties: { n: { type: 'NUMBER' } }, required: ['n'] } }))
      .toEqual({ type: 'array', items: { type: 'object', properties: { n: { type: 'number' } }, required: ['n'] } });
  });
});

describe('request bodies', () => {
  const req = fromGemini([{ role: 'user', parts: [{ text: 'describe' }, PHOTO] }, { role: 'model', parts: [{ text: 'ok' }] }], { systemInstruction: 'Be brief.', responseMimeType: 'application/json' });

  it('OpenAI (Responses API): instructions, typed parts, the photo as a data URL, JSON mode', () => {
    expect(openAiResponsesBody('gpt-6-luna', req)).toEqual({
      model: 'gpt-6-luna',
      instructions: req.system,
      input: [
        { role: 'user', content: [{ type: 'input_text', text: 'describe' }, { type: 'input_image', image_url: 'data:image/jpeg;base64,AAAA' }] },
        { role: 'assistant', content: [{ type: 'output_text', text: 'ok' }] },
      ],
      text: { format: { type: 'json_object' } },
    });
  });

  it('chat completions: a system message, image parts, and plain text when there is no image', () => {
    const body = chatCompletionsBody('xai', 'grok-4.3', req, true);
    expect(body.messages[0]).toEqual({ role: 'system', content: req.system });
    expect(body.messages[1].content).toEqual([{ type: 'text', text: 'describe' }, { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,AAAA' } }]);
    expect(body.messages[2]).toEqual({ role: 'assistant', content: 'ok' });
    expect(body.response_format).toEqual({ type: 'json_object' });
  });

  it('Mistral takes the image address as a string; an engine without vision gets the text only', () => {
    expect((chatCompletionsBody('mistral', 'm', req, true).messages[1].content as { image_url?: unknown }[])[1].image_url).toBe('data:image/jpeg;base64,AAAA');
    expect(chatCompletionsBody('deepseek', 'deepseek-chat', req, false).messages[1].content).toBe('describe');
  });
});

describe('reading answers', () => {
  it('OpenAI Responses: joins the output text, counts tokens, throws on a refusal', () => {
    expect(readOpenAiResponses({ output: [{ type: 'reasoning' }, { type: 'message', content: [{ type: 'output_text', text: '{"a":' }, { type: 'output_text', text: '1}' }] }], usage: { total_tokens: 900 } }))
      .toEqual({ text: '{"a":1}', totalTokens: 900 });
    expect(() => readOpenAiResponses({ output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'no' }] }] })).toThrow(EngineRefusal);
  });

  it('chat completions: string or part content, and a content filter is a refusal', () => {
    expect(readChatCompletions({ choices: [{ message: { content: 'hi' } }], usage: { total_tokens: 12 } })).toEqual({ text: 'hi', totalTokens: 12 });
    expect(readChatCompletions({ choices: [{ message: { content: [{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }] } }] }).text).toBe('ab');
    expect(() => readChatCompletions({ choices: [{ finish_reason: 'content_filter', message: { content: '' } }] })).toThrow(EngineRefusal);
  });

  it('removes a markdown fence around JSON, and shapes the answer like Gemini', () => {
    expect(unfenceJson('```json\n{"a":1}\n```')).toBe('{"a":1}');
    expect(unfenceJson('{"a":1}')).toBe('{"a":1}');
    expect(toGeminiShape('t', 5)).toEqual({ text: 't', candidates: [{ content: { role: 'model', parts: [{ text: 't' }] } }], usageMetadata: { totalTokenCount: 5 } });
  });
});

describe('engineError', () => {
  it('turns each service refusal into a plain message, without the service own words', () => {
    expect(engineError(401, 'Incorrect API key sk-abc')).toEqual({ status: 400, error: TEXT_ENGINE_ERRORS.badKey });
    expect(engineError(429, 'You exceeded your current quota: insufficient_quota')).toEqual({ status: 402, error: TEXT_ENGINE_ERRORS.noCredit });
    expect(engineError(400, 'Your credit balance is too low')).toEqual({ status: 402, error: TEXT_ENGINE_ERRORS.noCredit });
    expect(engineError(404, 'The model `gpt-x` does not exist')).toEqual({ status: 400, error: TEXT_ENGINE_ERRORS.model });
    expect(engineError(429, 'rate limit')).toEqual({ status: 429, error: TEXT_ENGINE_ERRORS.busy });
    expect(engineError(529, 'overloaded')).toEqual({ status: 429, error: TEXT_ENGINE_ERRORS.busy });
    expect(engineError(500, 'boom')).toEqual({ status: 502, error: TEXT_ENGINE_ERRORS.failed });
  });
});

describe('textEngines', () => {
  it('knows each engine, validates model ids and falls back to the default model', () => {
    expect(isTextProvider('anthropic')).toBe(true);
    expect(isTextProvider('nope')).toBe(false);
    expect(isModelId('anthropic/claude-sonnet-5-5')).toBe(true);
    expect(isModelId('gpt-6-luna')).toBe(true);
    for (const bad of ['', '../x', 'a b', 'a\nb', 'x?y=1', 'a'.repeat(200)]) expect(isModelId(bad), bad).toBe(false);
    expect(modelFor('openai', 'gpt-5.5')).toBe('gpt-5.5');
    expect(modelFor('openai', 'bad model')).toBe(TEXT_ENGINES.openai.defaultModel);
  });
});
