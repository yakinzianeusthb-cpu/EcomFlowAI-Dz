import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PLANS, DEFAULT_PRICING, buildPlans, formatPrice, type PricingConfig } from '../../src/lib/pricing';
import { dataUrlToBlob, isImageProof, isPdfProof } from '../../src/lib/proof';

describe('formatPrice', () => {
  it('puts the symbol after the amount by default, grouping thousands with spaces', () => {
    expect(formatPrice(1500, DEFAULT_PRICING)).toBe('1 500 DA');
    expect(formatPrice(15000, DEFAULT_PRICING)).toBe('15 000 DA');
    expect(formatPrice(1234567, DEFAULT_PRICING)).toBe('1 234 567 DA');
  });

  it('does not group small amounts', () => {
    expect(formatPrice(0, DEFAULT_PRICING)).toBe('0 DA');
    expect(formatPrice(999, DEFAULT_PRICING)).toBe('999 DA');
  });

  it('can put the symbol before the amount', () => {
    expect(formatPrice(1500, { ...DEFAULT_PRICING, currencySymbol: '$', currencyPosition: 'before' })).toBe('$ 1 500');
  });
});

describe('buildPlans', () => {
  const pricing: PricingConfig = { ...DEFAULT_PRICING, monthlyPrice: 2000, quarterlyPrice: 5000, lifetimePrice: 20000 };

  it('lists the three self-service plans with the configured prices', () => {
    const plans = buildPlans(pricing);
    expect(plans.map((p) => p.id)).toEqual(['monthly', 'quarterly', 'lifetime']);
    expect(plans.map((p) => p.price)).toEqual(['2 000 DA', '5 000 DA', '20 000 DA']);
  });

  it('keeps the French texts when no translator is given', () => {
    const [monthly, quarterly] = buildPlans(pricing);
    expect(monthly.label).toBe('1 Mois');
    expect(monthly.note).toBe('/ mois');
    expect(quarterly.popular).toBe(true);
    expect(monthly.popular).toBeUndefined();
  });

  it('translates the display texts but never the amounts', () => {
    const upper = (text: string) => text.toUpperCase();
    const [monthly] = buildPlans(pricing, upper);
    expect(monthly.label).toBe('1 MOIS');
    expect(monthly.tagline).toBe('POUR TESTER');
    expect(monthly.per).toBe("30 JOURS D'ACCÈS");
    expect(monthly.note).toBe('/ MOIS');
    expect(monthly.price).toBe('2 000 DA');
  });

  it('provides default plans for the moment before pricing has loaded', () => {
    expect(DEFAULT_PLANS).toHaveLength(3);
    expect(DEFAULT_PLANS[0].price).toBe('1 500 DA');
  });
});

describe('payment proof helpers', () => {
  it('recognises images and PDFs by their data URL', () => {
    expect(isImageProof('data:image/png;base64,AAAA')).toBe(true);
    expect(isImageProof('data:application/pdf;base64,AAAA')).toBe(false);
    expect(isPdfProof('data:application/pdf;base64,AAAA')).toBe(true);
    expect(isPdfProof('data:image/png;base64,AAAA')).toBe(false);
    for (const empty of [null, undefined, '']) {
      expect(isImageProof(empty)).toBe(false);
      expect(isPdfProof(empty)).toBe(false);
    }
  });

  it('turns a data URL into a Blob of the right type and size', async () => {
    const blob = dataUrlToBlob(`data:application/pdf;base64,${Buffer.from('%PDF-1.4 hello').toString('base64')}`);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBe('%PDF-1.4 hello'.length);
    expect(await blob.text()).toBe('%PDF-1.4 hello');
  });

  it('falls back to a generic type when the data URL names none', () => {
    expect(dataUrlToBlob('data:;base64,QQ==').type).toBe('application/octet-stream');
  });
});

describe('fetchPricing', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => { vi.unstubAllGlobals(); });

  const load = async () => (await import('../../src/lib/pricing')).fetchPricing;

  it('uses what the server says when it is valid, and asks only once', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ currencyCode: ' USD ', currencySymbol: '$', currencyPosition: 'before', monthlyPrice: 10, quarterlyPrice: 25, lifetimePrice: 100 }) }));
    vi.stubGlobal('fetch', fetchMock);
    const fetchPricing = await load();

    const first = await fetchPricing();
    const second = await fetchPricing();

    expect(first).toEqual({ currencyCode: 'USD', currencySymbol: '$', currencyPosition: 'before', monthlyPrice: 10, quarterlyPrice: 25, lifetimePrice: 100 });
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('falls back to the defaults when the server answers with something unusable', async () => {
    for (const body of [null, 'oops', { monthlyPrice: -1, quarterlyPrice: 1, lifetimePrice: 1, currencyCode: 'X', currencySymbol: 'X' }, { monthlyPrice: 1.5, quarterlyPrice: 1, lifetimePrice: 1, currencyCode: 'X', currencySymbol: 'X' }, { monthlyPrice: 1, quarterlyPrice: 1, lifetimePrice: 1 }]) {
      vi.resetModules();
      vi.stubGlobal('fetch', async () => ({ ok: true, json: async () => body }));
      expect(await (await load())()).toEqual(DEFAULT_PRICING);
    }
  });

  it('falls back to the defaults when the request fails or is not OK', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('network'); });
    expect(await (await load())()).toEqual(DEFAULT_PRICING);

    vi.resetModules();
    vi.stubGlobal('fetch', async () => ({ ok: false, json: async () => ({}) }));
    expect(await (await load())()).toEqual(DEFAULT_PRICING);
  });

  it('keeps the default currency text when the server sends blank values', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: true, json: async () => ({ currencyCode: '  ', currencySymbol: '', monthlyPrice: 1, quarterlyPrice: 2, lifetimePrice: 3 }) }));
    const result = await (await load())();
    expect(result.currencyCode).toBe('DA');
    expect(result.currencySymbol).toBe('DA');
    expect(result.currencyPosition).toBe('after');
  });
});
