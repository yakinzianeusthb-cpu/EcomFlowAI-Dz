import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { AI_BUSY_MSG, AI_DAILY_QUOTA_MSG, AI_INVALID_KEY_MSG, AI_PAID_ONLY_MSG, IMAGE_MODEL_FALLBACKS, TEXT_MODEL_FALLBACKS, aiErrorResponse, generateWithFallback, isModelBusyError, isModelGoneError, isQuotaError } from '../../src/lib/aiFallback';
import { SERVER_MESSAGES } from '../../src/i18n/serverMessages';

const quota = () => Object.assign(new Error('{"error":{"code":429,"message":"You exceeded your current quota","status":"RESOURCE_EXHAUSTED"}}'), { status: 429 });
const busy = () => Object.assign(new Error('{"error":{"code":503,"message":"This model is currently experiencing high demand.","status":"UNAVAILABLE"}}'), { status: 503 });
const internal = () => Object.assign(new Error('{"error":{"code":500,"message":"An internal error has occurred.","status":"INTERNAL"}}'), { status: 500 });
const invalidKey = () => Object.assign(new Error('{"error":{"code":400,"message":"API key not valid.","status":"INVALID_ARGUMENT"}}'), { status: 400 });
const closedToNewKeys = () => Object.assign(new Error('{"error":{"code":404,"message":"This model models/gemini-2.5-flash-image is no longer available to new users. Please update your code to use a newer model for the latest features and improvements.","status":"NOT_FOUND"}}'), { status: 404 });
const unknownModel = () => Object.assign(new Error('{"error":{"code":404,"message":"models/gemini-9-flash is not found for API version v1beta, or is not supported for generateContent.","status":"NOT_FOUND"}}'), { status: 404 });

describe('isModelGoneError', () => {
  it('recognises a model that is retired, unknown, or closed to new keys', () => {
    expect(isModelGoneError(closedToNewKeys())).toBe(true);
    expect(isModelGoneError(unknownModel())).toBe(true);
    expect(isModelGoneError({ status: 'NOT_FOUND' })).toBe(true);
    expect(isModelGoneError(new Error('{"error":{"code":404,"message":"gone","status":"NOT_FOUND"}}'))).toBe(true);
  });

  it('does not mistake a quota problem, an overload or a bad key for a missing model', () => {
    expect(isModelGoneError(quota())).toBe(false);
    expect(isModelGoneError(busy())).toBe(false);
    expect(isModelGoneError(invalidKey())).toBe(false);
    expect(isModelGoneError(null)).toBe(false);
  });
});

describe('isModelBusyError', () => {
  it('recognises an overloaded or failing model on Google\'s side', () => {
    expect(isModelBusyError(busy())).toBe(true);
    expect(isModelBusyError(internal())).toBe(true);
    expect(isModelBusyError({ status: 'UNAVAILABLE' })).toBe(true);
  });

  it('does not treat a quota problem or a bad request as an overload', () => {
    expect(isModelBusyError(quota())).toBe(false);
    expect(isModelBusyError(invalidKey())).toBe(false);
    expect(isModelBusyError(null)).toBe(false);
  });
});

describe('isQuotaError', () => {
  it('recognises the shapes a used-up quota takes', () => {
    expect(isQuotaError(quota())).toBe(true);
    expect(isQuotaError({ status: 429 })).toBe(true);
    expect(isQuotaError({ code: 429 })).toBe(true);
    expect(isQuotaError({ status: 'RESOURCE_EXHAUSTED' })).toBe(true);
    expect(isQuotaError(new Error('Quota exceeded for metric: generate_content_free_tier_requests'))).toBe(true);
  });

  it('does not mistake other failures for a quota problem', () => {
    expect(isQuotaError(invalidKey())).toBe(false);
    expect(isQuotaError(new Error('fetch failed'))).toBe(false);
    expect(isQuotaError(null)).toBe(false);
    expect(isQuotaError(undefined)).toBe(false);
  });
});

