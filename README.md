# EcomFlow AI

AI tools for cash-on-delivery (COD) online sellers in Algeria. From a product's name and photos, two studios write and
build what a seller needs to sell it: a **landing page** (a self-contained HTML file with a COD order form, with AI
images for each section) and a **video ad** (script, then a real video file made in the browser). Around them: a file
library, a landing-page assembler and a COD margin calculator. The interface is available in Arabic (default,
right-to-left), French and English.

## Stack

- **Frontend:** React 19, Vite 6, Tailwind CSS 4 (single-page app, code-split per tool); three.js for the home page's 3D hero
- **Backend:** Express 5 (`server.ts`, routes in `src/routes`), PostgreSQL through Prisma 7
- **AI:** Google Gemini, called from the server with each user's own API key (stored encrypted)
- **Hosting:** Vercel (`npm run deploy:vercel`) or any Node host (`npm run build` then `npm start`)

## Getting started

You need Node.js 22+ and a PostgreSQL database.

```bash
npm install
cp .env.example .env        # PowerShell: copy .env.example .env
# edit .env: at least DATABASE_URL and SESSION_SECRET
npx prisma db push          # creates the tables (first run only)
npm run dev                 # http://localhost:3000
```

In development, with no Google credentials set, **Continuer avec Google** signs in a demo account, and e-mail codes
are printed in the server console. To make someone an administrator:
`UPDATE users SET is_admin = true WHERE email = 'you@example.com';` then open `/admin`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | API + Vite dev server on port 3000 |
| `npm run build` | Production build: the site into `dist/`, the Node server into `build/server.cjs` (kept out of the public folder, always in production mode) |
| `npm start` | Runs the production server (`build/server.cjs`), which serves `dist/`; it refuses to start without `SESSION_SECRET` |
| `npm run lint` | Type-checks the whole project (`tsc --noEmit`) |
| `npm test` | Unit tests |
| `npm run test:coverage` | Unit tests with a coverage report |
| `npm run check` | Type check, then tests |
| `npm run deploy:vercel` | Builds and deploys to Vercel |

## Project layout

```
server.ts, scripts/vercel-entry.ts   Express app, and the Vercel entry that reuses it (outside api/: Vercel would treat that folder as its own)
src/routes/                API routes (auth, admin, settings, assets, history, preferences...)
src/lib/                   Server and shared logic: sessions, plan rules, OTP, crypto, e-mail, rate limiting,
                           file validation (assetRules), landing pages (landing*), video (video*), pricing
src/components/assets/     The file library
src/components/landing/    Parts of the landing page publisher (templates, section images, reviews...)
src/components/home/       The public home page: the 3D hero (see below) and illustrations drawn in code, not screenshots
src/pages/, src/components/  Other screens; one file per tool (VideoAdGenerator, LandingPageGenerator...)
src/i18n/                  Translations, one module per area (see below)
src/legal/                 Terms of service and privacy policy (a draft: have a lawyer review it)
prisma/schema.prisma       Database schema
tests/unit/                Unit tests
scripts/                   Admin and maintenance scripts
```

## Home page

