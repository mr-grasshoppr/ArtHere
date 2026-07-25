"use server";

import { prisma } from "@/lib/db";
import { PlaceRelationship } from "@prisma/client";
import { sendMagicLink } from "@/lib/magic-link";
import { requireAdmin } from "@/lib/admin";
import { snapshotArtist } from "@/lib/profile-revision";

export async function sendArtistInvite(artistId: string) {
  await requireAdmin();
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    include: { user: true },
  });
  if (!artist) throw new Error("Artist not found");
  await sendMagicLink({ email: artist.user.email, artistId, artistName: artist.name });
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
  placeRelations: { placeId: string; relationship: string; relationshipLabel?: string }[];
};

export async function updateArtistProfile(artistId: string, data: ProfileInput) {
  const session = await requireAdmin();

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

  // Replace place relations. Only real-place (placeId) rows are managed here —
  // leave the artist's own name-only venue mentions (placeId null) untouched so
  // an admin edit never silently drops them.
  await prisma.artistPlace.deleteMany({ where: { artistId, placeId: { not: null } } });
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
        relationshipLabel: r.relationshipLabel?.trim() || null,
      })),
    });
  }

  await snapshotArtist(artistId, "admin", session.user?.email);
  return artist;
}

export async function setHeroImage(artistId: string, imageId: string) {
  const session = await requireAdmin();
  const image = await prisma.artworkImage.findUnique({ where: { id: imageId } });
  if (!image || image.artistId !== artistId) throw new Error("Image not found");

  await prisma.artworkImage.updateMany({ where: { artistId }, data: { isHero: false } });
  await prisma.artworkImage.update({ where: { id: imageId }, data: { isHero: true } });
  await prisma.artist.update({ where: { id: artistId }, data: { heroImageUrl: image.url } });
  await snapshotArtist(artistId, "admin", session.user?.email);
}

export async function deleteImage(artistId: string, imageId: string) {
  const session = await requireAdmin();
  const image = await prisma.artworkImage.findUnique({ where: { id: imageId } });
  if (!image || image.artistId !== artistId) throw new Error("Image not found");
  await prisma.artworkImage.delete({ where: { id: imageId } });
  if (image.isHero) {
    const next = await prisma.artworkImage.findFirst({ where: { artistId }, orderBy: { sortOrder: "asc" } });
    await prisma.artist.update({ where: { id: artistId }, data: { heroImageUrl: next?.url ?? null } });
  }
  await snapshotArtist(artistId, "admin", session.user?.email);
}

export async function setBioPhoto(artistId: string, url: string) {
  const session = await requireAdmin();
  await prisma.artist.update({ where: { id: artistId }, data: { bioPhotoUrl: url } });
  await snapshotArtist(artistId, "admin", session.user?.email);
}
