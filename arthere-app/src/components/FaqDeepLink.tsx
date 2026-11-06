'use client';

import { useEffect } from 'react';

// Opens the accordion item named in the URL hash (/faq#does-it-cost-anything)
// and centres it in the viewport, on load and when the hash changes. Centring
// waits a frame (and again after Next's own hash scroll) so it measures the
// item at its opened height.
export function FaqDeepLink() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const el = document.getElementById(id);
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        const center = () => el.scrollIntoView({ block: 'center' });
        requestAnimationFrame(center);
        // Next scrolls to the hash itself right after a client-side navigation;
        // centre again once that has settled.
        setTimeout(center, 150);
      }
    };
    open();
    window.addEventListener('hashchange', open);
    return () => window.removeEventListener('hashchange', open);
  }, []);
  return null;
}
