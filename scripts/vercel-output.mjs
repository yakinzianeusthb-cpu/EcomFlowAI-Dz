// Assembles the Vercel Filesystem Build Output (.vercel/output):
//   - static/            <- the built frontend (dist/), minus the Node bundle
//   - functions/api.func <- the whole Express backend bundled into ONE file
// This avoids the @vercel/node ESM import-resolution issue with relative
// TS imports outside api/ (see api/index.ts -> ../server).
import { execSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const out = join(root, ".vercel", "output");
const funcDir = join(out, "functions", "api.func");
const staticDir = join(out, "static");
const distDir = join(root, "dist");

if (!existsSync(distDir)) {
  throw new Error("dist/ not found — run `npm run build` (vite) before this script.");
}

// 1. Reset output
rmSync(out, { recursive: true, force: true });
mkdirSync(funcDir, { recursive: true });

// 2. Static frontend (exclude the Node server bundle + sourcemap)
mkdirSync(staticDir, { recursive: true });
for (const entry of readdirSync(distDir)) {
  if (entry === "server.cjs" || entry === "server.cjs.map") continue;
  cpSync(join(distDir, entry), join(staticDir, entry), { recursive: true });
}

// 3. Bundle the API server into a single self-contained CJS file
execSync(
  `npx esbuild api/index.ts --bundle --platform=node --format=cjs ` +
    // vite is only imported by the local dev server (server.ts, non-production). Bundling it added
    // ~4 MB and ~75 ms to every serverless cold start.
    `--external:pg-native --external:*.node --external:vite ` +
    // Production is fixed at build time, as in build/server.cjs: a host that leaves NODE_ENV unset can never select
    // the development fallbacks (the built-in session secret, cookies without `secure`).
    `--define:process.env.NODE_ENV=\\"production\\" ` +
    `--outfile=${join(funcDir, "index.cjs")}`,
  { cwd: root, stdio: "inherit" }
);

// 4. Function runtime config
writeFileSync(
  join(funcDir, ".vc-config.json"),
  JSON.stringify(
    { runtime: "nodejs22.x", handler: "index.cjs", launcherType: "Nodejs" },
    null,
    2
  )
);

// 5. Routes: API -> the function, everything else -> SPA fallback
writeFileSync(
  join(out, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [
        // Security headers on every response: Vercel serves the static files itself, without Express (which sets
        // the same headers on API answers). The content security policy is a <meta> tag in index.html.
        {
          src: "/(.*)",
          headers: {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Referrer-Policy": "no-referrer",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          continue: true,
        },
        // Build output in /assets has content-hashed file names, so it can be cached forever.
        { src: "/assets/(.*)", headers: { "cache-control": "public, max-age=31536000, immutable" }, continue: true },
        { src: "/(favicon\\.png|apple-touch-icon\\.png)", headers: { "cache-control": "public, max-age=86400" }, continue: true },
        // Serve static files first; only apply the routes below on a miss.
        { handle: "filesystem" },
        { src: "/api/(.*)", dest: "/api" },
        { src: "/(.*)", dest: "/index.html" },
      ],
    },
    null,
    2
  )
);

console.log(`Filesystem output ready at ${out}`);
