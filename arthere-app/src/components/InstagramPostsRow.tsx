'use client';

import { useRef } from 'react';
import Image from 'next/image';

export interface InstagramPost {
  /** Portrait image — a path under /public or an absolute URL. */
  imageUrl: string;
  alt: string;
  /** Optional per-post permalink. Falls back to the profile URL. */
  permalink?: string;
}

interface Props {
  posts: InstagramPost[];
  /** Where a tile goes when the post has no permalink of its own. */
  profileUrl: string;
}

/**
 * Row of recent Instagram posts, on a light band between the two dark
 * sections. Renders nothing when there are no posts — the homepage should
 * never show empty placeholder tiles.
 *
 * Tiles are 3:4 portrait to match Instagram's portrait crop. The arrows
 * genuinely scroll the row rather than being decorative, so this keeps
 * working as more posts are added.
 */
export function InstagramPostsRow({ posts, profileUrl }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByTile(direction: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    // Roughly one tile plus its gap, so each click lands on a tile boundary.
    el.scrollBy({ left: (el.clientWidth / 3) * direction, behavior: 'smooth' });
  }

  if (posts.length === 0) return null;

  return (
    <div className="flex items-center gap-3 sm:gap-5">
      <Arrow direction="left" onClick={() => scrollByTile(-1)} />

      <div
        ref={scrollerRef}
        className="flex-1 min-w-0 flex gap-3 sm:gap-5 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {posts.map(post => (
          <a
            key={post.imageUrl}
            href={post.permalink ?? profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative shrink-0 w-[62%] sm:w-[calc((100%-2*1.25rem)/3)] aspect-[3/4] rounded-lg overflow-hidden bg-[#f0ede9] hover:opacity-90 transition-opacity"
          >
            {/* ~1% upscale trims the couple of stray black screenshot pixels
                at the edges. Kept deliberately small: any more and it starts
                clipping the multi-photo badge in the top-right corner. */}
            <Image
              src={post.imageUrl}
              alt={post.alt}
              fill
              sizes="(max-width: 640px) 62vw, 260px"
              className="object-cover scale-[1.01]"
            />
          </a>
        ))}
      </div>

      <Arrow direction="right" onClick={() => scrollByTile(1)} />
    </div>
  );
}

function Arrow({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'left' ? 'Previous posts' : 'Next posts'}
      className="shrink-0 w-9 h-9 rounded-full border border-[#e0ddd8] bg-white text-[#888] flex items-center justify-center hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors cursor-pointer"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {direction === 'left' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  );
}
