import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import OnboardingForm from "@/components/OnboardingForm";
import { getFocals } from "@/lib/image-focus";

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
          otherConnections: { orderBy: { sortOrder: "asc" } },
          links: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  if (!user) redirect("/login");

  const a = user.artist;

  // Plain object (not a Map) — Maps aren't guaranteed to survive the
  // server→client boundary cleanly, and this needs to hydrate into client
  // component props.
  const initialFocals = a
    ? Object.fromEntries(
        await getFocals([a.heroImageUrl, a.bioPhotoUrl, ...a.artworkImages.map((img) => img.url)])
      )
    : {};

  const initialData = a ? {
    name: a.name ?? "",
    medium: a.medium ?? "",
    neighborhood: a.neighborhood ?? "",
    bio: a.bio ?? "",
    quote: a.quote ?? "",
    otherConnections: a.otherConnections.map((c) => ({ name: c.name, relationship: c.relationship, relationshipLabel: c.relationshipLabel ?? undefined })),
    links: a.links.map((l) => ({ type: l.type, url: l.url, label: l.label ?? undefined })),
    bioPhotoUrl: a.bioPhotoUrl ?? null,
    hireFor: a.hireFor ?? "",
    images: a.artworkImages.map((img) => ({ id: img.id, url: img.url, isHero: img.isHero })),
    placeRelations: a.placeRelations.map((r) => ({ placeName: r.place?.name ?? r.venueName ?? '', relationship: r.relationship })),
    isPlaceholder: a.isPlaceholder,
    submittedForReviewAt: a.submittedForReviewAt?.toISOString() ?? null,
  } : null;

  return (
    <main className="min-h-screen bg-white text-[#1a1a1a]" style={{ colorScheme: "light" }}>
      <OnboardingForm initialData={initialData} initialFocals={initialFocals} />
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
