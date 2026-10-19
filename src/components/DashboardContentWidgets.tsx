import { useEffect, useState } from 'react';
import { ExternalLink, Flame, Megaphone, MessageCircle, Play, PlaySquare } from 'lucide-react';
import { contentApi, type Announcement, type Guide, type HotDeal } from '../services/admin';
import { configApi } from '../services/api';
import { cn, stripLeadingEmoji } from '../lib/utils';
import { hasActivePlan } from '../lib/access';
import { visibleAnnouncements } from '../lib/dashboardContent';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const KIND_ACCENT: Record<string, string> = {
  info: 'bg-primary',
  warning: 'bg-warning',
  success: 'bg-success',
  promo: 'bg-accent',
};

function WidgetHeader({ icon: Icon, title, count }: { icon: typeof Megaphone; title: string; count?: number }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary-ink">
        <Icon size={16} />
      </span>
      <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
      {count != null && count > 1 && <span className="text-xs text-fg-faint tabular-nums">{count}</span>}
    </div>
  );
}

/** Built-in announcement: shown first to people without a plan, then whatever the admin published. */
const FREE_TRIAL_ID = 'default-free-7-days';

export function AnnouncementsWidget() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    let cancelled = false;
    contentApi.announcements().then((d) => !cancelled && setItems(d)).catch(() => {});
    configApi.get().then((cfg) => !cancelled && cfg?.whatsappNumber && setWhatsappNumber(cfg.whatsappNumber)).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const freeTrial: Announcement = {
    id: FREE_TRIAL_ID,
    title: t('freeTrialAnnouncementTitle', "Offre spéciale : 7 jours d'essai gratuit !"),
    message: t(
      'freeTrialAnnouncementMessage',
      "Profitez de 7 jours d'accès gratuit et illimité à tous nos outils IA e-commerce. Pour en profiter, contactez-nous sur WhatsApp !",
    ),
    emoji: '',
    kind: 'promo',
    active: true,
    startsAt: null,
    expiresAt: null,
    createdAt: '',
    updatedAt: '',
  };
  const displayItems = visibleAnnouncements(items, { hasPlan: hasActivePlan(user), freeTrial });
  if (displayItems.length === 0) return null;

  const openContact = () => window.dispatchEvent(new CustomEvent('nav-change', { detail: 'contact' }));
  const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(t('shlTrialWhatsapp', "Bonjour, je souhaite réclamer mon offre de 7 jours d'essai gratuit."))}`;

  return (
    <section className="ui-card p-5">
      <WidgetHeader icon={Megaphone} title={t('dashWidgetAnnouncements', 'Annonces')} />
      <ul className="space-y-3">
        {displayItems.map((a) => {
          const withWhatsApp = a.id === FREE_TRIAL_ID || a.message.toLowerCase().includes('whatsapp');
          return (
            <li key={a.id} className="rounded-xl border border-line bg-surface-2 p-4">
              <div className="flex items-start gap-2.5">
                <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', KIND_ACCENT[a.kind] ?? KIND_ACCENT.info)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-fg">{stripLeadingEmoji(a.title)}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{a.message}</p>
                  {withWhatsApp &&
                    (whatsappNumber ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-[13px] font-semibold text-[#06310f] transition-opacity hover:opacity-90"
                      >
                        <MessageCircle size={15} />
                        {t('contactUsOnWhatsApp', 'Contactez-nous sur WhatsApp')}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={openContact}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-fg transition-colors hover:bg-surface-3"
                      >
                        <MessageCircle size={15} />
                        {t('contactUsOnWhatsApp', 'Contactez-nous sur WhatsApp')}
                      </button>
                    ))}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function HotDealsWidget() {
  const { t } = useLanguage();
  const [items, setItems] = useState<HotDeal[]>([]);

  useEffect(() => {
    let cancelled = false;
    contentApi.hotDeals().then((d) => !cancelled && setItems(d)).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="ui-card p-5">
      <WidgetHeader icon={Flame} title={t('dashWidgetHotDeals', 'Offres chaudes')} />
      <ul className="space-y-2.5">
        {items.map((d) => {
          const Row = d.link ? 'a' : 'div';
          return (
            <li key={d.id}>
              <Row
                {...(d.link ? { href: d.link, target: '_blank', rel: 'noopener noreferrer' } : {})}
                className={cn('flex items-start gap-3 rounded-xl border border-line bg-surface-2 p-3.5', d.link && 'transition-colors hover:border-line-strong hover:bg-surface-3')}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface text-xl">{d.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-fg">{d.title}</span>
                    {d.badge && <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-xs font-semibold text-accent-ink">{d.badge}</span>}
                  </span>
                  {d.description && <span className="mt-0.5 block text-[13px] leading-relaxed text-fg-muted">{d.description}</span>}
                  {d.price && <span className="mt-1 block text-sm font-semibold tabular-nums text-accent-ink">{d.price}</span>}
                </span>
                {d.link && <ExternalLink size={14} className="mt-1 shrink-0 text-fg-faint" />}
              </Row>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const YOUTUBE_ID = /(?:youtu\.be\/|\/v\/|\/u\/\w\/|\/embed\/|watch\?v=|&v=)([\w-]{11})/;
export const parseYouTubeId = (url: string): string | null => url?.match(YOUTUBE_ID)?.[1] ?? null;

/**
 * Thumbnail first, player on demand. Embedding three YouTube iframes up front costs several MB
 * and a lot of CPU on the dashboard; this loads the real player only when somebody presses play.
 */
function VideoCard({ guide, wide = false }: { guide: Guide; wide?: boolean }) {
  const { t } = useLanguage();
  const id = parseYouTubeId(guide.youtubeUrl);
  const [playing, setPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  return (
    // a lone guide sits beside its text instead of leaving half the row empty
    <article className={cn('ui-card flex flex-col overflow-hidden', wide && 'sm:flex-row')}>
      <div className={cn('relative aspect-video overflow-hidden border-b border-line bg-surface-3', wide && 'sm:w-[45%] sm:shrink-0 sm:border-b-0 sm:border-e')}>
        {id && playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={guide.title}
            className="absolute inset-0 size-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : id ? (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`${t('watchOnYouTube', 'Regarder la vidéo')} : ${guide.title}`}
            className="group absolute inset-0 size-full"
          >
            {!thumbFailed && (
              <img
                src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
                alt=""
                loading="lazy"
                decoding="async"
                onError={() => setThumbFailed(true)}
                className="size-full object-cover"
              />
            )}
            <span className="absolute inset-0 grid place-items-center bg-black/25 transition-colors group-hover:bg-black/35">
              <span className="grid size-12 place-items-center rounded-full bg-white/95 text-[#17161a] shadow-lg transition-transform group-hover:scale-105">
                <Play size={20} className="ms-0.5" fill="currentColor" />
              </span>
            </span>
          </button>
        ) : (
          <a
            href={guide.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 grid place-items-center text-fg-muted hover:text-fg"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <PlaySquare size={22} /> {t('watchOnYouTube', 'Regarder la vidéo')}
            </span>
          </a>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold leading-snug text-fg">{guide.title}</h3>
        {guide.description && <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-fg-muted">{guide.description}</p>}
        {guide.youtubeUrl && (
          <a
            href={guide.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center gap-1.5 pt-3 text-[13px] font-medium text-primary-ink hover:underline"
          >
            <ExternalLink size={13} />
            {t('openYouTubeLink', 'Ouvrir dans YouTube')}
          </a>
        )}
      </div>
    </article>
  );
}

export function GuidesWidget({ className }: { className?: string }) {
  const { t } = useLanguage();
  const [items, setItems] = useState<Guide[]>([]);

  useEffect(() => {
    let cancelled = false;
    contentApi.guides().then((d) => !cancelled && setItems(d)).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (items.length === 0) return null;

  return (
    <section className={className}>
      <WidgetHeader icon={PlaySquare} title={t('dashGuidesTitle', 'Guides & tutoriels vidéo')} count={items.length} />
      {items.length === 1 ? (
        <VideoCard guide={items[0]} wide />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {items.map((g) => (
            <VideoCard key={g.id} guide={g} />
          ))}
        </div>
      )}
    </section>
  );
}
