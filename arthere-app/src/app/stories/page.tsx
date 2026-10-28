import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { prisma } from '@/lib/db';
import { storyVideoEmbedUrl } from '@/lib/story-video';

export const metadata: Metadata = {
  title: 'Community Stories | Art Here',
  description: 'Residents, visitors, and partners share first-person video accounts of how creative places and programs shape their city.',
  alternates: { canonical: '/stories' },
};

export default async function StoriesPage() {
  // Published videos with a link we can embed. If the database is unreachable
  // (CI build) the page falls back to "Coming soon!".
  let videos: { id: string; title: string; byline: string; description: string; embed: string }[] = [];
  try {
    const rows = await prisma.storyVideo.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' } });
    videos = rows.flatMap(v => {
      const embed = storyVideoEmbedUrl(v.videoUrl);
      return embed ? [{ id: v.id, title: v.title, byline: v.byline, description: v.description, embed }] : [];
    });
  } catch {}

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <NavBar theme="light" />
      <div className="bg-[#1a1a1a] text-white mt-14">
        <div className="px-[18px] py-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <h1 className="font-display text-[2rem] sm:text-[2.4rem] leading-none tracking-[0.04em]">
            Community Stories
          </h1>
          <p className="text-[0.9rem] font-light text-white/65 leading-[1.7]">
            First-person accounts of how creative places and programs shape the city.
          </p>
        </div>
      </div>
      <main className="max-w-[760px] mx-auto px-6 sm:px-10 pt-10 pb-20">
        <p className="text-[1.15rem] leading-[1.7] font-light">
          Art Here partners with communities to uncover how people experience
          local arts and culture. Through Community Stories, residents,
          visitors, and partners share first-person video accounts of how
          creative places and programs shape their city, capturing the human
          impact that numbers miss.
        </p>

        <section className="mt-12">
          <h2 className="font-display text-[1.4rem] sm:text-[1.6rem] leading-none tracking-[0.06em] uppercase mb-3">
            Videos
          </h2>
          {videos.length === 0 ? (
            <p className="text-[1rem] leading-[1.75] font-light italic">
              Coming soon!
            </p>
          ) : (
            <div className="space-y-10">
              {videos.map(v => (
                <figure key={v.id}>
                  <div className="aspect-video bg-[#f0f0f0] rounded-md overflow-hidden">
                    <iframe
                      src={v.embed}
                      title={v.title || 'Community story video'}
                      className="w-full h-full"
                      allow="fullscreen; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                  {(v.title || v.byline || v.description) && (
                    <figcaption className="mt-3">
                      {v.title && <h3 className="text-[1.1rem] font-medium leading-snug">{v.title}</h3>}
                      {v.byline && <p className="text-[0.9rem] text-[#666] font-light">{v.byline}</p>}
                      {v.description && <p className="mt-1 text-[1rem] leading-[1.75] font-light">{v.description}</p>}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="font-display text-[1.4rem] sm:text-[1.6rem] leading-none tracking-[0.06em] uppercase mb-3">
            Take part
          </h2>
          <p className="text-[1rem] leading-[1.75] font-light">
            Interested in partnering, or know someone whose perspective belongs
            here?{' '}
            <a
              href="/contact"
              className="underline underline-offset-[3px] decoration-[#1a1a1a]/40 hover:decoration-[#1a1a1a] transition-colors"
            >
              Get in touch
            </a>
            .
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
