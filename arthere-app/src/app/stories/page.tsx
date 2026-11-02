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

// Pink, green and chartreuse dots after a section title.
function StickerDots() {
  return (
    <span
      aria-hidden="true"
      className="block w-[34px] h-[10px]"
      style={{
        backgroundImage:
          'radial-gradient(circle at 5px 5px, #f96a9b 4.5px, transparent 5px), radial-gradient(circle at 17px 5px, #07b26b 4.5px, transparent 5px), radial-gradient(circle at 29px 5px, #bdd349 4.5px, transparent 5px)',
      }}
    />
  );
}

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
            Video stories about how the impact of arts on places.
          </p>
        </div>
      </div>
      <main className="max-w-[1080px] mx-auto px-6 sm:px-10 pt-10 sm:pt-12">
        <p className="max-w-[760px] text-[1.15rem] leading-[1.7] font-light">
          Art Here partners with communities to uncover how people experience
          local arts and culture. Through Community Stories, residents,
          visitors, and partners share first-person video accounts of how
          creative places and programs shape their city, capturing the human
          impact that numbers miss.
        </p>

        <section className="mt-14">
          <h2 className="font-display text-[1.4rem] sm:text-[1.6rem] leading-none tracking-[0.06em] uppercase mb-4 flex items-center gap-3">
            Videos
            <StickerDots />
          </h2>
          {videos.length === 0 ? (
            <p className="text-[1rem] leading-[1.75] font-light italic">
              Coming soon!
            </p>
          ) : (
            <div className="space-y-10 max-w-[900px]">
              {videos.map(v => (
                <figure key={v.id}>
                  {(v.title || v.byline || v.description) && (
                    <figcaption className="mb-3">
                      {v.title && <h3 className="text-[1.1rem] font-medium leading-snug">{v.title}</h3>}
                      {v.byline && <p className="text-[0.9rem] text-[#666] font-light">{v.byline}</p>}
                      {v.description && <p className="mt-1 text-[1rem] leading-[1.75] font-light">{v.description}</p>}
                    </figcaption>
                  )}
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
                </figure>
              ))}
            </div>
          )}
        </section>

      </main>

      <section className="mt-16 bg-[#bdd349] py-10">
        <div className="max-w-[1080px] mx-auto px-6 sm:px-10 flex flex-wrap items-center justify-between gap-x-10 gap-y-5">
          <div>
            <h2 className="font-display text-[1.4rem] sm:text-[1.6rem] leading-none tracking-[0.06em] uppercase mb-3">
              Tell Your Story
            </h2>
            <p className="max-w-[52ch] text-[1rem] leading-[1.75] font-light">
              Interested in creating an Art Here story, or know someone whose
              perspective belongs here?{' '}
              <a
                href="/contact"
                className="underline underline-offset-[3px] decoration-[#1a1a1a]/40 hover:decoration-[#1a1a1a] transition-colors"
              >
                Get in touch
              </a>
              .
            </p>
          </div>
          <a
            href="/contact"
            className="inline-block font-display text-[1.4rem] leading-[1.2] tracking-[0.06em] uppercase bg-[#1a1a1a] text-white hover:bg-white hover:text-[#1a1a1a] transition-colors rounded-full px-[30px] pt-[14px] pb-[10px] min-h-12"
          >
            Get in touch
          </a>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