The public home page is always dark (whatever the visitor's app theme), with the red of the Algerian flag as its one
accent. The signed-in app shares that identity (`src/index.css`): the same near-black surfaces and red, dark by
default with a light theme that keeps the red; the dashboard opens on a banner-sized copy of the hero's red-lit room
(`.dash-room`) with the same thin headings, white pill button and large light figures. Its first screen is a real-time 3D scene: a polished ring turning around a
crystal cube, seen through a fluted glass panel, lit red from the corners.

- **Scene:** `src/components/home/heroScene.ts` (three.js, no React). The scene is rendered into an HDR target, then a
  full-screen pass draws it through the fluted panel. The panel's extent and the object's place are read from two
  invisible guides in `HomeHero.tsx`, so the scene follows the layout at every width and mirrors in Arabic.
- **Off the main thread:** where the browser supports it (OffscreenCanvas), the scene runs in a worker
  (`heroWorker.ts`), so three.js and every frame stay off the page's main thread; otherwise it runs on the page
  (`heroDriver.ts` picks). The 3D code (about 130 KB compressed) loads once the page is idle, after its text has painted.
- **Cost control:** phones and weak machines get a lighter picture (no refraction pass, lower resolution); the
  resolution also drops if frames run slow, and drawing stops when the hero is off screen or the tab is hidden.
- **Fallbacks:** reduced motion gets a single still frame; no WebGL 2, or data saver, gets a still picture
  (`public/hero/still-*.webp`, about 20 KB each) and downloads no 3D code. If the scene changes, re-render those
  pictures from the live page (hide the text, capture the hero at 1600×900 and at 390×844 ×2, save as WebP).
- **Figures** on the first screen are facts about the product (58 wilayas, 4 video formats, 3 languages), not
  invented usage numbers.

## Files

- **Data:** `Asset` (an image, its bytes stored in Postgres), one row per file, filtered by the signed-in account; ids
  sent by the browser are only used inside that filter, so one account can never read, change or delete another's files.
- **Files:** JPG, PNG and WebP only, checked from the bytes rather than the name; 3 MB per image and 250 MB per account
  (25 MB without an active plan). Files are served with `nosniff` and a sandboxing content-security policy.
- **Storage limits:** the older tools keep at most 100 landing-page and 100 chat sessions per account (1 MB and 2 MB
  each) and the newest 50 history entries. Each quota check runs under a per-account database lock, so requests sent at
  the same time cannot overshoot it.
- **Videos** made in the browser are downloaded, not stored on the server.
- The campaign workspace, ads studio, brand kit, Meta publishing and the TikTok / Snapchat / Google packs were removed
  (October 2026). Their tables (`projects`, `project_outputs`, `brand_kits`, `meta_connections`) stay in the schema so
  no data is dropped; nothing reads them any more.

## Plans and access

Users start free. They pick a plan, pay outside the app and upload a proof; an administrator approves it in `/admin`,
which sets the plan status and its expiry date (no expiry date means a lifetime plan).

- The rule lives in one file, `src/lib/access.ts`, used by the browser (to lock the tools) and by the server
  (`/api/ai/generate` and `/api/ai/video` answer 403 `PLAN_REQUIRED` without a live plan; administrators are exempt).
- Sessions are signed cookies that expire after 30 days. Changing `SESSION_SECRET` signs everyone out. Each session
  carries a stamp of the account's password (`passwordStamp` in `src/lib/session.ts`), checked on every signed-in
  request (`src/lib/requireAuth.ts`): resetting the password ends every session opened before, a deleted account's
  session stops working, and a password-reset link works once. Logging out ends only the session of that browser.
- A Google sign-in marks the e-mail as verified (an address Google has not verified is refused), and the sign-up
  form never changes the password of a verified or Google account.
- The user object the API returns never includes the password hash or the payment proof (only the admin pages show
  the proof, through their own routes).
- Gemini and image-service keys are encrypted at rest (`TOKEN_ENCRYPTION_KEY`, falling back to `SESSION_SECRET`).
- **Browser security:** the built `index.html` carries a content security policy (scripts only from this site, or one
  of the inline scripts allowed by hash, including the order-form script of generated landing pages, which runs in the
  live preview). Security headers (`nosniff`, `X-Frame-Options`, HSTS, `Permissions-Policy`) are set by Express and,
  on Vercel, by the routes in `scripts/vercel-output.mjs`. If you add an inline script to `index.html`, the build
  hashes it automatically (`vite.config.ts`).
- **Requests:** bodies are limited to 1 MB, or 10 MB for signed-in requests to the routes that take images. The
  client address used by the rate limits trusts exactly `TRUST_PROXY` proxies (default 1). The sign-in, sign-up,
  code and contact limits are counted in Postgres (`rate_limit_hits`, keys stored as hashes, `src/lib/rateLimitStore.ts`)
  so every server instance shares them; if that table is missing they fall back to counting in memory. The other limits
  count in memory, per instance.
- **Plan prices** (set in `/admin`) are written as one left-to-right unit (`formatPrice` in `src/lib/pricing.ts` wraps
  them in Unicode isolates and groups digits with no-break spaces), so Arabic text never reverses "1 500 DA".
- **Preferences** (`PUT /api/preferences`) are checked field by field (`src/lib/preferencesRules.ts`): a value of the
  wrong shape or size is refused with a 400 or 413 instead of reaching the database.

## Points (AI on the platform's key)

Sellers who do not want to set up their own Gemini key can pay for the AI with **points**, spent on the platform's
own key. The plan still opens the tools; points only pay for the AI. A seller with their own key keeps using it and
spends no points; administrators use the platform key for free.

- **Setup (admin → Points):** paste a Gemini key with billing (stored encrypted, shown masked, never sent to the
  browser). Until a key is set, points cannot be bought and nothing changes for anyone.
- **Prices** (editable there, defaults in `src/lib/credits.ts`): text 1 point per 5 000 tokens actually used (prompt,
  photos and answer; a call costs 1 point at least, a big landing page 3 to 4), an AI image 5 points, AI video 8 points
  a second. Packs: 100 points for 1 000 DA, 300 for 2 700 DA, 1 000 for 8 000 DA. The admin page shows each price's
  margin over Google's cost (about 4 DA per 5 000 tokens, 8 to 17 DA an image, 25 DA a video second, at about 250 DA a
  dollar), worked out with the cheapest point of the packs.
