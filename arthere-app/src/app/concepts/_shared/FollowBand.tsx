'use client';

import { Fragment, useRef, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { InstagramIcon } from '@/components/InstagramIcon';
import type { InstagramPost } from '@/components/InstagramPostsRow';

interface Props {
  posts: InstagramPost[];
  profileUrl: string;
  /** Wrapper classes that set the page's max-width and side gutters. */
  wrap: string;
  /** Heading element, so each concept keeps its own display type. */
  heading: ReactNode;
  /** The email signup form (server-rendered by the page). */
  signup: ReactNode;
}

/**
 * One dark band that carries the whole "follow us" story: heading + Instagram
 * link + arrows share a header row, the posts sit three across inside the page
 * column (arrows scroll the rest), then the email signup and
 * contact line close the page above the footer.
 */
export function FollowBand({ posts, profileUrl, wrap, heading, signup }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const handle = '@' + (profileUrl.replace(/\/$/, '').split('/').pop() ?? '');
  const by = (dir: -1 | 1) => scroller.current?.scrollBy({ left: 320 * dir, behavior: 'smooth' });

  return (
    <section id="contact" className="bg-[#1a1a1a] text-white overflow-x-clip scroll-mt-[70px]">
      <div className={`${wrap} pt-14 sm:pt-16 pb-14 sm:pb-16`}>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 mb-7">
          <div>
            <Fragment key="heading">{heading}</Fragment>
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2.5 text-[0.95rem] text-[#ddd] hover:text-white transition-colors"
            >
              <InstagramIcon size={26} />
              <span className="underline underline-offset-[3px] decoration-[#666]">Follow {handle}<span className="hidden sm:inline"> on Instagram</span></span>
              <span aria-hidden>→</span>
            </a>
          </div>
          {posts.length > 0 && (
            <div className="flex gap-2">
              <Arrow dir="left" onClick={() => by(-1)} />
              <Arrow dir="right" onClick={() => by(1)} />
            </div>
          )}
        </div>

        {posts.length > 0 && (
          <div
            ref={scroller}
            className="flex gap-3 sm:gap-5 overflow-x-auto scroll-smooth snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden "
          >
            {posts.map((p, i) => (
              <a
                key={`${i}-${p.imageUrl}`}
                href={p.permalink ?? profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative shrink-0 snap-start w-[62%] sm:w-[calc((100%-2.5rem)/3)] aspect-[3/4] rounded-lg overflow-hidden bg-[#2a2a2a] hover:opacity-90 transition-opacity"
              >
                <Image src={p.imageUrl} alt={p.alt} fill sizes="(max-width: 640px) 62vw, 320px" className="object-cover scale-[1.01]" />
              </a>
            ))}
          </div>
        )}

        <div className="mt-12 pt-10 border-t border-[#2c2c2c]">
          <Fragment key="signup">{signup}</Fragment>
          <div className="mt-10 text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#888] mb-3">Get in touch</div>
          <Link href="/contact" className="font-heading text-[clamp(1.3rem,3vw,1.8rem)] font-bold text-white border-b-2 border-white pb-0.5 hover:opacity-60 transition-opacity">
            hello@artishere.org
          </Link>
        </div>
      </div>
    </section>
  );
}

function Arrow({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 'left' ? 'Previous posts' : 'Next posts'}
      className="w-10 h-10 rounded-full border border-[#555] text-white flex items-center justify-center hover:bg-white hover:text-[#1a1a1a] transition-colors cursor-pointer"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {dir === 'left' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  );
}
