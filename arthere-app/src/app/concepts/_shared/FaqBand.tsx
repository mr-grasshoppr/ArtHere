import type { ReactNode } from 'react';
import Link from 'next/link';

interface Props {
  wrap: string;
  /** Heading element ("FAQs"), so each concept keeps its own display type. */
  heading: ReactNode;
  /** The FaqAccordion with the teaser questions. */
  children: ReactNode;
}

/**
 * Heading and the way out to the full FAQ sit together on the left; the
 * questions fill the right. Stacks on phones.
 */
export function FaqBand({ wrap, heading, children }: Props) {
  return (
    <section className="bg-white">
      <div className={`${wrap} py-14 sm:py-16 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-14 items-start`}>
        <div>
          {heading}
          <p className="mt-4 mb-6 text-[1rem] font-light leading-[1.7] text-[#555] max-w-[26ch]">
            Quick answers about Art Here, cost, and joining.
          </p>
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] text-white px-5 py-2.5 text-[0.95rem] font-medium hover:bg-[#07b26b] transition-colors"
          >
            All FAQs <span aria-hidden>→</span>
          </Link>
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}
