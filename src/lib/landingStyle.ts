/**
 * The stylesheet of a landing page: the template's tokens and palette colours, one structure shared by every
 * template (phone first, two columns from 900 px), then what makes each template look like itself. Every value put
 * in comes from landingTheme.ts (fixed fonts, colours already checked as hex), never from the copy.
 */
import { mix, toRgbList } from './color';
import { THEMES, type LandingColors, type LandingTemplate } from './landingTheme';

function tokens(template: LandingTemplate, c: LandingColors): string {
  const t = THEMES[template];
  return `:root {
  --bg: ${t.bg}; --bg-rgb: ${toRgbList(t.bg)}; --surface: ${t.surface}; --card: ${t.card}; --field: ${t.fieldBg};
  --ink: ${t.ink}; --muted: ${t.muted}; --line: ${t.line}; --field-line: ${t.fieldLine};
  --brand: ${c.brand}; --on-brand: ${c.onBrand}; --brand-text: ${c.brandText}; --brand-rgb: ${c.brandRgb};
  --accent: ${c.accent}; --on-accent: ${c.onAccent}; --accent-rgb: ${toRgbList(c.accent)};
  --tint: ${c.tint}; --tint-line: ${c.tintLine};
  --brand-light: ${c.brandLight}; --brand-deep: ${c.brandDeep}; --pill: ${c.pill}; --on-pill: ${c.onPill};
  --highlight: ${c.highlight}; --on-highlight: ${c.onHighlight}; --hl-light: ${c.highlightLight}; --hl-deep: ${c.highlightDeep};
  --pill-rgb: ${toRgbList(c.pill)}; --canvas: ${c.canvas}; --canvas-rgb: ${toRgbList(c.canvas)}; --canvas-mid: ${mix(c.canvas, '#000000', 0.16)};
  --radius: ${t.radius}px; --radius-sm: ${Math.round(t.radius * 0.65)}px; --btn-radius: ${t.buttonRadius}px;
  --display: ${t.fonts.display}; --body: ${t.fonts.body};
  --ease: cubic-bezier(0.23, 1, 0.32, 1);
  --shadow: 0 1px 2px rgba(15, 23, 42, .05), 0 18px 40px -22px rgba(15, 23, 42, .3);
}
`;
}

