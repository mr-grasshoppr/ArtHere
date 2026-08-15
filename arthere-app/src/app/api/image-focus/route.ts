import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { placeAccessWhere } from "@/lib/place-access";

// Self-service manual framing override — lets a signed-in artist or place
// owner adjust the crop of one of THEIR OWN images. Sets manual=true so
// auto-detection never overwrites it. GET returns the current value (or null)
// for a url; POST upserts a new one after verifying ownership.

async function ownsUrl(userId: string, url: string): Promise<boolean> {
  const [artist, place] = await Promise.all([
    prisma.artist.findUnique({
      where: { userId },
      select: { heroImageUrl: true, bioPhotoUrl: true, artworkImages: { select: { url: true } } },
    }),
    prisma.place.findFirst({
      where: placeAccessWhere(userId),
      select: { heroImageUrl: true, thumbnailImageUrl: true, galleryImages: true },
    }),
  ]);

  if (artist) {
    if (artist.heroImageUrl === url || artist.bioPhotoUrl === url) return true;
    if (artist.artworkImages.some((i) => i.url === url)) return true;
  }
  if (place) {
    if (place.heroImageUrl === url || place.thumbnailImageUrl === url) return true;
    if (place.galleryImages.includes(url)) return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const focus = await prisma.imageFocus.findUnique({ where: { url }, select: { x: true, y: true, scale: true } });
  return NextResponse.json({ focus });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { url, x, y, scale } = body ?? {};
  if (
    typeof url !== "string" ||
    typeof x !== "number" ||
    typeof y !== "number" ||
    typeof scale !== "number"
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!(await ownsUrl(session.user.id, url))) {
    return NextResponse.json({ error: "You can only adjust framing on your own images" }, { status: 403 });
  }

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  const data = { x: clamp(x, 0, 100), y: clamp(y, 0, 100), scale: clamp(scale, 1, 3), manual: true };

  await prisma.imageFocus.upsert({
    where: { url },
    create: { url, ...data },
    update: data,
  });

  return NextResponse.json({ ok: true });
}
