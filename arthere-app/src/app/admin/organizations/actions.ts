"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { createPlaceInvitePreview, sendPlaceInviteEmail, sendPlaceMagicLink, type InvitePreview } from "@/lib/magic-link";
import { snapshotPlace } from "@/lib/profile-revision";
import { slugify } from "@/lib/slug";
import { joinNeighborhoodList, parseNeighborhoodList } from "@/lib/neighborhoods";
import { LinkType } from "@prisma/client";

async function uniquePlaceSlug(name: string): Promise<string> {
  const base = slugify(name) || "venue";
  let slug = base;
  let i = 1;
  while (await prisma.place.findUnique({ where: { slug } })) slug = `${base}-${i++}`;
  return slug;
}

// Ensure the organization has a linked user account — required for the
// magic-link edit flow (see /profile/setup, which reads place.userId). Creates
// one from the email if the org doesn't have an owner yet.
async function attachPlaceUser(placeId: string, email: string): Promise<string> {
  const place = await prisma.place.findUnique({ where: { id: placeId }, select: { userId: true } });
  if (place?.userId) return place.userId;

  const user = await prisma.user.upsert({ where: { email }, create: { email }, update: {} });
  try {
    await prisma.place.update({ where: { id: placeId }, data: { userId: user.id } });
  } catch {
    throw new Error("That email is already linked to another page. Use a different email.");
  }
  return user.id;
}

export async function createOrganization(name: string): Promise<string> {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required");
  const slug = await uniquePlaceSlug(trimmed);
  // Every org needs a city even before it's connected to any artist — a
  // place's Community-directory listing depends on its own cityId, not on
  // artist connections (see cities/[slug]/community/page.tsx). Only one
  // real (non-demo) city exists today, so default to it; revisit with an
  // explicit picker once there's more than one to choose from.
  const defaultCity = await prisma.city.findFirst({ where: { slug: { not: { endsWith: "-demo" } } } });
  const place = await prisma.place.create({
    data: { name: trimmed, slug, inDirectory: false, cityId: defaultCity?.id },
  });
  return place.id;
}

type OrgInput = {
  name: string;
  neighborhood: string;
  description: string;
  quote: string;
  quoteAttribution: string;
  links: { type: string; url: string; label?: string }[];
  email: string;
  heroImageUrl: string | null;
  thumbnailImageUrl: string | null;
  galleryImages: string[];
};

export async function updateOrganization(placeId: string, data: OrgInput) {
  const session = await requireAdmin();

  await prisma.place.update({
    where: { id: placeId },
    data: {
      name: data.name.trim(),
      neighborhood: joinNeighborhoodList(parseNeighborhoodList(data.neighborhood)),
      description: data.description.trim() || null,
      quote: data.quote.trim() || null,
      quoteAttribution: data.quoteAttribution.trim() || null,
      heroImageUrl: data.heroImageUrl,
      thumbnailImageUrl: data.thumbnailImageUrl,
      // Gallery is capped at 3 — enforced here too in case a caller sends more.
      galleryImages: data.galleryImages.slice(0, 3),
    },
  });

  // Replace all links — mirrors updateArtistProfile's links block exactly.
  await prisma.placeLink.deleteMany({ where: { placeId } });
  const validLinks = data.links.filter((l) => l.url.trim() && l.type);
  if (validLinks.length > 0) {
    await prisma.placeLink.createMany({
      data: validLinks.map((l, i) => ({
        placeId,
        type: l.type as LinkType,
        url: l.url.trim(),
        label: l.label?.trim() || null,
        sortOrder: i,
      })),
    });
  }

  const email = data.email.trim().toLowerCase();
  if (email) await attachPlaceUser(placeId, email);

  await snapshotPlace(placeId, "admin", session.user?.email);
}

// Live/hidden switch — inDirectory controls whether the org shows in the public
// Community directory.
export async function setPlaceVisibility(placeId: string, inDirectory: boolean) {
  await requireAdmin();
  await prisma.place.update({
    where: { id: placeId },
    data: {
      inDirectory,
      // Publishing consumes the pending review request, if any — mirrors
      // setArtistPlaceholder.
      ...(inDirectory ? { submittedForReviewAt: null } : {}),
    },
  });
}

// Tucks pages out of the default admin list and unconditionally out of
// public pages (community directory, sitemap, venue typeahead), independent
// of inDirectory — mirrors Artist.isArchived.
export async function setPlacesArchived(placeIds: string[], isArchived: boolean) {
  await requireAdmin();
  if (placeIds.length === 0) return;
  await prisma.place.updateMany({ where: { id: { in: placeIds } }, data: { isArchived } });
  revalidatePath("/admin/organizations");
  revalidatePath("/cities/portland/community");
}

export async function addPlaceNote(placeId: string, body: string) {
  await requireAdmin();
  return prisma.adminNote.create({ data: { placeId, body } });
}

export async function deletePlaceNote(noteId: string) {
  await requireAdmin();
  await prisma.adminNote.delete({ where: { id: noteId } });
}

// Provision the owner account (if needed) and mint the first-time onboarding
// link (the 'welcome' variant → /place/setup) — nothing is emailed yet, the
// admin previews/edits the message first (see InvitePreviewModal).
export async function previewPlaceInvite(placeId: string, email: string): Promise<InvitePreview> {
  await requireAdmin();
  const clean = email.trim().toLowerCase();
  if (!clean) throw new Error("An email is required to send an invite");
  const place = await prisma.place.findUnique({ where: { id: placeId } });
  if (!place) throw new Error("Organization not found");
  await attachPlaceUser(placeId, clean);
  return createPlaceInvitePreview({ email: clean, placeId, placeName: place.name });
}

export async function sendPlaceInvite(
  placeId: string,
  preview: { email: string; link: string; subject: string; bodyText: string; greetingName?: string | null }
) {
  await requireAdmin();
  const place = await prisma.place.findUnique({ where: { id: placeId } });
  if (!place) throw new Error("Organization not found");
  await sendPlaceInviteEmail({ placeId, placeName: place.name, ...preview });
}

// Team management — additional editors beyond the primary owner (see
// PlaceMember in schema.prisma / placeAccessWhere in lib/place-access.ts).
// The org itself can do the same via /api/place/team; these are the admin
// equivalents, sending the invite directly rather than through the
// editable-preview flow above (which is reserved for the first-time
// onboarding message).
export async function addPlaceTeamMember(placeId: string, email: string) {
  await requireAdmin();
  const clean = email.trim().toLowerCase();
  if (!clean) throw new Error("An email is required");

  const place = await prisma.place.findUnique({ where: { id: placeId } });
  if (!place) throw new Error("Organization not found");

  const user = await prisma.user.upsert({ where: { email: clean }, create: { email: clean }, update: {} });
  if (user.id === place.userId) throw new Error(`${clean} already has access to this page.`);

  await prisma.placeMember.upsert({
    where: { placeId_userId: { placeId, userId: user.id } },
    create: { placeId, userId: user.id },
    update: {},
  });

  await sendPlaceMagicLink({ email: clean, placeId, placeName: place.name, variant: "welcome" });
  revalidatePath(`/admin/organizations/${placeId}`);
  return { userId: user.id, email: clean };
}

export async function removePlaceTeamMember(placeId: string, userId: string) {
  await requireAdmin();
  const place = await prisma.place.findUnique({ where: { id: placeId }, select: { userId: true } });
  if (place?.userId === userId) throw new Error("The page's owner can't be removed here.");
  await prisma.placeMember.deleteMany({ where: { placeId, userId } });
  revalidatePath(`/admin/organizations/${placeId}`);
}
