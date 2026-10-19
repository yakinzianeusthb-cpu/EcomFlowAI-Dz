import { describe, expect, it } from 'vitest';
import { isPlaceholderGuide, visibleAnnouncements } from '../../src/lib/dashboardContent';

const trial = { id: 'default-free-7-days', title: 'عرض خاص: 7 أيام تجربة مجانية!' };
const legacy = { id: 'a1', title: "🎁 Offre Spéciale : 7 Jours d'Essai Gratuit !" };
const news = { id: 'a2', title: 'Nouveau : la vidéo IA est disponible' };

describe('visibleAnnouncements', () => {
  it('offers the free trial, in the interface language, to someone without a plan', () => {
    expect(visibleAnnouncements([news], { hasPlan: false, freeTrial: trial })).toEqual([trial, news]);
  });

  it('does not offer a free trial to someone who already pays', () => {
    expect(visibleAnnouncements([news], { hasPlan: true, freeTrial: trial })).toEqual([news]);
  });

  it('drops the French copy of the trial offer the server used to create on its own', () => {
    expect(visibleAnnouncements([legacy, news], { hasPlan: false, freeTrial: trial })).toEqual([trial, news]);
    expect(visibleAnnouncements([{ ...legacy, title: "Offre Spéciale : 7 Jours d'Essai Gratuit !" }], { hasPlan: true, freeTrial: trial })).toEqual([]);
  });
});

describe('isPlaceholderGuide', () => {
  it('recognises the demo video the old seed script inserted', () => {
    expect(isPlaceholderGuide({ youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })).toBe(true);
    expect(isPlaceholderGuide({ youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ' })).toBe(true);
  });

  it('keeps every real guide', () => {
    expect(isPlaceholderGuide({ youtubeUrl: 'https://www.youtube.com/watch?v=abcdefghijk' })).toBe(false);
    expect(isPlaceholderGuide({ youtubeUrl: '' })).toBe(false);
  });
});
