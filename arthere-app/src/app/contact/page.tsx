import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { NavBar } from '@/components/NavBar';
import { joinSlugForIntent } from '@/lib/join-audiences';
import { ContactForm } from './ContactForm';

// ?type=featured|place|partner|bring now live on their own /join pages;
// old links (FAQ, emails, shares) are sent there. Everything else is the
// general contact form.
export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const { type } = await searchParams;
  const joinSlug = joinSlugForIntent(Array.isArray(type) ? type[0] : type);
  if (joinSlug) redirect(`/join/${joinSlug}`);

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <NavBar theme="light" />
      <main className="max-w-[560px] mx-auto px-5 pt-28 pb-20">
        <Suspense>
          <ContactForm />
        </Suspense>
      </main>
    </div>
  );
}
