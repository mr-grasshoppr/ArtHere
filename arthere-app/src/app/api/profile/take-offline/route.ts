import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST — the artist pulls their own live profile back to Draft ("not live").
// One-way on purpose: going live stays an admin publish (setArtistPlaceholder),
// reached again through "Submit for review", so this can't be used to skip it.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const artist = await prisma.artist.findUnique({
    where: { userId: session.user.id },
    select: { id: true, slug: true },
  });
  if (!artist) return NextResponse.json({ error: "No profile found" }, { status: 404 });

  await prisma.artist.update({
    where: { id: artist.id },
    data: { isPlaceholder: true, submittedForReviewAt: null },
  });

  revalidatePath("/admin/artists");
  revalidatePath("/cities/portland");
  revalidatePath("/cities/portland/artists");
  revalidatePath(`/artists/${artist.slug}`);
  revalidatePath(`/cities/portland/artists/${artist.slug}`);
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ ok: true });
}