const BASE = `
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; scroll-padding-top: 76px; }
body { margin: 0; background: var(--bg); color: var(--ink); font-family: var(--body); font-size: 16px; line-height: 1.75; -webkit-font-smoothing: antialiased; }
img { display: block; max-width: 100%; height: auto; }
h1, h2, h3 { margin: 0; font-family: var(--display); line-height: 1.3; text-wrap: balance; }
p { margin: 0 0 12px; }
svg { flex: none; }
[hidden] { display: none !important; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.wrap { width: 100%; max-width: 1140px; margin: 0 auto; padding: 0 20px; }

.announce { background: var(--brand); color: var(--on-brand); font-size: 13px; font-weight: 600; line-height: 1.4; }
.announce .wrap { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 20px; padding-top: 9px; padding-bottom: 9px; }
.announce span { display: inline-flex; align-items: center; gap: 7px; }
/* one line on small phones: the first promise only */
.announce span + span { display: none; }
.announce svg { width: 16px; height: 16px; }

.top { position: sticky; top: 0; z-index: 30; background: rgba(var(--bg-rgb), .88); -webkit-backdrop-filter: saturate(1.5) blur(14px); backdrop-filter: saturate(1.5) blur(14px); border-bottom: 1px solid var(--line); }
.top .wrap { display: flex; align-items: center; justify-content: space-between; gap: 14px; min-height: 64px; }
.brand-name { min-width: 0; overflow: hidden; font-family: var(--display); font-size: 18px; font-weight: 700; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
.top .btn { flex: none; white-space: nowrap; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 54px; padding: 14px 28px; border: 0; border-radius: var(--btn-radius); background: var(--brand); color: var(--on-brand); font-family: var(--display); font-size: 17px; font-weight: 700; line-height: 1.2; text-decoration: none; cursor: pointer; box-shadow: 0 14px 30px -14px rgba(var(--brand-rgb), .65); transition: transform .16s var(--ease), box-shadow .25s ease, filter .25s ease; -webkit-tap-highlight-color: transparent; }
.btn svg { width: 20px; height: 20px; transition: transform .25s var(--ease); }
[dir="rtl"] .btn .go { transform: scaleX(-1); }
.btn:active { transform: scale(.97); }
.btn:focus-visible, .dot:focus-visible, .qty button:focus-visible, .wa:focus-visible, .slides:focus-visible { outline: 3px solid var(--brand-text); outline-offset: 3px; }
.btn-sm { min-height: 44px; padding: 9px 18px; font-size: 14.5px; box-shadow: none; }
.btn-block { width: 100%; }
@media (hover: hover) and (pointer: fine) {
  .btn:hover { filter: brightness(1.08); box-shadow: 0 18px 36px -14px rgba(var(--brand-rgb), .75); }
  .btn:hover .go { transform: translateX(3px); }
  [dir="rtl"] .btn:hover .go { transform: scaleX(-1) translateX(3px); }
}

.hero { position: relative; padding: 22px 0 44px; overflow: hidden; }
.hero-grid { position: relative; display: grid; gap: 26px; }
.gallery { min-width: 0; }
.slides { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; border-radius: var(--radius); background: var(--card); box-shadow: var(--shadow); }
.slides::-webkit-scrollbar { display: none; }
.slide { flex: 0 0 100%; margin: 0; overflow: hidden; scroll-snap-align: center; aspect-ratio: 1 / 1; }
.slide img { width: 100%; height: 100%; object-fit: cover; }
.dots { display: flex; justify-content: center; gap: 4px; margin-top: 8px; }
.dot { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; cursor: pointer; }
.dot::before { content: ""; width: 9px; height: 9px; border-radius: 99px; background: var(--ink); opacity: .22; transition: width .25s var(--ease), opacity .25s ease; }
.dot[aria-current="true"]::before { width: 26px; background: var(--brand-text); opacity: 1; }
.hero-info { text-align: center; }
.eyebrow { display: inline-flex; align-items: center; gap: 8px; margin: 0 0 14px; padding: 6px 14px; border-radius: 999px; background: var(--tint); color: var(--brand-text); font-size: 13.5px; font-weight: 600; line-height: 1.4; }
.hero h1 { font-size: clamp(30px, 7.6vw, 52px); font-weight: 800; line-height: 1.22; }
.lead { max-width: 36em; margin: 14px auto 0; color: var(--muted); font-size: 17.5px; }
.price-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px 14px; margin: 22px 0; }
.price-now { color: var(--ink); font-family: var(--display); font-size: clamp(32px, 8.4vw, 44px); font-weight: 800; line-height: 1; }
.price-old { color: var(--muted); font-size: 19px; text-decoration-thickness: 2px; }
.save { padding: 5px 12px; border-radius: 999px; background: var(--accent); color: var(--on-accent); font-size: 14.5px; font-weight: 700; line-height: 1.3; }
.hero .btn { width: 100%; max-width: 440px; min-height: 58px; font-size: 18px; }
.assure { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 22px 0 0; padding: 0; list-style: none; }
.assure li { display: flex; align-items: center; justify-content: center; gap: 9px; padding: 11px 12px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--card); font-size: 14px; font-weight: 600; line-height: 1.35; }
.assure svg { width: 21px; height: 21px; color: var(--brand-text); }

.sec { padding: 56px 0; }
.sec.alt { background: var(--surface); }
.sec-grid { display: grid; gap: 28px; align-items: center; }
.sec-media { margin: 0; overflow: hidden; border-radius: var(--radius); background: var(--card); box-shadow: var(--shadow); }
.sec-media img { width: 100%; }
.kicker { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; color: var(--brand-text); font-family: var(--display); font-size: 15px; font-weight: 700; line-height: 1; }
.kicker::after { content: ""; flex: 0 0 44px; height: 2px; border-radius: 2px; background: currentColor; opacity: .45; }
.sec h2 { margin-bottom: 16px; font-size: clamp(25px, 5.8vw, 38px); font-weight: 800; }
.sec-head { margin-bottom: 26px; text-align: center; }
.sec-head h2 { margin: 0; }
.prose p { color: var(--muted); font-size: 17px; }
.prose p:last-child { margin-bottom: 0; }
.checks { display: grid; gap: 10px; margin: 22px 0 0; padding: 0; list-style: none; }
.checks li { display: flex; align-items: flex-start; gap: 12px; padding: 13px 16px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--card); font-weight: 600; line-height: 1.55; }
.mark { display: grid; place-items: center; flex: none; width: 26px; height: 26px; border-radius: 50%; background: var(--brand); color: var(--on-brand); }
.mark svg { width: 15px; height: 15px; stroke-width: 3; }
.compare { margin-top: 24px; overflow: hidden; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--card); }
.compare table { width: 100%; border-collapse: collapse; font-size: 15px; line-height: 1.45; }
.compare th, .compare td { padding: 13px 12px; border-bottom: 1px solid var(--line); text-align: center; }
.compare thead th { background: var(--surface); font-family: var(--display); font-size: 14px; font-weight: 700; }
.compare th:first-child, .compare td:first-child { text-align: start; font-weight: 600; }
.compare .us { background: var(--tint); color: var(--ink); font-weight: 700; }
.compare thead .us { background: var(--brand); color: var(--on-brand); }
.compare tbody tr:last-child td { border-bottom: 0; }
.guarantee { display: flex; align-items: flex-start; gap: 16px; margin-top: 24px; padding: 20px; border: 1px solid var(--tint-line); border-radius: var(--radius); background: var(--tint); }
.guarantee svg { width: 38px; height: 38px; color: var(--brand-text); }
.guarantee strong { display: block; margin-bottom: 4px; font-family: var(--display); font-size: 18px; line-height: 1.4; }
.guarantee p { margin: 0; color: var(--muted); }
.sec-cta { margin-top: 26px; }
.sec-cta .btn { width: 100%; max-width: 440px; }
.cta-sub { margin: 10px 0 0; color: var(--muted); font-size: 14px; }

.reviews { display: grid; gap: 14px; }
.review { margin: 0; padding: 22px 22px 20px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--card); }
.review svg { width: 26px; height: 26px; margin-bottom: 10px; color: var(--brand-text); }
.review blockquote { margin: 0 0 14px; font-size: 16.5px; line-height: 1.7; }
.review figcaption { color: var(--muted); font-size: 14.5px; font-weight: 600; }
.shots { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
.shots img { width: 100%; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--card); }

.order-sec { padding: 56px 0 72px; background: var(--surface); }
.order-sec .sec-head p { margin: 10px 0 0; color: var(--muted); }
.steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; max-width: 720px; margin: 0 auto 30px; padding: 0; list-style: none; }
.steps li { display: grid; justify-items: center; align-content: start; gap: 10px; font-size: 14px; font-weight: 600; line-height: 1.4; text-align: center; }
.steps .ico { display: grid; place-items: center; width: 52px; height: 52px; border: 1px solid var(--line); border-radius: 50%; background: var(--card); color: var(--brand-text); box-shadow: var(--shadow); }
.steps .ico svg { width: 22px; height: 22px; }
.order-card { max-width: 560px; margin: 0 auto; padding: 24px 20px; border: 1px solid var(--line); border-radius: calc(var(--radius) + 6px); background: var(--card); box-shadow: 0 30px 60px -30px rgba(15, 23, 42, .35); }
.order-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 14px; margin-bottom: 20px; padding-bottom: 18px; border-bottom: 1px dashed var(--field-line); }
.order-head strong { font-family: var(--display); font-size: 17px; line-height: 1.4; }
.order-head .price-now { font-size: 24px; }
.order-head .price-old { font-size: 15px; }
form { display: grid; gap: 14px; }
.field { display: grid; gap: 7px; font-size: 14.5px; font-weight: 600; }
.field input, .field select { width: 100%; min-height: 54px; padding: 12px 16px; border: 1.5px solid var(--field-line); border-radius: var(--radius-sm); background: var(--field); color: var(--ink); font: inherit; font-size: 16px; font-weight: 400; transition: border-color .2s ease, box-shadow .2s ease; }
.field input::placeholder { color: var(--muted); opacity: .75; }
.field input:focus, .field select:focus { outline: none; border-color: var(--brand-text); box-shadow: 0 0 0 4px rgba(var(--brand-rgb), .2); }
.field [aria-invalid="true"] { border-color: #dc2626; }
.pair { display: grid; gap: 14px; }
.qty-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.qty { display: inline-flex; align-items: center; overflow: hidden; border: 1.5px solid var(--field-line); border-radius: var(--radius-sm); background: var(--field); }
.qty button { width: 50px; height: 50px; border: 0; background: transparent; color: var(--ink); font: inherit; font-size: 22px; line-height: 1; cursor: pointer; transition: background-color .2s ease; }
.qty button:active { background: var(--surface); }
.qty input { width: 54px; min-height: 50px; padding: 0; border: 0; background: transparent; color: var(--ink); font: inherit; font-weight: 700; text-align: center; -moz-appearance: textfield; appearance: textfield; }
.qty input::-webkit-outer-spin-button, .qty input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.qty input:focus { outline: none; background: var(--tint); }
.summary { display: grid; gap: 9px; padding: 16px 18px; border-radius: var(--radius-sm); background: var(--surface); font-size: 15px; }
.summary div { display: flex; justify-content: space-between; gap: 14px; }
.summary span:last-child, .summary bdi { font-weight: 600; }
.summary .total { margin-top: 3px; padding-top: 11px; border-top: 1px solid var(--line); font-family: var(--display); font-size: 18px; font-weight: 800; }
.summary .plus { color: var(--muted); font-family: var(--body); font-size: 14px; font-weight: 600; }
.fine { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 2px 0 0; color: var(--muted); font-size: 13.5px; text-align: center; }
.fine svg { width: 17px; height: 17px; color: var(--brand-text); }
.msg { padding: 14px 16px; border-radius: var(--radius-sm); font-weight: 600; text-align: center; }
.msg.error { background: #fef2f2; color: #b91c1c; }
.msg.ok { background: #ecfdf5; color: #047857; }
.wa { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; margin-top: 12px; color: var(--brand-text); font-size: 14.5px; font-weight: 600; text-decoration: none; }
.wa svg { width: 19px; height: 19px; }

.foot { padding: 32px 0 124px; border-top: 1px solid var(--line); color: var(--muted); font-size: 13.5px; text-align: center; }
.foot strong { display: block; margin-bottom: 6px; color: var(--ink); font-family: var(--display); font-size: 17px; }
.foot p { margin: 0 0 4px; }
.sticky { position: fixed; left: 0; right: 0; bottom: 0; z-index: 40; padding: 10px 14px calc(10px + env(safe-area-inset-bottom)); border-top: 1px solid var(--line); background: rgba(var(--bg-rgb), .94); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); transition: transform .32s var(--ease), opacity .32s ease; }
.sticky.away { transform: translateY(110%); opacity: 0; pointer-events: none; }
.sticky-in { display: flex; align-items: center; gap: 14px; max-width: 560px; margin: 0 auto; }
.sticky-price { font-family: var(--display); font-size: 20px; font-weight: 800; line-height: 1.1; white-space: nowrap; }
.sticky .btn { flex: 1; min-height: 52px; }

.rv { transition: opacity .7s var(--ease), transform .7s var(--ease); }
.rv.pre { opacity: 0; transform: translateY(26px); }
.sec-body.rv, .shots.rv { transition-delay: .08s; }

@media (min-width: 480px) {
  .announce span + span { display: inline-flex; }
}
@media (min-width: 520px) {
  .pair { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
}
@media (min-width: 900px) {
  .hero { padding: 56px 0 76px; }
  .hero-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 64px; align-items: center; }
  .hero-grid:not(.solo) .hero-info { text-align: start; }
  .hero-grid:not(.solo) .lead { margin-inline: 0; }
  .hero-grid:not(.solo) .price-row { justify-content: flex-start; }
  .hero-grid:not(.solo) .assure li { justify-content: flex-start; }
  .hero-grid.solo { grid-template-columns: minmax(0, 780px); justify-content: center; }
  .sec { padding: 96px 0; }
  .sec-grid.media { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 72px; }
  .sec-grid.media.flip .sec-media { order: 2; }
  /* a section without a picture reads like a magazine page: its title on one side, its text on the other */
  .sec-grid.text .sec-body { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 64px; align-items: start; }
  .sec-grid.text .sec-title { position: sticky; top: 96px; }
  .sec-grid.text .sec-title h2 { margin-bottom: 0; }
  .sec-grid.text .checks { margin-top: 26px; }
  .sec-cta .btn { width: auto; }
  .reviews { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .shots { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .order-sec { padding: 96px 0; }
  .order-card { padding: 32px 30px; }
  .sticky { display: none; }
  .foot { padding-bottom: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .rv, .btn, .btn svg, .sticky, .dot::before { transition: none; }
}
`;

