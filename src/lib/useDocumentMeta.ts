import { useEffect } from 'react';

function upsertMeta(name: string, content: string): HTMLMetaElement {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
  return el;
}

/**
 * Sets the browser tab title (and optionally the search-engine description) for the current page.
 * `noindex` asks search engines to skip the page, which matters for the 404 page: a single-page app
 * answers every URL with status 200, so without it unknown URLs could be indexed.
 */
export function useDocumentMeta({ title, description, noindex = false }: { title: string; description?: string; noindex?: boolean }) {
  useEffect(() => {
    document.title = title;
    if (description) upsertMeta('description', description);
    if (!noindex) return;
    const robots = upsertMeta('robots', 'noindex');
    return () => robots.remove();
  }, [title, description, noindex]);
}