describe('generateWithFallback', () => {
  it('uses the first model when it answers', async () => {
    const generate = vi.fn(async (model: string) => `answer from ${model}`);
    await expect(generateWithFallback(['a', 'b'], generate)).resolves.toEqual({ result: 'answer from a', model: 'a' });
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('moves to the next model when one has used up its quota', async () => {
    const onFallback = vi.fn();
    const generate = vi.fn(async (model: string) => {
      if (model === 'a') throw quota();
      return `answer from ${model}`;
    });
    await expect(generateWithFallback(['a', 'b', 'c'], generate, onFallback)).resolves.toEqual({ result: 'answer from b', model: 'b' });
    expect(generate.mock.calls.map(([m]) => m)).toEqual(['a', 'b']);
    expect(onFallback).toHaveBeenCalledWith('a', 'b');
  });

  it('also moves on when a model is overloaded (503) or fails on Google\'s side (500)', async () => {
    const generate = vi.fn(async (model: string) => {
      if (model === 'a') throw busy();
      if (model === 'b') throw internal();
      return `answer from ${model}`;
    });
    await expect(generateWithFallback(['a', 'b', 'c'], generate)).resolves.toEqual({ result: 'answer from c', model: 'c' });
  });

  it('moves on when Google has retired a model or closed it to new keys (404)', async () => {
    const generate = vi.fn(async (model: string) => {
      if (model === 'a') throw unknownModel();
      if (model === 'b') throw closedToNewKeys();
      return `answer from ${model}`;
    });
    await expect(generateWithFallback(['a', 'b', 'c'], generate)).resolves.toEqual({ result: 'answer from c', model: 'c' });
  });

  it('reports the quota answer rather than a missing model when every model fails, so the seller learns what to do', async () => {
    const generate = vi.fn(async (model: string) => {
      if (model === 'a') throw quota();
      throw closedToNewKeys();
    });
    await expect(generateWithFallback(['a', 'b', 'c'], generate)).rejects.toMatchObject({ status: 429 });
    expect(generate).toHaveBeenCalledTimes(3);
  });

  it('stops at once on any other error, such as an invalid key', async () => {
    const generate = vi.fn(async () => { throw invalidKey(); });
    await expect(generateWithFallback(['a', 'b'], generate)).rejects.toMatchObject({ status: 400 });
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('reports the quota error when every model is used up', async () => {
    const generate = vi.fn(async () => { throw quota(); });
    await expect(generateWithFallback(['a', 'b', 'c'], generate)).rejects.toMatchObject({ status: 429 });
    expect(generate).toHaveBeenCalledTimes(3);
  });

  it('refuses an empty model list', async () => {
    await expect(generateWithFallback([], async () => 'x')).rejects.toThrow();
  });
});

describe('aiErrorResponse', () => {
  const daily = () => Object.assign(new Error('{"error":{"code":429,"message":"You exceeded your current quota. Quota exceeded for metric: generate_content_free_tier_requests","status":"RESOURCE_EXHAUSTED","details":[{"quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier"}]}}'), { status: 429 });

  it('tells the user when the free daily limit of their key is used up', () => {
    expect(aiErrorResponse(daily())).toEqual({ status: 429, error: AI_DAILY_QUOTA_MSG });
  });

  it('explains that images and videos need a key with billing when the free tier gives none (limit: 0)', () => {
    const paidOnly = Object.assign(new Error('{"error":{"code":429,"message":"You exceeded your current quota. Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.5-flash-image","status":"RESOURCE_EXHAUSTED"}}'), { status: 429 });
    expect(aiErrorResponse(paidOnly)).toEqual({ status: 402, error: AI_PAID_ONLY_MSG });
  });

  it('asks to wait a moment for a short-term rate limit', () => {
    expect(aiErrorResponse(quota())).toEqual({ status: 429, error: 'Quota Gemini dépassé. Réessaie dans un instant.' });
  });

  it('says the AI service is overloaded on a 503', () => {
    expect(aiErrorResponse(busy())).toEqual({ status: 503, error: AI_BUSY_MSG });
  });

  it('tells the user their saved key is wrong, expired or blocked', () => {
    expect(aiErrorResponse(invalidKey())).toEqual({ status: 400, error: AI_INVALID_KEY_MSG });
    const expired = Object.assign(new Error('{"error":{"code":400,"message":"API key expired. Please renew the API key.","status":"INVALID_ARGUMENT","details":[{"reason":"API_KEY_INVALID"}]}}'), { status: 400 });
    expect(aiErrorResponse(expired)).toEqual({ status: 400, error: AI_INVALID_KEY_MSG });
    const leaked = Object.assign(new Error('{"error":{"code":403,"message":"Your API key was reported as leaked. Please use another API key.","status":"PERMISSION_DENIED"}}'), { status: 403 });
    expect(aiErrorResponse(leaked)).toEqual({ status: 400, error: AI_INVALID_KEY_MSG });
  });

  it('does not blame the key for other bad requests', () => {
    const badRequest = Object.assign(new Error('{"error":{"code":400,"message":"Request contains an invalid argument.","status":"INVALID_ARGUMENT"}}'), { status: 400 });
    expect(aiErrorResponse(badRequest)).toEqual({ status: 500, error: 'Erreur serveur IA.' });
  });

  it('keeps the generic message for anything else, without leaking details', () => {
    expect(aiErrorResponse(new Error('secret internals'))).toEqual({ status: 500, error: 'Erreur serveur IA.' });
  });

  it('only uses messages the server knows how to translate', () => {
    for (const message of [AI_DAILY_QUOTA_MSG, AI_BUSY_MSG, AI_PAID_ONLY_MSG, AI_INVALID_KEY_MSG, 'Quota Gemini dépassé. Réessaie dans un instant.', 'Erreur serveur IA.']) {
      expect(SERVER_MESSAGES[message], message).toBeDefined();
    }
  });
});

describe('TEXT_MODEL_FALLBACKS', () => {
  it('starts with the model the browser asks for, so the usual answers do not change', () => {
    const client = fs.readFileSync(path.resolve(__dirname, '../../src/services/gemini.ts'), 'utf8');
    const clientModel = /export const MODEL_NAME = "([^"]+)"/.exec(client)?.[1];
    expect(TEXT_MODEL_FALLBACKS[0]).toBe(clientModel);
  });

  it('lists each model once', () => {
    expect(new Set(TEXT_MODEL_FALLBACKS).size).toBe(TEXT_MODEL_FALLBACKS.length);
    expect(TEXT_MODEL_FALLBACKS.length).toBeGreaterThan(1);
  });
});

describe('IMAGE_MODEL_FALLBACKS', () => {
  it('starts with the image model the browser asks for', () => {
    const client = fs.readFileSync(path.resolve(__dirname, '../../src/services/gemini.ts'), 'utf8');
    const clientModel = /export const IMAGE_MODEL_NAME = "([^"]+)"/.exec(client)?.[1];
    expect(IMAGE_MODEL_FALLBACKS[0]).toBe(clientModel);
  });

  it('keeps older image models behind it, each once, for keys that cannot use the newest', () => {
    expect(new Set(IMAGE_MODEL_FALLBACKS).size).toBe(IMAGE_MODEL_FALLBACKS.length);
    expect(IMAGE_MODEL_FALLBACKS.length).toBeGreaterThan(1);
  });
});
