import { describe, expect, it } from 'vitest';
import { LANDING_LANGUAGE, VIDEO_STYLES, landingInputFromBrief, videoContextFromBrief } from '../../src/lib/campaignContext';

const project = {
  name: 'Lampe', productName: 'Lampe LED rechargeable', description: 'Autonomie 12 h, recharge USB-C', audience: 'Familles en ville',
  objective: 'sales' as const, tone: 'Chaleureux', platforms: ['facebook' as const], language: 'ar' as const, price: '2 900 DA',
};
const brand = { brandName: 'Lumina', colors: ['#5b3df5', '#f3f0e8'], tone: 'Premium', audience: 'Femmes 25-40', instructions: 'Toujours montrer la lampe allumée', styles: ['luxury'] };

describe('landingInputFromBrief', () => {
  it('passes the brief to the landing page generator in the shape it expects', () => {
    expect(landingInputFromBrief(project, brand)).toMatchObject({
      name: 'Lampe LED rechargeable',
      brand: 'Lumina',
      targetAudience: 'Familles en ville',
      tone: 'Chaleureux',
      colorPalette: ['#5b3df5', '#f3f0e8'],
      language: LANDING_LANGUAGE.ar,
      marketingAngle: 'Luxe Accessible',
      designStyle: 'Élégant / Classique',
      pageType: 'Page de Vente Directe',
      targetMarket: 'Algérie',
      numSections: 6,
    });
  });

  it('adds the price and the brand rules to the description', () => {
    const { description } = landingInputFromBrief(project, brand);
    expect(description).toContain('Autonomie 12 h, recharge USB-C');
    expect(description).toContain('2 900 DA');
    expect(description).toContain('Toujours montrer la lampe allumée');
  });

  it('falls back to the brand kit, then to sensible defaults', () => {
    const bare = landingInputFromBrief({ ...project, audience: '', tone: '', productName: '', language: 'fr', objective: 'leads' }, { ...brand, styles: [] });
    expect(bare).toMatchObject({ name: 'Lampe', targetAudience: 'Femmes 25-40', tone: 'Premium', language: 'Français', pageType: 'Opt-in / Pre-sell' });
    expect(bare.marketingAngle).toBeUndefined();
    expect(landingInputFromBrief(project, null).brand).toBeUndefined();
  });
});

describe('videoContextFromBrief', () => {
  it('writes the same product sheet as the video tool', () => {
    const context = videoContextFromBrief(project, brand, { style: VIDEO_STYLES[0], format: '9:16', duration: '30 secondes' });
    expect(context).toContain("=== FICHE D'ANALYSE PRODUIT COMPLÈTE ===");
    expect(context).toContain('Nom commercial du Produit : Lampe LED rechargeable');
    expect(context).toContain('Prix promotionnel conseillé : 2 900 DA');
    expect(context).toContain(`Type de Vidéo (Esthétique) : ${VIDEO_STYLES[0]}`);
    expect(context).toContain("Format géométrique d'écran : 9:16");
    expect(context).toContain('Marché Ciblé (Audience Idéale en Algérie) : Familles en ville');
    expect(context).toContain('Toujours montrer la lampe allumée');
  });

  it('offers the video styles of the video tool', () => {
    expect(VIDEO_STYLES).toContain('User-Generated Content (UGC)');
    expect(VIDEO_STYLES).toContain('Studio Premium & Cinematic');
  });
});
