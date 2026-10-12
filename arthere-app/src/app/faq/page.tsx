import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { FaqAccordion } from '@/components/FaqAccordion';
import { FaqDeepLink } from '@/components/FaqDeepLink';
import { FAQ_SECTIONS } from '@/lib/faq';
import gradientStyles from '../AnimatedGradient.module.css';

export const metadata: Metadata = {
  title: 'FAQ | Art Here',
  description: 'Answers about Art Here: what it is, how artists join (free), how organizations and cities can take part, and how to get in touch.',
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_SECTIONS.flatMap(s => s.items).map(i => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.text },
    })),
  };

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <NavBar theme="light" />
      {/* Same black Bebas band as the artists page's DirectoryCallout. */}
      <div className="bg-[#1a1a1a] text-white mt-14">
        <div className="px-[18px] py-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <h1 className="font-display text-[2rem] sm:text-[2.4rem] leading-none tracking-[0.04em]">
            FAQ
          </h1>
          <p className="text-[0.9rem] font-light text-white/65 leading-[1.7]">
            Get to know <BandLink id="about-art-here">Art Here</BandLink> and{' '}
            <BandLink id="our-story">our story</BandLink>, and see how we work with{' '}
            <BandLink id="for-artists">artists</BandLink>,{' '}
            <BandLink id="for-organizations-and-cities">organizations</BandLink>, and{' '}
            <BandLink id="for-organizations-and-cities">cities</BandLink>.
          </p>
        </div>
      </div>
      <main className="max-w-[760px] mx-auto px-6 sm:px-10 pt-10 pb-20">
        {FAQ_SECTIONS.map(s => (
          <section key={s.title} id={slug(s.title)} className="mb-12 scroll-mt-[90px]">
            {/* Gradient shows through the letters (text-clip), panning like the pill. */}
            <h2 className={`${gradientStyles.gradientText} font-display inline-block text-[1.4rem] sm:text-[1.6rem] leading-none tracking-[0.06em] uppercase text-transparent [background-clip:text] [-webkit-background-clip:text] pb-1 mb-3`}>
              {s.title}
            </h2>
            <FaqAccordion items={s.items} />
          </section>
        ))}
      </main>
      <SiteFooter />
      <FaqDeepLink />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </div>
  );
}

function slug(title: string) {
  return sectionId(title.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''));
}

function sectionId(name: string) {
  return 'section-' + name;
}

function BandLink({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <a
      href={`#${sectionId(id)}`}
      className="text-white underline underline-offset-[3px] decoration-white/40 hover:decoration-white transition-colors"
    >
      {children}
    </a>
  );
}
