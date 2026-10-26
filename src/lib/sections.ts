/**
 * The picture of each part of the app, so a section is found at a glance: in the menu, on the dashboard, in each
 * page's header. 3D emoji from Microsoft's Fluent Emoji set (MIT licence, src/assets/sections/LICENSE.txt), as image
 * files so they look the same on every phone and computer, unlike emoji characters drawn by each system's own font.
 */
import type { NavItem } from './nav';

/** Every part of the app that has a picture: its pages and the admin area. */
export type SectionId = NavItem | 'admin';

// emitted as files, never inlined in the script: they load in parallel and are cached for good like the other build files
const FILES = import.meta.glob<string>('../assets/sections/*.webp', { eager: true, query: '?no-inline', import: 'default' });

interface SectionArt {
  /** file name in src/assets/sections */
  file: string;
  /** the colour of the soft halo behind the picture */
  glow: string;
}

export const SECTION_ART: Record<SectionId, SectionArt> = {
  dashboard: { file: 'house', glow: '#f43f5e' },
  landing: { file: 'shopping-bags', glow: '#38bdf8' },
  video: { file: 'clapper-board', glow: '#a78bfa' },
  voice: { file: 'studio-microphone', glow: '#f472b6' },
  assets: { file: 'framed-picture', glow: '#22c55e' },
  assembler: { file: 'puzzle-piece', glow: '#10b981' },
  calculator: { file: 'money-bag', glow: '#eab308' },
  settings: { file: 'gear', glow: '#94a3b8' },
  contact: { file: 'speech-balloon', glow: '#a5b4fc' },
  admin: { file: 'shield', glow: '#60a5fa' },
  trends: { file: 'fire', glow: '#f97316' },
  darja: { file: 'memo', glow: '#60a5fa' },
  analyzer: { file: 'brain', glow: '#f472b6' },
  catalog: { file: 'books', glow: '#22c55e' },
  scout: { file: 'telescope', glow: '#818cf8' },
  calendar: { file: 'spiral-calendar', glow: '#60a5fa' },
};

/** The address of a section's picture ('' if its file were missing: the page then simply shows no picture). */
export function sectionPicture(id: SectionId): string {
  return FILES[`../assets/sections/${SECTION_ART[id].file}.webp`] ?? '';
}
