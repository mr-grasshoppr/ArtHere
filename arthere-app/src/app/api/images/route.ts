import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { del } from "@vercel/blob";
import { getMediumOptions } from "@/lib/medium-options";

/** Artist-set medium for one of their own pieces. */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.medium)) {
    return NextResponse.json({ error: "medium must be an array" }, { status: 400 });
  }

  const image = await prisma.artworkImage.findUnique({
    where: { id },
    select: { id: true, artist: { select: { userId: true } } },
  });
  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (image.artist.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Only labels from the shared vocabulary. The artist UI can't mint new ones
  // (that action is admin-only), so anything else is a stale or forged client.
  const allowed = new Set(await getMediumOptions());
  const medium: string[] = [
    ...new Set((body.medium as unknown[]).filter((m): m is string => typeof m === "string" && allowed.has(m))),
  ];

  await prisma.artworkImage.update({ where: { id }, data: { medium } });
  return NextResponse.json({ ok: true, medium });
}

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
