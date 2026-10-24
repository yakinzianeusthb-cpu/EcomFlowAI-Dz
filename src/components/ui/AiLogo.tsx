import type { CSSProperties } from 'react';
import { cn } from '../../lib/utils';
import geminiLogo from '../../assets/ai-logos/gemini-color.svg';
import openaiLogo from '../../assets/ai-logos/openai.svg';
import claudeLogo from '../../assets/ai-logos/claude-color.svg';
import mistralLogo from '../../assets/ai-logos/mistral-color.svg';
import deepseekLogo from '../../assets/ai-logos/deepseek-color.svg';
import grokLogo from '../../assets/ai-logos/grok.svg';
import openrouterLogo from '../../assets/ai-logos/openrouter.svg';
import falLogo from '../../assets/ai-logos/fal-color.svg';
import fluxLogo from '../../assets/ai-logos/flux.svg';
import cloudflareLogo from '../../assets/ai-logos/cloudflare-color.svg';

export type AiBrand = 'gemini' | 'openai' | 'anthropic' | 'mistral' | 'deepseek' | 'xai' | 'openrouter' | 'fal' | 'flux' | 'cloudflare';

/** Colour logos are shown as they are; one-colour logos take the text colour, so they read in both themes. */
const LOGOS: Record<AiBrand, { src: string; mono: boolean }> = {
  gemini: { src: geminiLogo, mono: false },
  openai: { src: openaiLogo, mono: true },
  anthropic: { src: claudeLogo, mono: false },
  mistral: { src: mistralLogo, mono: false },
  deepseek: { src: deepseekLogo, mono: false },
  xai: { src: grokLogo, mono: true },
  openrouter: { src: openrouterLogo, mono: true },
  fal: { src: falLogo, mono: false },
  flux: { src: fluxLogo, mono: true },
  cloudflare: { src: cloudflareLogo, mono: false },
};

/** An AI service's logo on a small tile (the logo files and their licence: src/assets/ai-logos). */
export function AiLogo({ brand, size = 40, className }: { brand: AiBrand; size?: number; className?: string }) {
  const { src, mono } = LOGOS[brand];
  const logo = Math.round(size * 0.55);
  // quoted: small SVGs are inlined as data URLs, whose quotes and spaces would end an unquoted url()
  const url = `url("${src.replace(/"/g, '%22')}")`;
  const mask: CSSProperties = { width: logo, height: logo, WebkitMaskImage: url, maskImage: url, WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center' };
  return (
    <span aria-hidden="true" className={cn('grid shrink-0 place-items-center rounded-[var(--radius-sm)] bg-surface-2 ring-1 ring-line', className)} style={{ width: size, height: size }}>
      {mono ? <span className="bg-fg" style={mask} /> : <img src={src} alt="" width={logo} height={logo} draggable={false} />}
    </span>
  );
}
