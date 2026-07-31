"use server";

import { prisma } from "@/lib/db";
import { LinkType, PlaceRelationship } from "@prisma/client";
import { createArtistInvitePreview, sendArtistInviteEmail, type InvitePreview } from "@/lib/magic-link";
import { requireAdmin } from "@/lib/admin";
import { snapshotArtist } from "@/lib/profile-revision";
import { buildHireForText } from "@/lib/artist-options";

// Mints the one-time login link and the default email copy, but sends
// nothing yet — the admin previews/edits it first (see InvitePreviewModal).
export async function previewArtistInvite(artistId: string): Promise<InvitePreview> {
  await requireAdmin();
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    include: { user: true },
  });
  if (!artist) throw new Error("Artist not found");
  return createArtistInvitePreview({ email: artist.user.email, artistId, artistName: artist.name });
}

export async function sendArtistInvite(
  artistId: string,
  preview: { email: string; link: string; subject: string; bodyText: string }
) {
  await requireAdmin();
  const artist = await prisma.artist.findUnique({ where: { id: artistId } });
  if (!artist) throw new Error("Artist not found");
  await sendArtistInviteEmail({ artistId, artistName: artist.name, ...preview });
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
  offerings: string[];
  placeRelations: { placeId?: string; venueName?: string; relationship: string; relationshipLabel?: string }[];
  links: { type: string; url: string; label?: string }[];
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
      offerings: data.offerings.map((o) => o.trim()).filter(Boolean),
      hireFor: buildHireForText(data.offerings),
    },
  });

  // Replace all place relations — the editor now manages both real-place
  // (placeId) rows and free-text (venueName) rows for venues with no page yet.
  await prisma.artistPlace.deleteMany({ where: { artistId } });
  const validRelations = data.placeRelations.filter(
    (r) => (r.placeId?.trim() || r.venueName?.trim()) && r.relationship
  );
  const seen = new Set<string>();
  const deduped = validRelations.filter((r) => {
    const key = `${r.placeId ?? ""}:${r.venueName?.trim().toLowerCase() ?? ""}:${r.relationship}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (deduped.length > 0) {
    await prisma.artistPlace.createMany({
      data: deduped.map((r) => ({
        artistId,
        placeId: r.placeId?.trim() || null,
        venueName: r.placeId?.trim() ? null : r.venueName?.trim() || null,
        relationship: r.relationship as PlaceRelationship,
        relationshipLabel: r.relationshipLabel?.trim() || null,
      })),
    });
  }

  // Replace all links.
  await prisma.artistLink.deleteMany({ where: { artistId } });
  const validLinks = data.links.filter((l) => l.url.trim() && l.type);
  if (validLinks.length > 0) {
    await prisma.artistLink.createMany({
      data: validLinks.map((l, i) => ({
        artistId,
        type: l.type as LinkType,
        url: l.url.trim(),
        label: l.label?.trim() || null,
        sortOrder: i,
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

// Hand-correct a mistagged image — the artwork page filters by this field.
export async function setArtworkMedium(artistId: string, imageId: string, medium: string[]) {
  await requireAdmin();
  const image = await prisma.artworkImage.findUnique({ where: { id: imageId } });
  if (!image || image.artistId !== artistId) throw new Error("Image not found");
  await prisma.artworkImage.update({ where: { id: imageId }, data: { medium } });
}
