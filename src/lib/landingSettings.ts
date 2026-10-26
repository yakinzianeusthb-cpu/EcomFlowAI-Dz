/**
 * What the seller sets around a generated landing page (template and its colours, shop name, delivery, promises), kept in this
 * browser so the next page starts the same way. Read back field by field: anything unexpected gets its default.
 */
import { DEFAULT_PROMISES, type DeliveryMode, type PagePromises } from './landingHtml';
import { LANDING_TEMPLATES, type LandingTemplate } from './landingTheme';

/** The long-image page in the deep blue and yellow of shop posters, or in the product's palette. */
export type PosterColors = 'blue' | 'product';

export interface PublisherSettings {
  template: LandingTemplate;
  posterColors: PosterColors;
  storeName: string;
  deliveryMode: DeliveryMode;
  deliveryFee: string;
  promises: Required<PagePromises>;
}

export const DEFAULT_SETTINGS: PublisherSettings = {
  template: LANDING_TEMPLATES[0],
  posterColors: 'blue',
  storeName: '',
  deliveryMode: 'by-wilaya',
  deliveryFee: '',
  promises: DEFAULT_PROMISES,
};

const POSTER_COLORS: readonly PosterColors[] = ['blue', 'product'];
const DELIVERY_MODES: readonly DeliveryMode[] = ['by-wilaya', 'free', 'fixed'];
const MAX_NAME = 80;
const MAX_FEE = 20;

const text = (value: unknown, max: number, fallback: string) => (typeof value === 'string' ? value.slice(0, max) : fallback);
const flag = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);

export function readSettings(raw: string | null): PublisherSettings {
  let saved: unknown;
  try {
    saved = raw ? JSON.parse(raw) : null;
  } catch {
    saved = null;
  }
  if (!saved || typeof saved !== 'object') return DEFAULT_SETTINGS;
  const s = saved as Record<string, unknown>;
  const promises = (s.promises && typeof s.promises === 'object' ? s.promises : {}) as Record<string, unknown>;
  return {
    template: LANDING_TEMPLATES.includes(s.template as LandingTemplate) ? (s.template as LandingTemplate) : DEFAULT_SETTINGS.template,
    posterColors: POSTER_COLORS.includes(s.posterColors as PosterColors) ? (s.posterColors as PosterColors) : DEFAULT_SETTINGS.posterColors,
    storeName: text(s.storeName, MAX_NAME, DEFAULT_SETTINGS.storeName),
    deliveryMode: DELIVERY_MODES.includes(s.deliveryMode as DeliveryMode) ? (s.deliveryMode as DeliveryMode) : DEFAULT_SETTINGS.deliveryMode,
    deliveryFee: text(s.deliveryFee, MAX_FEE, DEFAULT_SETTINGS.deliveryFee),
    promises: {
      nationwide: flag(promises.nationwide, DEFAULT_PROMISES.nationwide),
      inspection: flag(promises.inspection, DEFAULT_PROMISES.inspection),
      guarantee: flag(promises.guarantee, DEFAULT_PROMISES.guarantee),
    },
  };
}
