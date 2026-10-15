'use client';

import { useEffect, useRef } from 'react';
import { track } from './analytics-client';

const SETTLE_MS = 1200;

/**
 * Report a filter "search" once the visitor has stopped changing the pills —
 * not on every toggle, so flicking through options while browsing doesn't
 * inflate the counts. One event per settled selection carries every active
 * filter and how many results it produced (0 = a search we couldn't answer).
 * Nothing is sent while no filter is active, or if the selection is the same
 * as the last one reported.
 */
export function useTrackSearch(filters: Record<string, string[]>, resultCount: number) {
  const active = Object.fromEntries(Object.entries(filters).filter(([, v]) => v.length > 0));
  const key = JSON.stringify([active, resultCount]);
  const last = useRef<string | null>(null);

  useEffect(() => {
    const [filtersNow, results] = JSON.parse(key) as [Record<string, string[]>, number];
    if (Object.keys(filtersNow).length === 0) {
      last.current = null;
      return;
    }
    const timer = window.setTimeout(() => {
      if (last.current === key) return;
      last.current = key;
      track({ type: 'search', kind: 'filter', meta: { filters: filtersNow, results } });
    }, SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [key]);
}
