# EcomFlow AI

An AI campaign workspace for cash-on-delivery (COD) online sellers in Algeria. A seller creates a **campaign** from a
product brief and photos; from that one brief the AI writes the landing page, the video-ad script and a pack of ad
concepts, all in the seller's brand (logo, colours, tone). Every output is saved as a version, can be edited and
regenerated, and is exported (HTML page, video file, ad visuals, CSV of the ad copy) or, when the site has a Meta app,
created as a paused Facebook/Instagram campaign. Around it: three studios (landing pages, video ads, ads), a brand kit,
a file library, a landing-page builder and a COD margin calculator. The interface is available in Arabic (default,
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
server.ts, api/            Express app, and the Vercel entry that reuses it
src/routes/                API routes (auth, admin, settings, projects, assets, brand, meta, history...)
src/lib/                   Server and shared logic: sessions, plan rules, OTP, crypto, e-mail, rate limiting,
                           campaign/asset/brand validation (projectRules, assetRules, brandRules), Meta (meta.ts),
                           ad packs and ad visuals (adPack, adCreative, adCreativeRender, adExport)
src/components/projects/   The campaign workspace: list, new campaign, brief, landing / video / ads / publish tabs
src/components/ads/, brand/, assets/, meta/   Ads studio, brand kit, file library, Meta connection
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
accent; the app keeps its own violet. Its first screen is a real-time 3D scene: a polished ring turning around a
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

## Campaigns, brand kit and files

- **Data:** `Project` (the brief), `Asset` (an image, its bytes stored in Postgres), `ProjectOutput` (one row per saved
  version of a landing page, video script, ad pack or Meta campaign; the last 20 versions of each kind are kept),
  `BrandKit` (one per account) and `MetaConnection` (one per account, token encrypted).
- **Ownership:** every query is filtered by the signed-in account; ids sent by the browser are only used inside that
  filter, so one account can never read, change or delete another's campaigns, files or Meta campaigns.
- **Files:** JPG, PNG and WebP only, checked from the bytes rather than the name; 3 MB per image, 80 per campaign and
  250 MB per account (25 MB without an active plan). Files are served with `nosniff` and a sandboxing content-security policy.
- **Storage limits:** saved outputs count against 100 MB per account (10 MB without a plan). The older tools keep at
  most 100 landing-page and 100 chat sessions per account (1 MB and 2 MB each) and the newest 50 history entries. Each
  quota check runs under a per-account database lock, so requests sent at the same time cannot overshoot it.
- **Deleting a campaign** first pauses its Meta ads. If the app cannot reach Meta, it refuses and says so, and the
  seller can still choose "delete anyway" (the ad then keeps running until paused in Ads Manager).
- **Videos** made in the browser are downloaded, not stored on the server.
- The ad visuals (square 1080×1080, portrait 1080×1350, story 1080×1920 with a protected safe zone) are drawn in the
  browser from the campaign photos, the brand colours and the concept text, so they cost no AI quota.

## Meta publishing

Optional. Without `META_APP_ID`, `META_APP_SECRET` and `META_REDIRECT_URI` (or `SITE_URL`), the publish tab says that
direct publishing is not set up and explains how to publish by hand; the home page does not mention it.

How it works:

1. **Connect:** the seller is sent to Meta's own login with a signed, ten-minute `state` tied to their account and to a
   nonce cookie. The callback exchanges the code on the server for a long-lived token (about 60 days), stores it
   encrypted, and never sends it to the browser. Every Graph call carries an `appsecret_proof`.
2. **Create:** the seller picks one of the ad accounts and Pages Meta returns, an objective (traffic, sales with a pixel,
   or awareness), a daily budget in the account's currency, dates, countries and ages. The image, campaign, ad set,
   creative and ad are all created **PAUSED** (budget sent in minor units, no special ad category, Advantage+ audience
   set explicitly).
3. **Activate:** only after the seller has seen the final settings and ticked a confirmation; the server also refuses
   activation without `confirm: true`. The status shown is the ad's own status from Meta (in review, active, rejected,
   paused), and the results shown are Meta's insights.
4. **Disconnect** revokes the app's permissions at Meta and deletes the token.

To go live with real sellers, Meta requires, on the app: Business Verification, App Review of the requested
permissions (`ads_management`, `ads_read`, `business_management`, `pages_show_list`, `pages_read_engagement`,
`pages_manage_ads`) with **Advanced Access**, and the redirect URI `{SITE_URL}/api/meta/callback` in the Facebook Login
settings. Until then only people with a role on the app can connect. The integration was tested end to end against a
local stand-in for the Graph API (`META_GRAPH_BASE_URL` / `META_DIALOG_BASE_URL`, ignored in production), never against
Meta itself: watch the first real connection and campaign.

## Plans and access

Users start free. They pick a plan, pay outside the app and upload a proof; an administrator approves it in `/admin`,
which sets the plan status and its expiry date (no expiry date means a lifetime plan).

- The rule lives in one file, `src/lib/access.ts`, used by the browser (to lock the tools) and by the server
  (`/api/ai/generate` and `/api/ai/video` answer 403 `PLAN_REQUIRED` without a live plan; administrators are exempt).
