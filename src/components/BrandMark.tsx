import { cn } from '../lib/utils';

type Tone = 'brand' | 'mono';

/** The EcomFlow mark: three lines of copy forming an E, on the brand violet ("mono": warm white, for the home page). */
export function BrandMark({ className, tone = 'brand' }: { className?: string; tone?: Tone }) {
  const mono = tone === 'mono';
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('size-8 shrink-0', className)}>
      <rect width="32" height="32" rx="9" fill={mono ? '#f4f2ee' : 'var(--primary)'} />
      <path d="M10.5 10h11M10.5 16h7.5M10.5 22h11" stroke={mono ? '#0b0b0c' : '#fff'} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Mark and name together, as in the sidebar and the site header. */
export function BrandLogo({ className, tone = 'brand' }: { className?: string; tone?: Tone }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <BrandMark tone={tone} />
      <span className="text-[15px] font-semibold tracking-tight text-fg" dir="ltr">
        EcomFlow <span className={tone === 'mono' ? 'text-fg-muted' : 'text-primary-ink'}>AI</span>
      </span>
    </span>
  );
}
