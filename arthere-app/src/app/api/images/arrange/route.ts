import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Set which pieces an artist's profile shows, and in what order.
 *
 * The client sends the whole arrangement — the header image, then every
 * other piece in order — rather than a move at a time: the editor already
 * knows the arrangement it wants, and one request of the finished state
 * can't leave two pieces claiming the same slot the way a sequence of
 * swaps can. Everything past the visible slots is kept; it simply stops
 * being shown (see lib/artist-images).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const order: unknown = body?.order;
  const heroId: unknown = body?.heroId ?? null;
  if (!Array.isArray(order) || order.some(id => typeof id !== "string")) {
    return NextResponse.json({ error: "order must be an array of image ids" }, { status: 400 });
  }
  if (heroId !== null && typeof heroId !== "string") {
    return NextResponse.json({ error: "heroId must be an image id or null" }, { status: 400 });
  }

  const artist = await prisma.artist.findUnique({
    where: { userId: session.user.id },
    include: { artworkImages: { select: { id: true, url: true } } },
  });
  if (!artist) return NextResponse.json({ error: "No artist profile" }, { status: 404 });

  // Only this artist's own pieces, and every one of them exactly once: a
  // partial order would leave the images left out with stale slots.
  const own = new Map(artist.artworkImages.map(img => [img.id, img.url]));
  const ids = order as string[];
  if (ids.length !== own.size || new Set(ids).size !== ids.length || ids.some(id => !own.has(id))) {
    return NextResponse.json({ error: "order must list each of your images once" }, { status: 400 });
  }
  if (heroId !== null && !own.has(heroId)) {
    return NextResponse.json({ error: "heroId is not one of your images" }, { status: 400 });
  }

  await prisma.$transaction([
    ...ids.map((id, i) =>
      prisma.artworkImage.update({
        where: { id },
        data: { sortOrder: i, isHero: id === heroId },
      })
    ),
    prisma.artist.update({
      where: { id: artist.id },
      data: { heroImageUrl: typeof heroId === "string" ? (own.get(heroId) ?? null) : null },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
