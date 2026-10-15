'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { classifyHref, classifyPath } from '@/lib/analytics';
import { track } from '@/lib/analytics-client';

/**
 * Mounted once in the root layout. Reports a page view on every route change
 * and, with one delegated listener, every click on a link or on anything
 * marked data-track="kind" (optionally data-track-id="..."):
 *
 *  - An <a href> is classified by where it goes — an artist or place page, a
 *    city section, another site — so every card, tile and map panel that links
 *    to a profile counts toward it with no per-component code.
 *  - data-track names a click that isn't (or isn't only) a link, e.g. an
 *    artwork tile. If it's also a link to an artist or place, that destination
 *    is recorded too (via: "artwork"), so the artist's total includes it.
 *
 * Clicks that navigate from code (map pins, network nodes) and filter
 * searches call track() directly; see lib/analytics-client.ts.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    if (previous.current === pathname) return;
    let source: string | null = previous.current;
    if (source === null && document.referrer) {
      try {
        const ref = new URL(document.referrer);
        source = ref.origin === window.location.origin ? ref.pathname : `ext:${ref.host.replace(/^www\./, '')}`;
      } catch {
        source = null;
      }
    }
    previous.current = pathname;
    const { kind, targetId } = classifyPath(pathname);
    track({ type: 'pageview', kind, targetId, source });
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const el = target.closest<HTMLElement>('[data-track], a[href]');
      if (!el) return;

      const anchor = el instanceof HTMLAnchorElement ? el : el.closest('a[href]');
      const dest = anchor ? classifyHref(anchor.getAttribute('href') ?? '', window.location.origin) : null;

      const marked = el.dataset.track;
      if (marked) {
        track({ type: 'click', kind: marked, targetId: el.dataset.trackId ?? null });
        if (dest && (dest.kind === 'artist' || dest.kind === 'place')) {
          track({ type: 'click', kind: dest.kind, targetId: dest.targetId, meta: { via: marked } });
        }
        return;
      }
      if (dest) track({ type: 'click', kind: dest.kind, targetId: dest.targetId });
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
