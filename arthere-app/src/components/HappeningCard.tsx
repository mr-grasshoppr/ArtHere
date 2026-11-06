'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { formatWhen, type Happening } from '@/lib/mock-happenings';

const OFFSET = 14;

/** Below-right of the cursor, flipped left and/or up when that would run off the screen — same as PreviewCard. */
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
 * The hover card for a place with something on: the same dark card as the
 * place card (PreviewCard), with the event's own picture across the top when
 * it has one, then title, time, place, and a row of pills. No picture, no
 * banner, so the card is simply shorter.
 */
export function HappeningCard({ event, place, x, y }: { event: Happening; place: string; x: number; y: number }) {
  const { ref, style } = useOnScreenPosition(x, y);
  const where = event.hosts && event.hosts.length > 1 ? `${place} and ${event.hosts.length - 1} more` : place;
  const pills = [event.kind, ...(event.family ? ['Family friendly'] : []), ...(event.adult ? ['18+'] : []), ...(event.free ? ['Free'] : [])];
  return (
    <div
      ref={ref}
      className="fixed z-50 pointer-events-none bg-[#111] border border-[#222] rounded-lg overflow-hidden w-[240px] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
      style={style}
    >
      {event.image && (
        <div className="relative w-full h-[110px] bg-[#1a1a1a]">
          <Image src={event.image} alt="" fill sizes="240px" className="object-cover object-top" />
        </div>
      )}
      <div className="p-3">
        <div className="font-heading text-[0.9rem] font-bold text-white leading-tight mb-1">{event.title}</div>
        <div className="text-[0.75rem] text-[#888] leading-snug">{formatWhen(event)}</div>
        <div className="text-[0.75rem] text-[#888] leading-snug">
          {where}
          {event.where ? ` · ${event.where}` : ''}
        </div>
        <div className="mt-2 flex flex-wrap gap-[5px]">
          {pills.map((p, i) => (
            <span
              key={p}
              className={`rounded-full border px-2 py-px text-[0.6875rem] capitalize ${
                i === 0 ? 'border-[#3d4417] text-[#bdd349]' : 'border-[#333] bg-[#262626] text-[#d4d4d4]'
              }`}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
