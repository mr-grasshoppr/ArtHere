"use server";

import { prisma } from "@/lib/db";
import { LinkType, PlaceRelationship } from "@prisma/client";
import { createArtistInvitePreview, sendArtistInviteEmail, artistGreetingName, type InvitePreview } from "@/lib/magic-link";
import { requireAdmin } from "@/lib/admin";
import { snapshotArtist } from "@/lib/profile-revision";
import { buildHireForText, parseMediumList } from "@/lib/artist-options";
import { registerMediumOptions } from "@/lib/medium-options";
import { normalizeNeighborhood } from "@/lib/neighborhoods";
import { normalizeLinkUrl } from "@/lib/social-link";

// Attaches (or reuses) an owner account for an artist that doesn't have one
// yet — a profile created bare via "+ New artist" has no userId until an
// admin sends an invite. Mirrors attachPlaceUser exactly.
export async function attachArtistUser(artistId: string, email: string): Promise<string> {
  const artist = await prisma.artist.findUnique({ where: { id: artistId }, select: { userId: true } });
  if (artist?.userId) return artist.userId;

  const user = await prisma.user.upsert({ where: { email }, create: { email }, update: {} });
  try {
    await prisma.artist.update({ where: { id: artistId }, data: { userId: user.id } });
  } catch {
    throw new Error("That email is already linked to another artist profile. Use a different email.");
  }
  return user.id;
}

// Corrects an artist's owner email from the profile editor — distinct from
// attachArtistUser, which only ever fills in a *missing* owner and silently
// no-ops if one is already set. That left no way to fix a wrong address
// (e.g. a placeholder like name@placeholder.arthere.local) without also
// changing who owns the profile: the admin edits the field, but the linked
// User row's email never moved, so the detail page kept showing the old one
// forever. This always updates the currently-linked account's own email; if
// there's no owner yet, it attaches one (same behavior as attachArtistUser).
export async function setArtistEmail(artistId: string, email: string) {
  const session = await requireAdmin();
  const clean = email.trim().toLowerCase();
  if (!clean) return;

  const artist = await prisma.artist.findUnique({ where: { id: artistId }, select: { userId: true } });
  if (!artist) throw new Error("Artist not found");

  if (artist.userId) {
    try {
      await prisma.user.update({ where: { id: artist.userId }, data: { email: clean } });
    } catch {
      throw new Error(`${clean} is already used by another account.`);
    }
  } else {
    await attachArtistUser(artistId, clean);
  }
  await snapshotArtist(artistId, "admin", session.user?.email);
}

// Mints the one-time login link and the default email copy, but sends
// nothing yet — the admin previews/edits it first (see InvitePreviewModal).
export async function previewArtistInvite(artistId: string, email: string): Promise<InvitePreview> {
  await requireAdmin();
  const clean = email.trim().toLowerCase();
  if (!clean) throw new Error("An email is required to send an invite");
  const artist = await prisma.artist.findUnique({ where: { id: artistId } });
  if (!artist) throw new Error("Artist not found");
  await attachArtistUser(artistId, clean);
  return createArtistInvitePreview({ email: clean, artistId, artistName: artistGreetingName(artist) });
}

export async function sendArtistInvite(
  artistId: string,
  preview: { email: string; link: string; subject: string; bodyText: string; greetingName?: string | null }
) {
  await requireAdmin();
  const artist = await prisma.artist.findUnique({ where: { id: artistId } });
  if (!artist) throw new Error("Artist not found");
  await sendArtistInviteEmail({ artistId, artistName: artistGreetingName(artist), ...preview });
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
  firstName: string;
  lastName: string;
  bio: string;
  quote: string;
  quoteAttribution: string;
  otherConnections: { name: string; relationship: string; relationshipLabel?: string }[];
  medium: string;
  neighborhood: string;
  offerings: string[];
  placeRelations: { placeId?: string; venueName?: string; relationship: string; relationshipLabel?: string }[];
  links: { type: string; url: string; label?: string }[];
};

export async function updateArtistProfile(artistId: string, data: ProfileInput) {
  const session = await requireAdmin();

  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();
  // name stays in sync with firstName/lastName — everything else in the app
  // (display, slug, search, CSV) keeps reading this single field unchanged.
  const name = [firstName, lastName].filter(Boolean).join(" ");
  const medium = data.medium.trim() || null;

  // Any medium typed that isn't a known option yet (via the free-text
  // "Other" field) becomes a real, shared option going forward.
  if (medium) {
    await registerMediumOptions(parseMediumList(medium));
  }

  const artist = await prisma.artist.update({
    where: { id: artistId },
    data: {
      name,
      firstName,
      lastName: lastName || null,
      bio: data.bio.trim() || null,
      quote: data.quote.trim() || null,
      quoteAttribution: data.quoteAttribution.trim() || null,
      medium,
      neighborhood: data.neighborhood.trim() ? normalizeNeighborhood(data.neighborhood.trim()) : null,
      offerings: data.offerings.map((o) => o.trim()).filter(Boolean),
      hireFor: buildHireForText(data.offerings),
    },
  });

  // Replace all other connections.
  await prisma.artistOtherConnection.deleteMany({ where: { artistId } });
  const validConnections = data.otherConnections.filter((c) => c.name.trim() && c.relationship);
  if (validConnections.length > 0) {
    await prisma.artistOtherConnection.createMany({
      data: validConnections.map((c, i) => ({
        artistId,
        name: c.name.trim(),
        relationship: c.relationship as PlaceRelationship,
        relationshipLabel: c.relationshipLabel?.trim() || null,
        sortOrder: i,
      })),
    });
  }

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
        url: normalizeLinkUrl(l.url),
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

// The public profile's gallery is the first 3 non-hero images by sortOrder
// (see ArtistProfilePage) — this lets an admin pin a specific image into one
// of those 3 slots directly, instead of only being able to influence it via
// upload order. Hero has its own dedicated control (setHeroImage above), so
// this only ever touches non-hero images.
export async function setGalleryPosition(
  artistId: string,
  imageId: string,
  position: number
): Promise<{ id: string; sortOrder: number }[]> {
  const session = await requireAdmin();
  if (![1, 2, 3].includes(position)) throw new Error("Position must be 1, 2, or 3");

  const images = await prisma.artworkImage.findMany({
    where: { artistId, isHero: false },
    orderBy: { sortOrder: "asc" },
  });
  const target = images.find((i) => i.id === imageId);
  if (!target) throw new Error("Image not found (or it's the hero image)");

  const rest = images.filter((i) => i.id !== imageId);
  rest.splice(position - 1, 0, target);

  await prisma.$transaction(
    rest.map((img, i) => prisma.artworkImage.update({ where: { id: img.id }, data: { sortOrder: i } }))
  );
  await snapshotArtist(artistId, "admin", session.user?.email);

  return rest.map((img, i) => ({ id: img.id, sortOrder: i }));
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
