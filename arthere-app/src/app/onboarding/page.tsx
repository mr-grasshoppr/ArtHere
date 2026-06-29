import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Nunito } from "next/font/google";
import OnboardingForm from "@/components/OnboardingForm";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-nunito",
  display: "swap",
});

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fonboarding");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      artist: {
        include: {
          artworkImages: { orderBy: { sortOrder: "asc" } },
          placeRelations: { include: { place: true } },
        },
      },
    },
  });

  if (!user) redirect("/login");

  const places = await prisma.place.findMany({ orderBy: { name: "asc" } });

  const a = user.artist;
  const initialData = a ? {
    name: a.name ?? "",
    medium: a.medium ?? "",
    neighborhood: a.neighborhood ?? "",
    bio: a.bio ?? "",
    website: a.website ?? "",
    instagram: a.instagram ?? "",
    bioPhotoUrl: a.bioPhotoUrl ?? null,
    hireFor: a.hireFor ?? "",
    images: a.artworkImages.map((img) => ({ id: img.id, url: img.url, isHero: img.isHero })),
    placeRelations: a.placeRelations.map((r) => ({ placeName: r.place.name, relationship: r.relationship })),
  } : null;

  return (
    <main className={`${nunito.variable} min-h-screen bg-white text-[#1a1a1a]`} style={{ colorScheme: "light" }}>
      <OnboardingForm places={places} userEmail={user.email ?? ""} initialData={initialData} />
      <div className="max-w-[980px] mx-auto px-4 sm:px-10 pb-10 text-center">
        <p className="text-[0.82rem] text-[#aaa] font-light">
          Experiencing tech issues?{' '}
          <a href="mailto:hello@artishere.org" className="underline underline-offset-[3px] hover:text-[#555] transition-colors">
            Contact us here
          </a>
        </p>
      </div>
    </main>
  );
}
