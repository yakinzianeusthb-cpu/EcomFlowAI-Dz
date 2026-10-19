import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  /** The tool's sidebar icon, so the page and the menu look alike. */
  icon: LucideIcon;
  /** The tool's sidebar name. */
  title: string;
  subtitle?: string;
  /** Buttons or fields shown at the end of the header. */
  actions?: ReactNode;
  className?: string;
}

/** The title block every tool page starts with: same size, same place, same icon as in the sidebar. */
export default function PageHeader({ icon: Icon, title, subtitle, actions, className }: Props) {
  return (
    <header className={cn('flex flex-wrap items-center justify-between gap-4', className)}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary-ink">
          <Icon size={20} />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-fg-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
