/** What the dashboard shows of the content admins publish. Used by the dashboard widgets and the guides route. */

interface TitledItem {
  id: string;
  title: string;
}

/** The trial offer the server used to create, in French only, whenever the announcements table was empty. */
const LEGACY_TRIAL_TITLE = "offre spéciale : 7 jours d'essai gratuit !";

const normalizeTitle = (title: string) => title.replace(/^[^\p{L}\p{N}]+/u, '').trim().toLowerCase();

/**
 * The announcements to show: the built-in free-trial offer (already in the interface language) first, and only to
 * someone without a plan, then the admin's announcements without the old French copy of that same offer.
 */
export function visibleAnnouncements<T extends TitledItem>(items: T[], options: { hasPlan: boolean; freeTrial: T }): T[] {
  const published = items.filter((a) => normalizeTitle(a.title) !== LEGACY_TRIAL_TITLE);
  return options.hasPlan ? published : [options.freeTrial, ...published];
}

/** The video the old seed script inserted as a demo guide: a music video, not a tutorial. */
const PLACEHOLDER_VIDEO_ID = 'dQw4w9WgXcQ';

export function isPlaceholderGuide(guide: { youtubeUrl?: string | null }): boolean {
  return (guide.youtubeUrl ?? '').includes(PLACEHOLDER_VIDEO_ID);
}
