/**
 * The line icons of the landing pages, inline (the page is one file). Paths from Lucide (ISC licence), drawn in the
 * current text colour; decorative, so hidden from screen readers.
 */
const PATHS = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  cash: '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  phone: '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>',
  message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  quote: '<path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
  droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  sparkles: '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/>',
  clock: '<path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/>',
  feather: '<path d="M12.67 19a2 2 0 0 0 1.416-.588l6.154-6.172a6 6 0 0 0-8.49-8.49L5.586 9.914A2 2 0 0 0 5 11.328V18a1 1 0 0 0 1 1z"/><path d="M16 8 2 22"/><path d="M17.5 15H9"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  heart: '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  package: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><polyline points="3.29 7 12 12 20.71 7"/><path d="m7.5 4.27 9 5.15"/>',
} as const;

export type IconName = keyof typeof PATHS;

/** Words of a feature and the icon that pictures them, Arabic, French and English; the first match wins. */
const FEATURE_ICONS: [RegExp, IconName][] = [
  [/توصيل|شحن مجاني|livraison|delivery|shipping/i, 'truck'],
  [/ماء|مياه|رطوب|ترطيب|عرق|water|\beau\b|étanche|imperméable|hydrat/i, 'droplet'],
  [/خفيف|خفة|وزن|léger|légère|lightweight|poids|weight/i, 'feather'],
  [/إضاء|اضاء|ضوء|نور|مضو|\bled\b|lumi|éclair|soleil|\bsun|\buv\b/i, 'sun'],
  [/شحن|بطاري|طاقة|كهرب|سريع|قوي|قوة|usb|batter|charg|power|puissan|rapide|fast|quick|énergie|energy/i, 'zap'],
  [/عين|عيون|نظر|رؤي|عدس|مظهر|\bvue\b|vision|\beye|œil|lentille|lens|\blook|apparence|allure/i, 'eye'],
  [/ضمان|حماي|آمن|أمان|امان|متين|متانة|صلب|خدش|صدم|يدوم|تدوم|دائم|يصدي|صدأ|garanti|protect|sécur|secur|safe|résist|resist|durable|solide|robust|scratch|rayure/i, 'shield'],
  [/ساعة|ساعات|وقت|دقيق|دقة|دقائق|يوم|أيام|كرونو|chrono|\bheures?\b|temps|minute|hour|time\b|précis|precis/i, 'clock'],
  [/طبيعي|عضوي|أعشاب|نبات|natur|\bbio\b|organi|plante/i, 'leaf'],
  [/راحة|مريح|ناعم|لطيف|بشرة|صحة|confort|comfort|doux|douce|soft|santé|health|peau|skin/i, 'heart'],
  [/دفع|سعر|ثمن|paiement|payment|prix|price/i, 'cash'],
  [/هدية|مجان|cadeau|gift|offert/i, 'gift'],
  [/محمول|سفر|صغير|حجم|مقاس|سهل|بسيط|portable|transport|voyage|travel|compact|taille|size|facile|easy|simple/i, 'package'],
  [/فخام|فاخر|أناق|اناق|لمع|بريق|جودة|ستانلس|ستيل|ذهب|كلاس|هيب|تصميم|احتراف|luxe|luxury|premium|élégan|elegan|qualit|brill|shine|design|style|chic/i, 'sparkles'],
];

/**
 * The icons of a list of features: for each label, the first icon matching its words, or another of its matches when
 * that one is already used higher in the list (three shields in a row say less); a check mark when nothing matches.
 */
export function iconsFor(labels: string[]): IconName[] {
  const used = new Set<IconName>();
  return labels.map((label) => {
    const matches = FEATURE_ICONS.filter(([words]) => words.test(label)).map(([, name]) => name);
    const pick = matches.find((name) => !used.has(name)) ?? matches[0] ?? 'check';
    used.add(pick);
    return pick;
  });
}

export function icon(name: IconName, className = ''): string {
  const cls = className ? ` class="${className}"` : '';
  return `<svg${cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${PATHS[name]}</svg>`;
}
