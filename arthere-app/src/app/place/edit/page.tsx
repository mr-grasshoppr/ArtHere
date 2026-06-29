import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Nunito } from 'next/font/google';
import PlaceEditForm from './PlaceEditForm';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-nunito',
  display: 'swap',
});

export default async function PlaceEditPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/my-art-here');

  const place = await prisma.place.findUnique({
    where: { userId: session.user.id },
  });

  if (!place) redirect('/my-art-here');

  return (
    <div className={`${nunito.variable} min-h-full bg-white text-[#1a1a1a] pt-14`}>
      <PlaceEditForm
        initialData={{
          name: place.name,
          neighborhood: place.neighborhood ?? '',
          description: place.description ?? '',
          website: place.website ?? '',
          heroImageUrl: place.heroImageUrl ?? null,
          galleryImages: place.galleryImages,
        }}
        placeSlug={place.slug}
      />
      <div className="max-w-[980px] mx-auto px-4 sm:px-10 pb-10 text-center">
        <p className="text-[0.82rem] text-[#aaa] font-light">
          Experiencing tech issues?{' '}
          <a href="mailto:hello@artishere.org" className="underline underline-offset-[3px] hover:text-[#555] transition-colors">
            Contact us here
          </a>
        </p>
      </div>
    </div>
  );
}