- **Buying:** the seller picks a pack, pays with one of the payment methods and uploads a proof (same checks as a plan);
  an admin approves or refuses it in admin → Points, or adds points by hand (a negative number takes them back).
- **Charging** (`src/lib/creditStore.ts`, used by `/api/ai/generate`, `/api/ai/generate-product` and `/api/ai/video`):
  points are taken before the call with a conditional update, so two calls at once can never spend the same points,
  and given back when the call fails, when an image model answers without an image, or when Google cannot make a video
  clip (the clip's token carries what it cost). Every change is a row of `credit_entries`, unique per reason and
  reference: an approved purchase is credited once, a refund happens once. The answer carries the new balance
  (`X-Credits-Left`), and a refusal for lack of points (402 `CREDITS_REQUIRED`) opens the points window.
- **In the app:** the balance sits under the plan in the menu, the image and video buttons show their cost in points,
  and the dashboard reminds a seller without a key when fewer than two images' worth of points are left.
- Tested end to end against a local server, an in-memory database and a stand-in for Google's API (33 checks:
  purchase, approval twice at once, charges by tokens, refunds, three requests at once with points for one, plan still
  required, admin free, key never shown); not yet with real money or a real Google bill.

## AI and Gemini keys

Every AI call runs on the server with the user's own Gemini key (`/api/ai/generate`, `/api/ai/video`).

- **Free key** (Google AI Studio without billing): text only, about 20 requests a day per model. When one model's daily
  quota is used up, Google says it is overloaded, or it no longer offers the model to this key, the server retries on the
  next model of `TEXT_MODEL_FALLBACKS` (`src/lib/aiFallback.ts`). When none can answer, the user gets a plain message
  saying why (the quota answer wins over a missing model, so the message says what to do).
- **Key with billing:** also AI images and AI video clips. A free key gets "billing needed" (HTTP 402) for both.
  - Images (product photos, landing page section images): Nano Banana 2.1 (`gemini-nano-banana-2.1`), then
    `gemini-3.1-flash-image` and `gemini-2.5-flash-image` (`IMAGE_MODEL_FALLBACKS`; 2.5 is closed to keys that never
    used it and retires on 2027-03-15). The shape asked for (1:1, 4:5, 9:16) is sent as `imageConfig.aspectRatio`; the
    server forwards only that field of `imageConfig`, so the image size and its cost stay Google's default (1K).
  - Video clips: Gemini Omni Flash (`gemini-omni-1.1-flash`) through the Interactions API, as background jobs
    (`src/lib/videoJobs.ts`): 720p, about $0.10 per filmed second, the cost shown before anything is filmed. Veo is no
    longer used (Google shuts the Veo 3.1 models down on 2026-10-22).
- A wrong, expired or blocked key gets its own message (HTTP 400).

**Image services.** Gemini makes the images by default. In Paramètres → **Service d'images** the seller can choose
another one and save its key (encrypted, never sent back, used only by the server in `POST /api/ai/image`); text and
video always use Gemini. `src/lib/imageProviders.ts` builds each request and reads each answer:

