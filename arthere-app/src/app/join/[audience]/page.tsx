import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { JOIN_AUDIENCES, getJoinAudience } from '@/lib/join-audiences';
import { AudienceStage } from './AudienceStage';

export function generateStaticParams() {
  return JOIN_AUDIENCES.map(a => ({ audience: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ audience: string }>;
}): Promise<Metadata> {
  const { audience } = await params;
  const a = getJoinAudience(audience);
  if (!a) return {};
  return {
    title: `${a.title}: ${a.audience} | Art Here`,
    description: a.intro,
    alternates: { canonical: `/join/${a.slug}` },
  };
}

export default async function JoinPage({ params }: { params: Promise<{ audience: string }> }) {
  const { audience } = await params;
  const a = getJoinAudience(audience);
  if (!a) notFound();

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <NavBar theme="light" />

      <AudienceStage slug={a.slug} />

      <main className="max-w-[1000px] mx-auto px-6 sm:px-10 py-12 sm:py-16">
        <p className="text-[1.1rem] text-[#444] font-light leading-[1.8] max-w-[720px]">{a.intro}</p>

        <h2 className="font-display text-[1.4rem] tracking-[0.06em] uppercase mt-10 mb-4">What to expect</h2>
        <ol className="flex flex-col gap-4 max-w-[720px] list-none p-0 m-0">
          {a.expect.map((step, i) => (
            <li key={step} className="flex gap-4">
              <span className="font-display text-[1.6rem] leading-none text-[#bbb] w-6 shrink-0">{i + 1}</span>
              <span className="text-[0.95rem] text-[#555] font-light leading-[1.7] pt-0.5">{step}</span>
            </li>
          ))}
        </ol>

        <p className="mt-10 text-[0.85rem] text-[#999]">
          Not the right fit? See the other ways to join:{' '}
          {JOIN_AUDIENCES.filter(o => o.slug !== a.slug).map((o, i, arr) => (
            <span key={o.slug}>
              <Link href={`/join/${o.slug}`} className="underline underline-offset-[3px] decoration-[#ccc] hover:text-[#1a1a1a] transition-colors">
                {o.audience}
              </Link>
              {i < arr.length - 1 ? ', ' : '.'}
            </span>
          ))}
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
