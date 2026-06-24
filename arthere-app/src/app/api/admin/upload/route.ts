import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";
import { tagArtworkImage } from "@/lib/claude";
import { Prisma } from "@prisma/client";

const ADMIN_EMAIL = "maryannamail@gmail.com";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const artistId = formData.get("artistId") as string | null;
  const isHero = formData.get("isHero") === "true";
  const isBioPhoto = formData.get("isBioPhoto") === "true";

  if (!file || !artistId) {
    return NextResponse.json({ error: "Missing file or artistId" }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 20 MB)." }, { status: 400 });
  }

  const artist = await prisma.artist.findUnique({ where: { id: artistId } });
  if (!artist) return NextResponse.json({ error: "Artist not found" }, { status: 404 });

  const filename = `artists/${artist.slug}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const blob = await put(filename, file, { access: "public", addRandomSuffix: false });

  if (isBioPhoto) {
    await prisma.artist.update({ where: { id: artistId }, data: { bioPhotoUrl: blob.url } });
    return NextResponse.json({ url: blob.url, isBioPhoto: true });
  }

  const existingCount = await prisma.artworkImage.count({ where: { artistId } });
  const image = await prisma.artworkImage.create({
    data: { artistId, url: blob.url, sortOrder: existingCount, isHero },
  });

  if (isHero) {
    await prisma.artist.update({ where: { id: artistId }, data: { heroImageUrl: blob.url } });
  }

  tagArtworkImage(blob.url)
    .then(async (tags) => {
      await prisma.artworkImage.update({
        where: { id: image.id },
        data: { aiTags: tags as unknown as Prisma.InputJsonValue, aiTaggedAt: new Date() },
      });
    })
    .catch(() => {});

  return NextResponse.json({ id: image.id, url: blob.url, isHero });
}