- **OpenAI**: with the product photo, `images/edits` (multipart) with `gpt-image-2.5-sunburst`; from words, `images/
  generations` with `gpt-image-2.5-flare`; `gpt-image-2` when the account cannot use the first model. Needs credit, and
  OpenAI may ask to verify the organization.
- **FLUX Kontext on fal.ai**: `fal-ai/flux-pro/kontext` (photo) or its `text-to-image` version, picture returned in the
  answer (`sync_mode`).
- **Cloudflare Workers AI** (`flux-1-schnell`, free daily allowance): draws from words only, so the server and the pages
  never send it a product photo, and the landing-page images and posters refuse it.

These were tested against a local stand-in that follows each service's documentation (`IMAGE_PROVIDERS_BASE_URL`, used
only outside production), not with real keys.

**Text engines.** In Paramètres → **Moteur IA des textes** each seller picks who writes their landing pages, video
scripts and analyses (`src/lib/textEngines.ts`): Google Gemini (default, the only one points can pay for), OpenAI,
Anthropic Claude, Mistral, DeepSeek, xAI Grok or OpenRouter (hundreds of models with one key), with the service's logo
(`src/assets/ai-logos`, MIT, licence file beside them). Each runs on the seller's own key (encrypted, never sent back);
one OpenAI key serves both texts and images. AI video always uses Gemini.

- **No tool changed:** the tools still build Gemini-shaped requests; `src/lib/textEngineRequest.ts` turns them into each
  service's request (system prompt, conversation, product photos, JSON mode with the schema written into the
  instructions) and the answer back into Gemini's shape. Claude goes through Anthropic's official SDK
  (`@anthropic-ai/sdk`: medium effort, and the server-side `fallbacks: "default"` on the models that take it), OpenAI
  through its Responses API, the others through their chat-completions APIs (`src/lib/textEngineCall.ts`). DeepSeek's
  chat model reads no images, so the photos are left out for it.
- **Models:** each engine has a default (Claude Opus 5.5, GPT-6 Luna, Mistral Large, DeepSeek Chat, Grok 4.3,
  OpenRouter's auto router); **Charger les modèles** lists the models the seller's saved key can use (`GET /api/ai/models`),
  and any id can be typed. Model ids are checked (letters, digits, `. _ : / -`).
- **Errors** come back in plain words (wrong key, no credit, quota, unknown model, refusal); the service's own message,
  which can quote part of the key, stays in the server log.
- **Images without Gemini:** a seller with no Gemini key and no points whose image service is OpenAI or FLUX gets every
  image the tools ask Gemini for drawn by that service instead.
- Tested end to end against a local stand-in for each service (`TEXT_PROVIDERS_BASE_URL`, outside production only; 22
  checks), not with real keys: watch the first real call of each engine.

Every section of the app has its own picture, a 3D emoji from Microsoft's Fluent Emoji set (MIT licence, kept in
`src/assets/sections/LICENSE.txt`), shown in the menu, the dashboard's **Accès rapide** grid, each page header and the
phone top bar (`src/lib/sections.ts`). They are 128 px WebP files (about 3 KB each), so they look the same on every
phone and computer.

What the two main tools produce:

