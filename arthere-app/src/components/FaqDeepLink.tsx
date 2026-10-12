'use client';

import { useEffect } from 'react';

// Opens the accordion item named in the URL hash (/faq#does-it-cost-anything),
// on load and when the hash changes.
export function FaqDeepLink() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const el = document.getElementById(id);
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        el.scrollIntoView();
      }
    };
    open();
    window.addEventListener('hashchange', open);
    return () => window.removeEventListener('hashchange', open);
  }, []);
  return null;
}
