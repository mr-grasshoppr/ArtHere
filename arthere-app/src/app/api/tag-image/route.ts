// Manual trigger to (re)tag an artwork image with Claude Vision.
// Used by admin tooling or when auto-tagging fails at upload time.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { tagArtworkImage } from "@/lib/claude";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageId } = await req.json();
  if (!imageId) {
    return NextResponse.json({ error: "imageId required" }, { status: 400 });
  }

  // Verify the image belongs to this user's artist
  const image = await prisma.artworkImage.findUnique({
    where: { id: imageId },
    include: { artist: true },
  });

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  if (image.artist.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tags = await tagArtworkImage(image.url);
  await prisma.artworkImage.update({
    where: { id: imageId },
    data: { aiTags: tags as unknown as Prisma.InputJsonValue, aiTaggedAt: new Date() },
  });

  return NextResponse.json({ tags });
}
