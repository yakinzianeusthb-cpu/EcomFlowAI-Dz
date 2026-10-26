import type { CSSProperties } from 'react';
import { SECTION_ART, sectionPicture, type SectionId } from '../../lib/sections';
import { cn } from '../../lib/utils';

/** A section's picture. Decorative: the section's name is always written next to it. */
export function SectionPicture({ id, size = 22, className }: { id: SectionId; size?: number; className?: string }) {
  const src = sectionPicture(id);
  if (!src) return null;
  return <img src={src} alt="" aria-hidden="true" width={size} height={size} decoding="async" draggable={false} className={cn('section-pic', className)} />;
}

const TILE_SIZES = {
  md: { box: 'size-12', picture: 34 },
  lg: { box: 'size-14', picture: 40 },
  xl: { box: 'size-16', picture: 46 },
} as const;

/** The picture on a soft halo of its section's colour: page headers, dashboard cards, the locked-tool screen. */
export function SectionTile({ id, size = 'md', className }: { id: SectionId; size?: keyof typeof TILE_SIZES; className?: string }) {
  const { box, picture } = TILE_SIZES[size];
  return (
    <span className={cn('section-tile', box, className)} style={{ '--glow': SECTION_ART[id].glow } as CSSProperties}>
      <SectionPicture id={id} size={picture} />
    </span>
  );
}
