import { createHash } from 'node:crypto';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { LANDING_PAGE_SCRIPT } from './src/lib/landingHtml';

/**
 * The first screen needs one lazily loaded chunk (the app shell for members, the landing page for
 * visitors, a login page...). Without help the browser only asks for it after the main bundle has
 * downloaded AND run. This injects a tiny inline script that preloads the right chunk straight
 * from the HTML, in parallel with the main bundle. Mirrors the logic in src/main.tsx.
 */
function earlyChunkPreload(): Plugin {
  const EARLY = ['AppShell', 'DashboardHome', 'LandingPage', 'LoginPage', 'RegisterPage', 'VerifyPage', 'ForgotPasswordPage', 'AdminDashboard', 'LegalPage'];
  return {
    name: 'early-chunk-preload',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const chunks: Record<string, string> = {};
        for (const item of Object.values(ctx.bundle ?? {})) {
          if (item.type === 'chunk' && EARLY.includes(item.name)) chunks[item.name] = `/${item.fileName}`;
        }
        if (Object.keys(chunks).length === 0) return undefined;
        const script =
          `(function(){try{var m=${JSON.stringify(chunks)},p=location.pathname,` +
          `r=localStorage.getItem('dz_returning')==='1',n;` +
          `if(/^\\/admin/.test(p))n=['AdminDashboard'];` +
          `else if(/^\\/login/.test(p))n=['LoginPage'];` +
          `else if(/^\\/register/.test(p))n=['RegisterPage'];` +
          `else if(/^\\/verify/.test(p))n=['VerifyPage'];` +
          `else if(/^\\/forgot-password/.test(p))n=['ForgotPasswordPage'];` +
          `else if(/^\\/(terms|privacy)/.test(p))n=['LegalPage'];` +
          `else n=r?['AppShell','DashboardHome']:['LandingPage'];` +
          `n.forEach(function(k){if(!m[k])return;var l=document.createElement('link');` +
          `l.rel='modulepreload';l.href=m[k];document.head.appendChild(l)})}catch(e){}})();`;
        // 'head' (not 'head-prepend'): a prepended script would land before <meta charset>.
        return [{ tag: 'script', children: script, injectTo: 'head' }];
      },
    },
  };
}

/**
 * Link previews (WhatsApp, Facebook, X...) only accept ABSOLUTE image URLs, so the share-image tags are added
 * when the site's address is known. Set SITE_URL (for example https://ecomflow.example) when building for production.
 */
function shareImageTags(): Plugin {
  const site = (process.env.SITE_URL ?? '').replace(/\/+$/, '');
  return {
    name: 'share-image-tags',
    transformIndexHtml() {
      if (!/^https?:\/\//.test(site)) return undefined;
      const image = `${site}/og-image.jpg`;
      return [
        { tag: 'meta', attrs: { property: 'og:image', content: image }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' }, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'twitter:image', content: image }, injectTo: 'head' },
      ];
    },
  };
}

/**
 * Content security policy, as a <meta> tag written into the built index.html, so it applies on every host (Vercel
 * serves this file directly, a Node host through Express). Scripts may only come from this site, or be one of the
 * inline scripts below, allowed by their hash: the ones in index.html and the order-form script of generated
 * landing pages, which runs in the live preview (an iframe srcdoc inherits this policy). Built pages only: the
 * dev server needs Vite's own scripts.
 */
function contentSecurityPolicy(): Plugin {
  // browsers hash the script as parsed, after turning CRLF into LF (index.html has CRLF in a Windows checkout)
  const sha256 = (code: string) => `'sha256-${createHash('sha256').update(code.replace(/\r\n?/g, '\n'), 'utf8').digest('base64')}'`;
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const inline = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).filter((code) => code.trim());
        const scripts = [...new Set([...inline, LANDING_PAGE_SCRIPT].map(sha256))];
        const policy = [
          "default-src 'self'",
          `script-src 'self' ${scripts.join(' ')}`,
          // inline style attributes are everywhere (React, Tailwind's arbitrary values); generated pages use Google Fonts
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' data: https://fonts.gstatic.com",
          // product photos, AI images and video frames are data:/blob: URLs; guide thumbnails, avatars and admin images are https
          "img-src 'self' data: blob: https:",
          "media-src 'self' data: blob:",
          // the preview of a landing page posts test orders to the seller's own https webhook; data:/blob: are read
          // locally (turning a generated image into a file), they cannot send anything anywhere
          "connect-src 'self' https: data: blob:",
          "frame-src 'self' blob: https://www.youtube-nocookie.com https://www.youtube.com",
          "worker-src 'self' blob:",
          "manifest-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self' https:",
        ].join('; ');
        const tag = `<meta http-equiv="Content-Security-Policy" content="${policy}" />`;
        // right after <meta charset>: a policy only governs what comes after it, so it must precede the inline scripts
        const charset = /<meta charset="[^"]*"\s*\/?>/i;
        if (!charset.test(html)) throw new Error('index.html has no <meta charset>; the content security policy cannot be placed');
        return html.replace(charset, (m) => `${m}\n    ${tag}`);
      },
    },
  };
}

export default defineConfig({
  // the policy comes last, so it sees (and hashes) the scripts the other plugins add
  plugins: [react(), tailwindcss(), earlyChunkPreload(), shareImageTags(), contentSecurityPolicy()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        // Stable vendor chunks: app code changes do not invalidate the cached framework code.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) return 'react-vendor';
          if (/[\\/]node_modules[\\/](framer-motion|motion|motion-dom|motion-utils)[\\/]/.test(id)) return 'motion';
          // One icon chunk instead of ~50 one-kilobyte files: each file would cost a request on a slow link.
          if (/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id)) return 'icons';
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    hmr: process.env.DISABLE_HMR === 'true'
      ? false
      : { port: 5173 },
    // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
    // Proxy /api/* requests to the Express server during development.
    // ws: false ensures Vite's own HMR WebSocket is NOT intercepted.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: false,
      },
    },
  },
});
