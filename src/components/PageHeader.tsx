import type { ReactNode } from 'react';
import type { SectionId } from '../lib/sections';
import { cn } from '../lib/utils';
import { SectionTile } from './ui/SectionPicture';

interface Props {
  /** The section the page belongs to: its picture is the one in the sidebar, so the page and the menu look alike. */
  section: SectionId;
  /** The tool's sidebar name. */
  title: string;
  subtitle?: string;
  /** Buttons or fields shown at the end of the header. */
  actions?: ReactNode;
  className?: string;
}

/** The title block every tool page starts with: same size, same place, same picture as in the sidebar. */
export default function PageHeader({ section, title, subtitle, actions, className }: Props) {
  return (
    <header className={cn('flex flex-wrap items-center justify-between gap-4', className)}>
      <div className="flex min-w-0 items-center gap-3">
        <SectionTile id={section} />
        <div className="min-w-0">
          <h1 className="home-display text-[28px] text-fg sm:text-[32px]">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-fg-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
