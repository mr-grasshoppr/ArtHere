'use client';

import { useRef } from 'react';

/**
 * Horizontally scrolling row with arrow buttons, in the style of the
 * homepage Instagram row. Children should be fixed-width tiles (shrink-0).
 */
export function ScrollRow({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: -1 | 1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: (el.clientWidth / 3) * dir, behavior: 'smooth' });
  };
  const arrow = (dir: -1 | 1) => (
    <button
      type="button"
      onClick={() => scrollBy(dir)}
      aria-label={`${dir < 0 ? 'Previous' : 'Next'} ${label}`}
      className="shrink-0 w-9 h-9 rounded-full border border-[#e0ddd8] bg-white text-[#888] flex items-center justify-center hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors cursor-pointer"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {dir < 0 ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  );
  return (
    <div className="flex items-center gap-3 sm:gap-5">
      {arrow(-1)}
      <div ref={ref} className="flex-1 min-w-0 flex gap-3 sm:gap-5 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
      {arrow(1)}
    </div>
  );
}
