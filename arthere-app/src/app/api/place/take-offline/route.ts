import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { placeAccessWhere } from "@/lib/place-access";

// POST — the org owner pulls their own live page back to Draft ("not live").
// Mirrors /api/profile/take-offline. One-way on purpose: going live stays an
// admin publish (setPlaceVisibility), reached again through "Submit", so this
// can't be used to skip review.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const place = await prisma.place.findFirst({
    where: placeAccessWhere(session.user.id),
    select: { id: true, slug: true },
  });
  if (!place) return NextResponse.json({ error: "No page found" }, { status: 404 });

  await prisma.place.update({
    where: { id: place.id },
    data: { inDirectory: false, submittedForReviewAt: null },
  });

  revalidatePath("/admin/organizations");
  revalidatePath("/cities/portland");
  revalidatePath(`/places/${place.slug}`);
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ ok: true });
}
