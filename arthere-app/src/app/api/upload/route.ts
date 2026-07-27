import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";
import { tagArtworkImage, detectArtworkCrop } from "@/lib/claude";
import { archiveOriginal } from "@/lib/originals";
import { Prisma } from "@prisma/client";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find this user's artist record
  const artist = await prisma.artist.findUnique({
    where: { userId: session.user.id },
  });
  if (!artist) {
    return NextResponse.json({ error: "Artist profile not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const isHero = formData.get("isHero") === "true";
  const isBioPhoto = formData.get("isBioPhoto") === "true";
  const altText = formData.get("altText") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "File type not supported. Please upload a JPEG, PNG, or WebP." }, { status: 400 });
  }

  // Max 20 MB
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Maximum size is 20 MB." }, { status: 400 });
  }

  // Preserve the raw upload immutably before any processing (see lib/originals).
  const rawBuffer = Buffer.from(await file.arrayBuffer());
  waitUntil(archiveOriginal(rawBuffer, file.name, `artists/${artist.slug}`, file.type));

  // For bio photos: smart-crop to a square centered on the face
  let uploadBody: File | Buffer = file;
  let uploadContentType = file.type;
  if (isBioPhoto) {
    uploadBody = await sharp(rawBuffer)
      .resize(600, 600, { fit: "cover", position: "attention" })
      .jpeg({ quality: 88 })
      .toBuffer();
    uploadContentType = "image/jpeg";
  }

  // Upload to Vercel Blob
  const ext = isBioPhoto ? "jpg" : file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `artists/${artist.slug}/${Date.now()}-${isBioPhoto ? "bio.jpg" : ext}`;
  const blob = await put(filename, uploadBody, {
    access: "public",
    addRandomSuffix: false,
    contentType: uploadContentType,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });

  // Bio photo: update artist record only, no ArtworkImage row
  if (isBioPhoto) {
    await prisma.artist.update({
      where: { id: artist.id },
      data: { bioPhotoUrl: blob.url },
    });
    return NextResponse.json({ url: blob.url, isBioPhoto: true });
  }

  // Determine sort order
  const existingCount = await prisma.artworkImage.count({ where: { artistId: artist.id } });

  // Save image record
  const image = await prisma.artworkImage.create({
    data: {
      artistId: artist.id,
      url: blob.url,
      altText: altText ?? null,
      sortOrder: existingCount,
      isHero,
    },
  });

  // If this is the hero image, update artist record too
  if (isHero) {
    await prisma.artist.update({
      where: { id: artist.id },
      data: { heroImageUrl: blob.url },
    });
  }

  // AI tagging + crop detection run after the response is sent. waitUntil
  // keeps the serverless function alive until they finish — a bare
  // fire-and-forget promise would be frozen (and often lost) once the
  // response returns on Vercel.
  waitUntil(
    tagArtworkImage(blob.url)
      .then(async (tags) => {
        await prisma.artworkImage.update({
          where: { id: image.id },
          data: { aiTags: tags as unknown as Prisma.InputJsonValue, aiTaggedAt: new Date() },
        });
      })
      .catch((err) => {
        console.error("AI tagging failed for image", image.id, err);
      })
  );

  waitUntil(
    detectArtworkCrop(blob.url)
      .then(async (cropBox) => {
        if (!cropBox) return;
        await prisma.artworkImage.update({
          where: { id: image.id },
          data: { cropBox: cropBox as unknown as Prisma.InputJsonValue },
        });
      })
      .catch((err) => {
        console.error("Crop detection failed for image", image.id, err);
      })
  );

  return NextResponse.json({
    id: image.id,
    url: blob.url,
    isHero,
    tagging: "in_progress",
  });
}
