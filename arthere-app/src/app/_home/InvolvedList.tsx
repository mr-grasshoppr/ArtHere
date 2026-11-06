'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface Item { who: string; cta: string; href: string; benefit: string }

const DISPLAY = 'font-display uppercase tracking-[0.02em] leading-[0.95]';

/**
 * The "How to get involved" rows. On a mouse the hover state does the work.
 * Touch screens have no hover, so there the row crossing the middle of the
 * viewport takes the same highlighted state as the reader scrolls, and a tap
 * gets immediate :active feedback before the page navigates.
 */
export function InvolvedList({ items }: { items: Item[] }) {
  const [active, setActive] = useState<string | null>(null);
  const refs = useRef<Map<string, HTMLLIElement>>(new Map());

  useEffect(() => {
    if (!window.matchMedia('(hover: none)').matches) return;
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          const who = (e.target as HTMLElement).dataset.who ?? null;
          if (e.isIntersecting) setActive(who);
          else setActive(cur => (cur === who ? null : cur));
        }
      },
      // A thin band across the middle of the screen: one row at a time.
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );
    refs.current.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <ul className="mt-10 border-t-2 border-[#333]">
      {items.map(w => {
        const on = active === w.who;
        return (
          <li
            key={w.who}
            data-who={w.who}
            ref={el => {
              if (el) refs.current.set(w.who, el);
              else refs.current.delete(w.who);
            }}
          >
            <Link
              href={w.href}
              className={`${DISPLAY} flex items-baseline justify-between gap-4 py-4 border-b-2 border-[#333] text-[clamp(1.7rem,5vw,3rem)] leading-none transition-[padding,color] duration-300 hover:pl-5 hover:text-[#bdd349] focus-visible:pl-5 focus-visible:text-[#bdd349] active:pl-5 active:text-[#bdd349] ${on ? 'pl-5 text-[#bdd349]' : 'text-white'}`}
            >
              <span className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-6">
                <span>{w.who}</span>
                <small className="font-[family-name:var(--font-inter)] normal-case tracking-normal text-[0.9rem] font-light text-[#ccc]">{w.benefit}</small>
              </span>
              <small className="shrink-0 font-[family-name:var(--font-inter)] normal-case tracking-normal text-[0.85rem] text-[#bdd349] text-right">{w.cta} →</small>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
