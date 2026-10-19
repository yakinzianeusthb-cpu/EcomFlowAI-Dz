import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LEADING_EMOJI = /^[\p{Extended_Pictographic}️‍\s]+/u;

/** Removes decorative emoji from the start of a title (admin-entered content often carries them). */
export function stripLeadingEmoji(text: string): string {
  return text.replace(LEADING_EMOJI, '');
}
