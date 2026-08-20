'use client';

import { useRef } from 'react';

export interface InstagramPost {
  /** Square-ish thumbnail. A path under /public (e.g. "/images/parade-1.jpg") or an absolute URL. */
  imageUrl: string;
  /** Where clicking the tile goes — the post's permalink, or the profile as a fallback. */
  permalink: string;
  /** Describe the photo for screen readers; leave blank only if the image is purely decorative. */
  alt?: string;
}

interface Props {
  posts: InstagramPost[];
}

/**
 * Row of recent Instagram posts, on a light band between the two dark
 * sections. Renders nothing when there are no posts — the homepage should
 * never show empty placeholder tiles.
 *
 * The arrows genuinely scroll the row rather than being decorative, so this
 * still behaves correctly once there are more posts than fit on screen.
 */
export function InstagramPostsRow({ posts }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (posts.length === 0) return null;

  function scrollByTile(direction: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    // Roughly one tile plus its gap, so each click lands on a tile boundary.
    el.scrollBy({ left: (el.clientWidth / 3) * direction, behavior: 'smooth' });
  }

  return (
    <div className="flex items-center gap-3 sm:gap-5">
      <Arrow direction="left" onClick={() => scrollByTile(-1)} />

      <div
        ref={scrollerRef}
        className="flex-1 min-w-0 flex gap-3 sm:gap-5 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {posts.map(post => (
          <a
            key={post.permalink}
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 w-[70%] sm:w-[calc((100%-2*1.25rem)/3)] aspect-square rounded-lg overflow-hidden bg-[#f0ede9] hover:opacity-90 transition-opacity"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.imageUrl} alt={post.alt ?? ''} className="w-full h-full object-cover" />
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