- Sessions are signed cookies that expire after 30 days. Changing `SESSION_SECRET` signs everyone out.
- Gemini keys and ad-platform tokens are encrypted at rest (`TOKEN_ENCRYPTION_KEY`, falling back to `SESSION_SECRET`).
- **Browser security:** the built `index.html` carries a content security policy (scripts only from this site, or one
  of the inline scripts allowed by hash, including the order-form script of generated landing pages, which runs in the
  live preview). Security headers (`nosniff`, `X-Frame-Options`, HSTS, `Permissions-Policy`) are set by Express and,
  on Vercel, by the routes in `scripts/vercel-output.mjs`. If you add an inline script to `index.html`, the build
  hashes it automatically (`vite.config.ts`).
- **Requests:** bodies are limited to 1 MB, or 10 MB for signed-in requests to the routes that take images. The
  client address used by the rate limits trusts exactly `TRUST_PROXY` proxies (default 1).

## AI and Gemini keys

Every AI call runs on the server with the user's own Gemini key (`/api/ai/generate`, `/api/ai/video`).

- **Free key** (Google AI Studio without billing): text only, about 20 requests a day per model. When one model's daily
  quota is used up, or Google says it is overloaded, the server retries on the next model of `TEXT_MODEL_FALLBACKS`
  (`src/lib/aiFallback.ts`). When none can answer, the user gets a plain message saying why.
- **Key with billing:** also AI images (the landing page section images) and AI video clips (Google Veo). A free key gets
  "billing needed" (HTTP 402) for both.
- A wrong, expired or blocked key gets its own message (HTTP 400).

What the two main tools produce:

- **Video ads:** the AI writes the script, then **Créer la vidéo** turns it into a real video file in the browser (MP4,
  or WebM where the browser cannot record MP4): the product photos in motion, on-screen text, subtitles and a closing
  price card. This step uses no AI quota. With a billed key, **AI clips** films each scene with Veo (one to a few minutes
  per clip, billed by Google per second of video) and the video uses those clips instead of the photos.
- **Landing pages:** the AI writes the sections, then **Page prête** turns them into one self-contained HTML file: photos,
  colours, price and a cash-on-delivery order form (58 wilayas, Algerian mobile number check). An order opens the seller's
  WhatsApp with every detail filled in, and can also be posted to an https address (a Google Apps Script that writes to a
  sheet, for example). The seller uploads the file to any host.

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

`npm test` runs the unit tests (456 in 45 files): plan rules, sessions, OTP, encryption, passwords, rate limiting, e-mail
delivery, settings validation, pricing, translations, AI error handling, the video timeline, the landing page HTML,
campaign / file / brand-kit validation, ad packs, ad layouts and CSV export, the Meta payloads, budgets and login state,
the dashboard's "to do" list and more. Coverage of `src/lib`, `src/i18n` and `server-telegram.ts` is above 80 %. React
components, the Express routes and `server.ts` are **not** covered by unit tests; they were checked in a real browser
against a real database during development (campaign workflow, data ownership between two accounts, the Meta flow
against a stand-in Graph API, accessibility with axe on 80 screen variants), and that browser harness is not part of
this repository.

## Deployment

`npm run deploy:vercel` builds, assembles the Vercel output (`scripts/vercel-output.mjs`) and deploys. Set the variables
from `.env.example` in the host. In production `SESSION_SECRET` is required: both server bundles (`build/server.cjs` and
the Vercel function) are built with `NODE_ENV=production`, so they refuse to start without it instead of using the
development secret. `SITE_URL` should be the public address of the site so link previews (WhatsApp, Facebook) get an
absolute image URL.

**Database update for this version:** run `npx prisma db push` once against the production database. It only adds
tables (`projects`, `assets`, `project_outputs`, `brand_kits`, `meta_connections`) and leaves existing ones alone; read
the plan Prisma prints before confirming, and stop if it mentions dropping or resetting anything. Campaign images are
stored in Postgres (up to 250 MB per account), so keep an eye on the database size on small plans.

## Known gaps

- The tools Consultant Expert IA, Catalogue, Scout Telegram, Studio Photos, Annonces Darja, Produits Gagnants and
  Calendrier exist in the code but are not linked from the sidebar. Their interface text is still French only.
- Videos made with **Créer la vidéo** have no sound (add music or a voice-over in CapCut, TikTok or Instagram). Recording
  runs in real time, so an 18-second video takes about 18 seconds, with the tab kept open.
- AI images and Veo clips were tested only against simulated Google answers, because the development key was a free
  one. Watch the first real use with a billed key. On Vercel, a long Veo clip may exceed the 4.5 MB response limit of a
  function (not tested).
- Meta publishing has not been run against the real Graph API (no Meta app or credentials during development), and it
  needs Meta's App Review before sellers outside the app's own team can connect (see "Meta publishing").
- The home page illustrations are drawings of the product, not screenshots. The old logo, hero and showcase pictures
  (`src/images/`) are no longer used and were removed; they remain in the git history.
- The hidden tools Produits Gagnants and Calendrier are static previews: they now say so on screen (their figures are
  examples). Studio Photos no longer shows a random stock photo when its AI image fails, and the catalog no longer
  fills itself with sample products.
- The home page is a client-rendered app: first paint depends on the JavaScript loading.
