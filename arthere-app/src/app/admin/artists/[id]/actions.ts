"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PlaceRelationship } from "@prisma/client";

const ADMIN_EMAIL = "maryannamail@gmail.com";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    throw new Error("Unauthorized");
  }
}

export async function addNote(artistId: string, body: string) {
  await requireAdmin();
  return prisma.adminNote.create({ data: { artistId, body } });
}

export async function deleteNote(noteId: string) {
  await requireAdmin();
  await prisma.adminNote.delete({ where: { id: noteId } });
}

type ProfileInput = {
  name: string;
  bio: string;
  medium: string;
  neighborhood: string;
  hireFor: string;
  website: string;
  instagram: string;
  placeRelations: { placeId: string; relationship: string }[];
};

export async function updateArtistProfile(artistId: string, data: ProfileInput) {
  await requireAdmin();

  const artist = await prisma.artist.update({
    where: { id: artistId },
    data: {
      name: data.name.trim(),
      bio: data.bio.trim() || null,
      medium: data.medium.trim() || null,
      neighborhood: data.neighborhood.trim() || null,
      hireFor: data.hireFor.trim() || null,
      website: data.website.trim() || null,
      instagram: data.instagram.trim().replace(/^@/, "") || null,
    },
  });

  // Replace place relations
  await prisma.artistPlace.deleteMany({ where: { artistId } });
  const validRelations = data.placeRelations.filter((r) => r.placeId && r.relationship);
  const seen = new Set<string>();
  const deduped = validRelations.filter((r) => {
    const key = `${r.placeId}:${r.relationship}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (deduped.length > 0) {
    await prisma.artistPlace.createMany({
      data: deduped.map((r) => ({
        artistId,
        placeId: r.placeId,
        relationship: r.relationship as PlaceRelationship,
      })),
    });
  }

  return artist;
}

export async function setHeroImage(artistId: string, imageId: string) {
  await requireAdmin();
  const image = await prisma.artworkImage.findUnique({ where: { id: imageId } });
  if (!image || image.artistId !== artistId) throw new Error("Image not found");

  await prisma.artworkImage.updateMany({ where: { artistId }, data: { isHero: false } });
  await prisma.artworkImage.update({ where: { id: imageId }, data: { isHero: true } });
  await prisma.artist.update({ where: { id: artistId }, data: { heroImageUrl: image.url } });
}

export async function deleteImage(artistId: string, imageId: string) {
  await requireAdmin();
  const image = await prisma.artworkImage.findUnique({ where: { id: imageId } });
  if (!image || image.artistId !== artistId) throw new Error("Image not found");
  await prisma.artworkImage.delete({ where: { id: imageId } });
  if (image.isHero) {
    const next = await prisma.artworkImage.findFirst({ where: { artistId }, orderBy: { sortOrder: "asc" } });
    await prisma.artist.update({ where: { id: artistId }, data: { heroImageUrl: next?.url ?? null } });
  }
}

export async function setBioPhoto(artistId: string, url: string) {
  await requireAdmin();
  await prisma.artist.update({ where: { id: artistId }, data: { bioPhotoUrl: url } });
}
