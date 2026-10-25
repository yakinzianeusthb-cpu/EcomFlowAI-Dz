import { describe, expect, it } from 'vitest';
import { SERVER_MESSAGES } from '../../src/i18n/serverMessages';
import {
  DEFAULT_VOICE_PROVIDER, ELEVENLABS_MODELS, POLLINATIONS_VOICES, POLLINATIONS_VOICE_MODELS, VOICE_ERRORS, VOICE_PROVIDERS, VOICE_TEXT_MAX,
  elevenLabsSpeechCall, elevenLabsVoicesCall, isVoiceId, isVoiceProvider, pollinationsSpeechCall, readElevenLabsVoices, readVoiceText, voiceError,
} from '../../src/lib/voiceProviders';

describe('the voice services', () => {
  it('offers ElevenLabs first, then Pollinations', () => {
    expect(VOICE_PROVIDERS).toEqual(['elevenlabs', 'pollinations']);
    expect(DEFAULT_VOICE_PROVIDER).toBe('elevenlabs');
    expect(isVoiceProvider('pollinations')).toBe(true);
    expect(isVoiceProvider('gemini')).toBe(false);
  });

  it('accepts only plain voice ids (they go into an address)', () => {
    expect(isVoiceId('EXAVITQu4vr4xnSDxMaL')).toBe(true);
    expect(isVoiceId('sarah')).toBe(true);
    for (const bad of ['', '../voices', 'a b', 'x'.repeat(65), null, 3]) expect(isVoiceId(bad)).toBe(false);
  });
});

describe('readVoiceText', () => {
  it('takes the words to say, trimmed, and refuses empty or over-long text', () => {
    expect(readVoiceText('  شعرك ناعم في 10 دقايق  ')).toBe('شعرك ناعم في 10 دقايق');
    expect(readVoiceText('')).toBeNull();
    expect(readVoiceText('   ')).toBeNull();
    expect(readVoiceText(42)).toBeNull();
    expect(readVoiceText('x'.repeat(VOICE_TEXT_MAX + 1))).toBeNull();
  });
});

describe('ElevenLabs', () => {
  it('asks text-to-speech for the voice, in MP3, with the model and the key in its own header', () => {
    const call = elevenLabsSpeechCall('مرحبا', 'xi-key', 'EXAVITQu4vr4xnSDxMaL', ELEVENLABS_MODELS[0]);
    expect(call.url).toBe('https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL?output_format=mp3_44100_128');
    expect(call.headers).toEqual({ 'xi-api-key': 'xi-key', 'Content-Type': 'application/json', Accept: 'audio/mpeg' });
    expect(JSON.parse(call.body)).toEqual({ text: 'مرحبا', model_id: 'eleven_v3' });
  });

  it('tries v3 first (Arabic, expressive), then Multilingual v2', () => {
    expect(ELEVENLABS_MODELS).toEqual(['eleven_v3', 'eleven_multilingual_v2']);
  });

  it('lists the account\'s voices and reads them', () => {
    expect(elevenLabsVoicesCall('xi-key').url).toBe('https://api.elevenlabs.io/v2/voices?page_size=100&sort=name&sort_direction=asc');
    const voices = readElevenLabsVoices({
      voices: [
        { voice_id: 'abc', name: 'Sarah', labels: { gender: 'female', accent: 'american' }, preview_url: 'https://storage.googleapis.com/x.mp3' },
        { voice_id: '../bad', name: 'Bad' },
        { name: 'No id' },
      ],
    });
    expect(voices).toEqual([{ id: 'abc', name: 'Sarah', detail: 'female · american', preview: 'https://storage.googleapis.com/x.mp3' }]);
    expect(readElevenLabsVoices(null)).toEqual([]);
  });
});

describe('Pollinations', () => {
  it('uses the OpenAI-style speech endpoint, in MP3', () => {
    const call = pollinationsSpeechCall('مرحبا', 'sk_test', 'sarah', POLLINATIONS_VOICE_MODELS[0]);
    expect(call.url).toBe('https://gen.pollinations.ai/v1/audio/speech');
    expect(call.headers).toEqual({ Authorization: 'Bearer sk_test', 'Content-Type': 'application/json', Accept: 'audio/mpeg' });
    expect(JSON.parse(call.body)).toEqual({ model: 'elevenlabs/eleven-v3', input: 'مرحبا', voice: 'sarah', response_format: 'mp3' });
  });

  it('falls back from ElevenLabs v3 to a model open to free accounts, each voice with its stand-in there', () => {
    expect(POLLINATIONS_VOICE_MODELS).toEqual(['elevenlabs/eleven-v3', 'openai/tts-1']);
    for (const v of POLLINATIONS_VOICES) {
      expect(isVoiceId(v.id)).toBe(true);
      expect(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).toContain(v.openai);
    }
  });
});

describe('voiceError', () => {
  it('turns a refusal into the seller\'s message, never the service\'s own words', () => {
    expect(voiceError(401, '{"detail":{"status":"invalid_api_key"}}')).toEqual({ status: 403, error: VOICE_ERRORS.badKey });
    expect(voiceError(402, 'PAYMENT_REQUIRED')).toEqual({ status: 402, error: VOICE_ERRORS.noCredit });
    expect(voiceError(401, '{"detail":{"status":"quota_exceeded"}}')).toEqual({ status: 402, error: VOICE_ERRORS.noCredit });
    expect(voiceError(429, 'too_many_concurrent_requests')).toEqual({ status: 429, error: VOICE_ERRORS.busy });
    expect(voiceError(400, 'content_blocked')).toEqual({ status: 422, error: VOICE_ERRORS.refused });
    expect(voiceError(500, 'boom')).toEqual({ status: 502, error: VOICE_ERRORS.failed });
  });

  it('has every message in English and Arabic for the seller', () => {
    for (const message of Object.values(VOICE_ERRORS)) expect(SERVER_MESSAGES[message], message).toBeDefined();
  });
});