const TEMPLATE_CSS: Record<LandingTemplate, string> = {
  poster: `
/* the long-image page: one canvas from top to bottom in one gradient, like the long images of Algerian shops.
   Photos melt into it; round badges, feature boxes and the yellow buttons are laid over them; titles sit on brush
   bands; the order form and the footer are on the same canvas. No header bar and no section blocks. */
html { scroll-padding-top: 12px; }
.announce, .top { display: none; }
.wrap { max-width: none; padding: 0 16px; }
main { position: relative; max-width: 480px; margin: 0 auto; overflow: hidden; color: #ffffff; background: radial-gradient(560px 440px at 50% -80px, rgba(255, 255, 255, .28), transparent 70%), radial-gradient(420px 520px at 100% 34%, rgba(255, 255, 255, .07), transparent 70%), radial-gradient(420px 520px at 0 64%, rgba(255, 255, 255, .06), transparent 70%), linear-gradient(180deg, var(--brand-light) 0, var(--canvas) 1200px, var(--canvas-mid) 55%, var(--canvas) 82%, var(--brand-deep) 100%); }

.sx { position: relative; padding: 28px 16px 0; text-align: center; }
.sx-hero { padding-top: 26px; }
.tag { position: relative; z-index: 2; display: inline-block; max-width: 100%; margin: 0 0 12px; padding: 5px 16px; border-radius: 999px; background: var(--highlight); color: var(--on-highlight); font-family: var(--display); font-size: 14.5px; font-weight: 900; line-height: 1.4; transform: rotate(-2deg); box-shadow: 0 8px 18px -10px rgba(0, 0, 0, .65); }
.tag.name { padding: 4px 16px; background: var(--pill); color: var(--on-pill); font-size: 13px; font-weight: 700; transform: none; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .24), 0 8px 16px -10px rgba(0, 0, 0, .6); }

/* big white titles, their last words in a yellow gradient, with the hard shadow of printed posters */
.headline, .banner, .order-sec .sec-head h2 { position: relative; z-index: 2; margin: 0; color: #ffffff; font-family: var(--display); font-weight: 900; line-height: 1.22; text-wrap: balance; filter: drop-shadow(0 3px 0 var(--brand-deep)) drop-shadow(0 10px 14px rgba(0, 0, 0, .28)); }
.headline { font-size: clamp(31px, 9vw, 38px); }
.headline mark { font-size: 1.3em; line-height: 1.15; }
.headline mark, .banner mark, .order-sec .sec-head h2 mark { display: block; background: none; color: var(--highlight); }
@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .headline mark, .banner mark, .order-sec .sec-head h2 mark { background: linear-gradient(180deg, var(--hl-light) 10%, var(--highlight) 48%, var(--hl-deep) 92%); -webkit-background-clip: text; background-clip: text; color: transparent; }
}
/* section titles on a brush stroke from edge to edge */
.banner, .order-sec .sec-head h2 { margin-inline: -16px; padding: 16px 26px 18px; font-size: clamp(25px, 7.4vw, 30px); }
.banner::before, .order-sec .sec-head h2::before, .foot strong::before { content: ""; position: absolute; z-index: -1; inset: 0; background: linear-gradient(180deg, rgba(255, 255, 255, .16), rgba(255, 255, 255, 0) 46%), var(--brand-deep); clip-path: polygon(0 16%, 6% 7%, 19% 12%, 33% 2%, 52% 9%, 68% 1%, 84% 8%, 100% 3%, 98% 46%, 100% 92%, 88% 97%, 71% 91%, 55% 100%, 37% 93%, 20% 99%, 7% 92%, 0 97%, 2% 52%); }
.pill { position: relative; z-index: 2; display: inline-block; max-width: 100%; margin: 12px 0 0; padding: 7px 20px; border-radius: 999px; background: var(--pill); color: var(--on-pill); font-size: 15.5px; font-weight: 700; line-height: 1.45; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .22), 0 10px 20px -10px rgba(0, 0, 0, .6); }
.sx .prose { max-width: 32em; margin: 16px auto 0; }
.sx .prose p { color: #ffffff; font-size: 16px; line-height: 1.75; }

/* photos from edge to edge, melting into the canvas at the top and the bottom */
.hero-media { position: relative; margin: -34px -16px 0; }
.sx-shot { position: relative; margin: 16px -16px 0; }
.hero-media img, .sx-shot img { width: 100%; min-height: 300px; object-fit: cover; -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 13%, #000 76%, transparent 100%); mask-image: linear-gradient(180deg, transparent 0, #000 13%, #000 76%, transparent 100%); }
.hero-media img { min-height: 320px; }
.sticker { position: absolute; top: 15%; inset-inline-start: 12px; z-index: 2; display: grid; place-items: center; align-content: center; width: 104px; height: 104px; padding: 8px; border-radius: 50%; background: radial-gradient(circle at 34% 28%, var(--hl-light), var(--highlight) 58%, var(--hl-deep)); color: var(--on-highlight); text-align: center; line-height: 1.12; transform: rotate(-10deg); box-shadow: 0 0 0 4px #ffffff, 0 14px 28px -10px rgba(0, 0, 0, .6); }
.sticker .now { font-family: var(--display); font-size: 19px; font-weight: 900; }
.sticker s { font-size: 12.5px; opacity: .8; }
.sticker .cut { margin-top: 2px; font-size: 13.5px; font-weight: 900; }
.sx-hero > .sticker { position: relative; top: auto; inset-inline-start: auto; margin: 18px auto 0; }

/* what is laid over the bottom of the picture above, or simply follows the text */
.lift { position: relative; z-index: 3; margin-top: -92px; }
.flat { position: relative; margin-top: 18px; }
.badges { display: flex; justify-content: center; gap: 8px; margin: 0; padding: 0; list-style: none; }
.badges li { display: grid; justify-items: center; align-content: start; gap: 7px; flex: 1 1 0; max-width: 116px; }
.badge-ico { display: grid; place-items: center; width: 60px; height: 60px; border-radius: 50%; background: radial-gradient(circle at 34% 28%, var(--brand-light), var(--canvas) 62%, var(--brand-deep)); color: #ffffff; box-shadow: 0 0 0 3px #ffffff, 0 12px 20px -8px rgba(0, 0, 0, .6); }
.badge-ico svg { width: 28px; height: 28px; }
.badge-label { padding: 3px 10px; border-radius: 999px; background: rgba(var(--pill-rgb), .9); font-size: 13px; font-weight: 700; line-height: 1.35; box-shadow: 0 6px 14px -8px rgba(0, 0, 0, .6); }

/* feature boxes: an icon ringed in the highlight, the feature in the highlight colour, its line in white */
.rows { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; text-align: start; }
.row-box { display: flex; align-items: center; gap: 12px; padding-block: 10px; padding-inline: 10px 16px; border-radius: 18px; background: linear-gradient(180deg, rgba(255, 255, 255, .12), rgba(255, 255, 255, 0) 55%), var(--pill); box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, .26), 0 14px 24px -14px rgba(0, 0, 0, .7); }
.row-ico { display: grid; place-items: center; flex: none; width: 46px; height: 46px; border-radius: 50%; background: #ffffff; color: var(--canvas); box-shadow: 0 0 0 3px var(--highlight); }
.row-ico svg { width: 22px; height: 22px; stroke-width: 2.3; }
.row-text { display: grid; gap: 1px; min-width: 0; }
.row-text strong { color: var(--highlight); font-family: var(--display); font-size: 16.5px; font-weight: 900; line-height: 1.35; }
.row-text span { color: #ffffff; font-size: 14px; line-height: 1.5; }
.rows .long .row-text strong { font-size: 15px; line-height: 1.45; }
/* side by side with strips of the product photos, from edge to edge */
.rows.strips { gap: 3px; margin-inline: -16px; }
.rows.strips li { position: relative; display: flex; align-items: center; min-height: 116px; }
.rows.strips .row-box { position: relative; z-index: 1; width: 64%; margin-block: 8px; margin-inline-start: 12px; }
.rows.strips .row-pic { position: absolute; top: 0; bottom: 0; inset-inline-end: 0; width: 46%; height: 100%; object-fit: cover; }

/* the yellow button and its cart */
.btn-cta { min-width: 74%; max-width: 100%; min-height: 60px; margin-top: 18px; padding-block: 8px; padding-inline: 30px 8px; gap: 18px; background: linear-gradient(180deg, var(--hl-light) 0, var(--highlight) 42%, var(--hl-deep) 100%); color: var(--on-highlight); font-size: 22px; font-weight: 900; box-shadow: inset 0 -3px 0 rgba(0, 0, 0, .14), inset 0 2px 0 rgba(255, 255, 255, .5), 0 0 0 3px rgba(255, 255, 255, .28), 0 16px 28px -12px rgba(0, 0, 0, .65); }
.lift > .btn-cta:first-child, .flat > .btn-cta:first-child { margin-top: 0; }
.btn-cta .cart { display: grid; place-items: center; flex: none; width: 44px; height: 44px; border-radius: 50%; background: #ffffff; color: #111111; box-shadow: 0 3px 8px -2px rgba(0, 0, 0, .35); }
.btn-cta .cart svg { width: 23px; height: 23px; }
@media (hover: hover) and (pointer: fine) { .btn-cta:hover { box-shadow: inset 0 -3px 0 rgba(0, 0, 0, .14), inset 0 2px 0 rgba(255, 255, 255, .5), 0 0 0 4px rgba(255, 255, 255, .42), 0 20px 34px -12px rgba(0, 0, 0, .7); } }
.sx .btn:focus-visible, .sticky .btn:focus-visible { outline-color: #ffffff; }
.sx .cta-sub { margin: 10px 0 0; color: #ffffff; font-size: 13.5px; font-weight: 600; text-shadow: 0 1px 2px rgba(0, 0, 0, .35); }

/* what the page cannot draw: white cards on the canvas */
.sx .compare, .sx .guarantee { margin: 18px 0 0; color: var(--ink); text-align: start; }
.sx .compare { border: 0; box-shadow: 0 16px 30px -18px rgba(0, 0, 0, .6); }
.sx .compare thead .us { background: var(--canvas); color: #ffffff; }
.sx .guarantee { border: 0; background: #ffffff; box-shadow: 0 0 0 3px var(--highlight), 0 16px 30px -18px rgba(0, 0, 0, .6); }
.sx .guarantee svg { color: var(--canvas); }
.sx.extra { padding-top: 8px; }
.reviews-sx .reviews { margin-top: 16px; text-align: start; }
.reviews-sx .review { border: 0; color: var(--ink); box-shadow: 0 16px 30px -18px rgba(0, 0, 0, .6); }
.reviews-sx .shots, .reviews-sx .reviews { grid-template-columns: minmax(0, 1fr); }
.reviews-sx .shots img { border: 0; }

/* AI posters, stacked: their edges melt into the canvas */
.poster { position: relative; margin: 0; }
.poster a { display: block; }
.poster img { width: 100%; -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 4%, #000 96%, transparent 100%); mask-image: linear-gradient(180deg, transparent 0, #000 4%, #000 96%, transparent 100%); }
.hero-poster img { -webkit-mask-image: linear-gradient(180deg, #000 0, #000 96%, transparent 100%); mask-image: linear-gradient(180deg, #000 0, #000 96%, transparent 100%); }

/* the order form, on the same canvas */
.order-sec { padding: 32px 0 4px; background: transparent; }
.order-sec .sec-head { margin-bottom: 18px; }
.steps { gap: 8px; margin-bottom: 22px; }
.steps li { color: #ffffff; font-size: 13.5px; }
.steps .ico { border: 0; background: #ffffff; color: var(--canvas); box-shadow: 0 0 0 3px var(--highlight), 0 12px 20px -8px rgba(0, 0, 0, .55); }
.order-card { padding: 20px 16px 18px; border: 0; border-radius: 26px; color: var(--ink); box-shadow: 0 0 0 4px rgba(255, 255, 255, .2), 0 30px 50px -24px rgba(0, 0, 0, .65); }
.pair { grid-template-columns: minmax(0, 1fr); }
.order-card .btn-block, .sticky .btn { background: linear-gradient(180deg, var(--hl-light) 0, var(--highlight) 42%, var(--hl-deep) 100%); color: var(--on-highlight); box-shadow: inset 0 -3px 0 rgba(0, 0, 0, .14), inset 0 2px 0 rgba(255, 255, 255, .5), 0 12px 24px -12px rgba(0, 0, 0, .55); }
.order-card .btn-block { min-height: 60px; font-size: 20px; font-weight: 900; }

/* the footer closes the canvas on a last brush band */
.foot { margin-top: 26px; padding: 0 0 108px; border: 0; color: #ffffff; font-size: 13px; }
.foot strong { position: relative; z-index: 0; margin: 0 -16px 12px; padding: 12px 24px 14px; color: #ffffff; font-size: 19px; font-weight: 900; }
.sticky { border-top: 0; background: linear-gradient(180deg, rgba(var(--canvas-rgb), 0), rgba(var(--canvas-rgb), .94) 45%); -webkit-backdrop-filter: none; backdrop-filter: none; }
.sticky-in { max-width: 400px; }
.sticky-price { color: #ffffff; text-shadow: 0 1px 3px rgba(0, 0, 0, .45); }

/* on a larger screen the canvas is a phone-width card with rounded corners and a deep frame */
@media (min-width: 480px) {
  main { max-width: 400px; margin: 28px auto 40px; border-radius: 34px; box-shadow: 0 0 0 7px var(--brand-deep), 0 0 0 8px rgba(255, 255, 255, .55), 0 44px 80px -30px rgba(15, 23, 42, .55); }
  main::after { content: ""; position: absolute; inset: 0; z-index: 8; border-radius: inherit; box-shadow: inset 0 0 0 2px rgba(255, 255, 255, .32); pointer-events: none; }
}
@media (min-width: 900px) {
  .foot { padding-bottom: 30px; }
}
`,
  impact: `
.hero { background: radial-gradient(110% 65% at 88% -12%, rgba(var(--brand-rgb), .12), transparent 62%), linear-gradient(180deg, var(--tint) 0%, var(--bg) 94%); }
[dir="ltr"] .hero h1, [dir="ltr"] .sec h2 { letter-spacing: -0.015em; }
.order-sec { background: linear-gradient(180deg, var(--surface) 0%, var(--tint) 100%); }
`,
  elegance: `
body { font-size: 16.5px; }
.announce { background: var(--ink); color: var(--bg); font-weight: 500; }
.brand-name { font-size: 21px; }
/* the photo in a thin frame, over an offset panel */
.gallery { position: relative; isolation: isolate; }
.gallery::before { content: ""; position: absolute; z-index: -1; top: 34px; bottom: 48px; left: -20px; right: 34px; background: var(--surface); }
.slides { margin: 12px; border-radius: 0; box-shadow: none; outline: 1px solid var(--line); outline-offset: 10px; }
.eyebrow { padding: 0; border-radius: 0; background: transparent; color: var(--muted); font-weight: 500; }
.hero h1 { font-size: clamp(32px, 7.8vw, 58px); font-weight: 700; line-height: 1.25; }
.price-now { color: var(--brand-text); font-weight: 700; }
.save { border-radius: 0; }
.btn { box-shadow: none; font-weight: 600; }
[dir="ltr"] .btn { font-size: 15px; letter-spacing: .08em; text-transform: uppercase; }
@media (hover: hover) and (pointer: fine) { .btn:hover { box-shadow: none; filter: brightness(1.18); } }
.assure li { border-width: 0 0 1px; border-radius: 0; background: transparent; }
.kicker { font-weight: 500; }
.sec h2 { font-weight: 700; }
.sec-media { border-radius: 0; box-shadow: none; }
.checks { gap: 0; }
.checks li { padding: 14px 2px; border-width: 0 0 1px; border-radius: 0; background: transparent; }
.mark { border: 1px solid var(--tint-line); background: transparent; color: var(--brand-text); }
.compare, .review, .order-card { border-radius: 0; }
.guarantee { padding: 22px 0; border-width: 1px 0; border-color: var(--line); border-radius: 0; background: transparent; }
.review { background: transparent; }
.steps .ico { background: transparent; box-shadow: none; }
.order-card { box-shadow: 0 30px 60px -36px rgba(28, 25, 23, .3); }
.field input, .field select, .qty { border-width: 1px; border-radius: 0; }
.summary, .msg { border-radius: 0; }
`,
  nuit: `
html { color-scheme: dark; }
.announce { background: transparent; color: var(--ink); border-bottom: 1px solid var(--line); }
.hero { background: radial-gradient(70% 55% at 50% 0%, rgba(var(--brand-rgb), .3), transparent 72%), radial-gradient(45% 40% at 100% 35%, rgba(var(--accent-rgb), .14), transparent 70%), var(--bg); }
.slides { box-shadow: 0 0 0 1px var(--line), 0 30px 80px -30px rgba(var(--brand-rgb), .55); }
.btn { box-shadow: 0 0 0 1px rgba(var(--brand-rgb), .6), 0 16px 40px -12px rgba(var(--brand-rgb), .7); }
@media (hover: hover) and (pointer: fine) { .btn:hover { box-shadow: 0 0 0 1px rgba(var(--brand-rgb), .8), 0 20px 50px -12px rgba(var(--brand-rgb), .85); } }
.eyebrow { border: 1px solid rgba(var(--brand-rgb), .32); background: rgba(var(--brand-rgb), .12); }
.price-now { color: var(--brand-text); text-shadow: 0 0 32px rgba(var(--brand-rgb), .45); }
.dot::before { background: var(--ink); }
.sec-media { box-shadow: 0 0 0 1px var(--line), 0 30px 70px -40px rgba(var(--brand-rgb), .6); }
.checks li, .assure li, .review, .compare, .order-card, .steps .ico { background: linear-gradient(180deg, rgba(255, 255, 255, .04), rgba(255, 255, 255, .01)), var(--card); }
.mark { box-shadow: 0 0 18px rgba(var(--brand-rgb), .55); }
.steps .ico { box-shadow: 0 0 24px -6px rgba(var(--brand-rgb), .5); }
.order-sec { background: radial-gradient(60% 50% at 50% 100%, rgba(var(--brand-rgb), .16), transparent 70%), var(--surface); }
.order-card { box-shadow: 0 0 0 1px var(--line), 0 40px 90px -40px rgba(var(--brand-rgb), .45); }
.msg.error { background: rgba(220, 38, 38, .16); color: #fca5a5; }
.msg.ok { background: rgba(16, 185, 129, .16); color: #6ee7b7; }
.field [aria-invalid="true"] { border-color: #f87171; }
`,
};

export function landingCss(template: LandingTemplate, colors: LandingColors): string {
  return `${tokens(template, colors)}${BASE}${TEMPLATE_CSS[template]}`;
}
