import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { del } from "@vercel/blob";

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const image = await prisma.artworkImage.findUnique({
    where: { id },
    include: { artist: { select: { id: true, userId: true } } },
  });

  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (image.artist.userId !== session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  await prisma.artworkImage.delete({ where: { id } });

  // Deleting the hero image would otherwise leave Artist.heroImageUrl pointing
  // at a now-deleted blob — fall back to the next available image, or null.
  if (image.isHero) {
    const next = await prisma.artworkImage.findFirst({
      where: { artistId: image.artist.id },
      orderBy: { sortOrder: "asc" },
    });
    await prisma.artist.update({ where: { id: image.artist.id }, data: { heroImageUrl: next?.url ?? null } });
  }

  try {
    await del(image.url);
  } catch {
    // Non-critical — image removed from DB regardless
  }

  return NextResponse.json({ ok: true });
}
