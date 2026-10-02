'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface PreviewCardProps {
  /** Artists get a portrait strip on the left; places a banner across the top. */
  variant: 'artist' | 'place';
  label: string;
  /** The muted line under the name — medium for artists, neighborhood for places. */
  meta: string;
  imageUrl: string | null;
  /** Cursor position (viewport px); the card sits just below-right of it, flipping to stay on screen. */
  x: number;
  y: number;
  /**
   * Makes the card itself clickable, through to this page — for a card pinned
   * open by a click. Without it the card ignores the pointer, so a hover card
   * never gets in the way of whatever is under it.
   */
  href?: string | null;
}

const OFFSET = 14;

/**
 * Where to put a card of this size so it stays on screen: below-right of the
 * cursor by default, flipped to the left and/or above when that would run
 * off the viewport's edge.
 */
function useOnScreenPosition(x: number, y: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x + OFFSET, top: y + OFFSET });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const left = x + OFFSET + width > window.innerWidth ? Math.max(0, x - OFFSET - width) : x + OFFSET;
    const top = y + OFFSET + height > window.innerHeight ? Math.max(0, y - OFFSET - height) : y + OFFSET;
    setPos((p) => (p.left === left && p.top === top ? p : { left, top }));
  }, [x, y]);
  return { ref, style: pos };
}

/**
 * The dark hover card shown over the map tab's views — one component, so the
 * Network graph and the Geographic map can't drift apart.
 *
 * Artist width is generous enough that most medium lists fit in 1-2 lines;
 * text is never clamped/truncated, so a card with a longer medium list just
 * grows a little taller rather than losing text.
 */
export function PreviewCard({ variant, label, meta, imageUrl, x, y, href }: PreviewCardProps) {
  const { ref, style } = useOnScreenPosition(x, y);

  if (variant === 'artist') {
    return (
      <div
        ref={ref}
        className="fixed z-50 pointer-events-none bg-[#111] border border-[#222] rounded-lg overflow-hidden w-[300px] min-h-[76px] flex items-stretch shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
        style={style}
      >
        {imageUrl && (
          <div className="relative w-[72px] flex-shrink-0 bg-[#1a1a1a]">
            <Image src={imageUrl} alt="" fill sizes="72px" className="object-cover" />
          </div>
        )}
        <div className="px-3 py-2 min-w-0 flex flex-col justify-center">
          <div className="font-heading text-[0.8rem] font-bold text-white leading-tight">{label}</div>
          {meta && <div className="text-[0.68rem] text-[#888] leading-snug mt-0.5">{meta}</div>}
        </div>
      </div>
    );
  }

  const body = (
    <>
      {imageUrl && (
        <div className="relative w-full h-[110px] bg-[#1a1a1a]">
          <Image src={imageUrl} alt="" fill sizes="240px" className="object-cover" />
        </div>
      )}
      <div className="p-3">
        <div className="font-heading text-[0.9rem] font-bold text-white mb-1">{label}</div>
        {meta && <div className="text-[0.75rem] text-[#888] leading-snug">{meta}</div>}
        {href && <div className="text-[0.72rem] text-[#bbb] mt-2 group-hover:text-white">View page →</div>}
      </div>
    </>
  );

  return (
    <div
      ref={ref}
      className={`fixed z-50 ${href ? 'pointer-events-auto' : 'pointer-events-none'} bg-[#111] border border-[#222] rounded-lg overflow-hidden w-[240px] shadow-[0_8px_32px_rgba(0,0,0,0.6)]`}
      style={style}
    >
      {href ? (
        <Link href={href} className="group block hover:bg-[#161616]">
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  );
}
