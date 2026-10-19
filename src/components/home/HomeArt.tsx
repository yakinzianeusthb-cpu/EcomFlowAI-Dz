import { useId, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

/** A drawn bedside lamp: the example product of the home page illustrations (a drawing, not a photo or an AI output). */
export function LampArt({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 200 250" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}g`} cx="50%" cy="42%" r="55%">
          <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbf3e2" />
          <stop offset="1" stopColor="#e3c995" />
        </linearGradient>
        <linearGradient id={`${id}m`} x1="0" x2="1">
          <stop offset="0" stopColor="#34313a" />
          <stop offset="0.5" stopColor="#5d5966" />
          <stop offset="1" stopColor="#2a282f" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="104" r="96" fill={`url(#${id}g)`} />
      <path d="M64 52h72l22 76H42z" fill={`url(#${id}s)`} />
      <path d="M42 128h116" stroke="#d2b47a" strokeWidth="2" />
      <rect x="96" y="128" width="8" height="78" rx="3" fill={`url(#${id}m)`} />
      <ellipse cx="100" cy="214" rx="46" ry="11" fill={`url(#${id}m)`} />
      <ellipse cx="100" cy="210" rx="46" ry="9" fill="#47434d" />
    </svg>
  );
}

const BACKDROPS = {
  night: 'bg-[radial-gradient(120%_90%_at_50%_10%,#2e2d33_0%,#141416_72%)]', // taste-skill-ignore: the studio light of a drawn product shot
  linen: 'bg-[radial-gradient(120%_90%_at_50%_10%,#fbf6ec_0%,#e6d9c0_75%)]', // taste-skill-ignore: the studio light of a drawn product shot
  // the deep red of the home page's light
  ember: 'bg-[radial-gradient(120%_90%_at_50%_10%,#a3182e_0%,#2a0a10_75%)]', // taste-skill-ignore: the studio light of a drawn product shot
} as const;

/** The lamp on a studio backdrop, standing in for a product photo. */
export function ProductPhoto({ className, artClassName, backdrop = 'night' }: { className?: string; artClassName?: string; backdrop?: keyof typeof BACKDROPS }) {
  return (
    <div className={cn('overflow-hidden', BACKDROPS[backdrop], className)}>
      <LampArt className={cn('size-full p-[12%]', artClassName)} />
    </div>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-[var(--radius-xs)] border border-line bg-surface px-2 py-0.5 text-[11px] font-medium text-fg-muted', className)}>
      {children}
    </span>
  );
}

/** Grey bars standing for body text in the illustrations. */
export function TextLines({ widths = ['w-11/12', 'w-2/3'] }: { widths?: string[] }) {
  return (
    <span className="mt-2 block space-y-1">
      {widths.map((w) => <span key={w} className={cn('block h-1.5 rounded-full bg-fg/10', w)} />)}
    </span>
  );
}