- **Video ads:** the AI writes the script, then **Créer la vidéo** turns it into a real video file in the browser (MP4,
  or WebM where the browser cannot record MP4), in the style of today's short ads: the photos full frame with slow camera
  moves (a photo far from the frame's shape is shown whole over a blurred copy of itself), captions that pop in word by
  word with one word highlighted, subtitles that page through the whole voice-over line, swipe transitions and a closing
  card where the price lands. It has background music made in the browser (`src/lib/videoMusic.ts`, no audio file and no
  licence; it can be switched off). This step uses no AI quota. With a billed key, **AI clips** films each scene with
  Gemini Omni from the product photo (opening, middle and final shots directed differently, music, no voice, no text),
  the scenes take the clips' length and the finished video keeps their sound.
- **Landing pages:** the AI writes the sections, then **Page prête** turns them into one self-contained HTML file, in one
  of four templates (`src/lib/landingTheme.ts`, `landingStyle.ts`) coloured from the generated palette (adjusted so text
  on buttons and badges always reads): photo gallery, price with the saving worked out from the old price, and a
  cash-on-delivery order form (58 wilayas, Algerian mobile number check) with the order total.
  - **Affiche** (the default, `src/lib/landingPoster.ts`): the long-image page Algerian shops use, drawn as one
    seamless canvas: a single gradient from top to bottom (no header bar, no section blocks; a framed phone-width card
    with rounded corners on larger screens), deep blue and yellow by default or the product's palette
    (**Couleurs de l'affiche**). Photos run from edge to edge and melt into the canvas; round feature badges and the
    yellow button are laid over the bottom of the first photo, with the price on a sticker; section titles sit on brush
    bands, white with their last words in a yellow gradient; feature boxes (an icon matched to the feature's words,
    `iconsFor` in `src/lib/landingIcons.ts`) lie over the bottom of a section's photo, or over strips of the product
    photos when the section has none; the order form and the footer are on the same canvas. With a billed key,
    **Créer les affiches IA** has Google draw each shown section as a poster from the product photo (2:3 for the
    opening, 4:5 after), in the canvas colours, with the section's own (editable) headline, line, features and button
    in the picture, one shared look and edges that join (`posterImagePrompt` in `src/lib/landingImages.ts`; it forbids
    any other text, no prices, customer counts, ratings or reviews, and asks for large text only, since image models
    garble small Arabic). Each poster can be redone or removed, and once they are all there they download as one long
    JPG for a shop's product description. The publisher warns when the product photos are under 700 px wide, since
    the canvas shows them large.
  - **Impact**, **Élégance**, **Nuit**: classic web pages (text beside pictures), light, ivory or dark; with a billed
    key, each shown section can get an AI picture from the product photo (`sectionImagePrompt`).
  - **Section by section** (`src/components/landing/SectionImages.tsx`, which replaced the old Studio Photos Produit):
    every section tile has **Générer** (this section only, its cost beside it) and **Copier le prompt** (the exact words
    the AI would get, to make the image in ChatGPT, Midjourney or another tool with the product photo attached), plus
    Refaire and Retirer once an image is there. The cost line follows the image service chosen in Paramètres: about
    $0.04 an image with Gemini (`src/lib/imageCost.ts`, Google's price at the default 1K size), "at your service's rate"
    for OpenAI and FLUX, whose prices the app does not know.
  - **In the structure editor** (`src/components/landing/SectionPromptRow.tsx`), each section card offers the same two
    choices beside its prompt: **Générer l'image** (from that section's prompt and the first product photo, in the
    format picked in the form, cost shown) or **Copier le prompt**. The picture shows in the card (download, redo,
    remove) and goes into the ready page; it is not saved in the history. Both places draw through
    `src/services/sectionImage.ts`.
  - Around any template, the seller sets the delivery price (by wilaya, free or fixed), ticks the promises the page
    makes (58 wilayas, check before paying, guarantee; cash on delivery is always there) and can add real customer
    reviews, as text or screenshots. An order opens the seller's WhatsApp with every detail and the total filled in,
    and can also be posted to an https address (a Google Apps Script that writes to a sheet, for example). The seller
    uploads the file to any host.
  - Not published as fact, because the AI invents it: the reviews it writes (their section takes the seller's real
    reviews or disappears), the line it writes under each button (customer counts, ratings, stock left: the seller's
    ticked promises stand there instead) and its guarantee section (shown only when the seller offers a guarantee or a
    check before paying). Buttons use the AI's plain call to action, not its urgency or discount lines. The rest of the
    copy is the seller's to check: **Modifier les textes** covers titles, text, benefits, button text, guarantee and
    comparison table, and the publisher asks the seller to read it before publishing.

## Translations

All interface text is in `src/i18n`, one module per area (`core`, `shared`, `video`, `funnels`, `admin`...), each entry
having `fr`, `ar` and `en`. French is the source of truth.

- In a component: `const { t, tf } = useLanguage();` then `t('someKey', 'Texte français de repli')`. Use
  `{placeholders}` for values, and `<RichText>` for a sentence with **bold** parts (translate such a sentence as one string).
- Option lists whose value is stored or sent to the AI stay in French in the code; show them with `tf(text)`.
- **Never translate or reword an AI prompt.**
- A tool's texts load with the tool: its file starts with a bare import such as `import '../i18n/video';`. A text used by
  several tools, or by the app shell, belongs in `src/i18n/shared.ts`.
- Dates go through `formatDate` in `src/i18n/dates.ts` so they follow the interface language.
- Messages the API sends back are written in French in the routes and translated on the way out
  (`src/i18n/serverMessages.ts`); add new ones there, a test fails if one is missing.
- Use logical Tailwind classes (`ms-`, `pe-`, `text-start`, `start-0`...) instead of left/right ones so the layout mirrors in Arabic.

Tests check that every entry has all three languages, that placeholders match, that each key exists, and that a file never
uses a dictionary it does not import.

## Tests

`npm test` runs the unit tests (604 in 54 files): plan rules, sessions, OTP, encryption, passwords, rate limiting, e-mail
delivery, settings validation, pricing, translations, AI error handling, the video timeline, music and AI video jobs, the
landing page HTML, its templates, colours and order totals,
file validation, image costs, the dashboard's "to do" list and more. Coverage of `src/lib`, `src/i18n` and `server-telegram.ts` is above 80 %. React
components, the Express routes and `server.ts` are **not** covered by unit tests; they were checked in a real browser
against a real database during development (data ownership between two accounts, accessibility with axe on 80 screen
variants), and that browser harness is not part of
this repository.

## Deployment

`npm run deploy:vercel` builds, assembles the Vercel output (`scripts/vercel-output.mjs`) and deploys. Set the variables
from `.env.example` in the host. In production `SESSION_SECRET` is required: both server bundles (`build/server.cjs` and
the Vercel function) are built with `NODE_ENV=production`, so they refuse to start without it instead of using the
development secret. `SITE_URL` should be the public address of the site so link previews (WhatsApp, Facebook) get an
absolute image URL.

**Database update for this version:** run `npx prisma db push` once against the production database. It only adds
tables (`credit_purchases` and `credit_entries` for points, the text-engine columns of `api_settings`, `assets`, plus the unused `projects`, `project_outputs`, `brand_kits` and `meta_connections`) and five columns to `api_settings`
(`image_provider`, defaulting to `gemini`, and the empty key columns of the other image services), plus `users.credits` (0)
and the points settings on `platform_config` (defaults as above), and leaves existing
data alone; until it runs, the settings page and every AI call fail (they read the new columns). Read
the plan Prisma prints before confirming, and stop if it mentions dropping or resetting anything. Library images are
stored in Postgres (up to 250 MB per account), so keep an eye on the database size on small plans.

The same `npx prisma db push` also adds the `rate_limit_hits` table (shared sign-in rate limits). Nothing else depends
on it: until it exists, those limits count in memory as before and the server logs one warning.

## Known gaps

- The tools Consultant Expert IA, Catalogue, Scout Telegram, Annonces Darja, Produits Gagnants and Calendrier exist in
  the code but are not linked from the sidebar. Their interface text is still French only.
- Videos made with **Créer la vidéo** have music but no voice-over (Gemini Omni speaks reliably only in English; add a
  voice in CapCut, TikTok or Instagram). Recording runs in real time, so an 18-second video takes about 18 seconds, with
  the tab kept open.
- AI images and Gemini Omni clips were tested against simulated Google answers, and with a free key (which Google
  refuses, as expected); the model names were checked with Google's models API. Nothing was filmed or drawn for real:
  watch the first real use with a billed key. On Vercel, a long clip may exceed the 4.5 MB response limit of a function
  (not tested).
- The landing page prompt asks the AI for testimonials, guarantees and urgency lines. The page leaves those out or
  replaces them (see "Landing pages" above), but other AI text (paragraphs, benefits) can still invent details such as
  delivery times or stock; only the seller can tell, so the publisher asks them to check.
- The home page illustrations are drawings of the product, not screenshots. The old logo, hero and showcase pictures
  (`src/images/`) are no longer used and were removed; they remain in the git history.
- The hidden tools Produits Gagnants and Calendrier are static previews: they now say so on screen (their figures are
  examples). The catalog no longer fills itself with sample products.
- The home page is a client-rendered app: first paint depends on the JavaScript loading.
