"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/slug";

export async function uniqueArtistSlug(name: string): Promise<string> {
  const base = slugify(name) || "artist";
  let slug = base;
  let i = 1;
  while (await prisma.artist.findUnique({ where: { slug } })) slug = `${base}-${i++}`;
  return slug;
}

// Deliberately creates a bare artist profile from admin — no owner account
// required. Mirrors createOrganization: a prototype page an admin can build
// out and share (e.g. to pitch an artist) before anyone's agreed to anything.
// An owner email can be attached later via the invite flow.
export async function createArtist(name: string): Promise<string> {
  await requireAdmin();
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Name is required");

  const slug = await uniqueArtistSlug(trimmedName);
  // Without a cityId the artist never matches any city-scoped page's query
  // (see lib/city-scope.ts) — publishing it later would silently leave it
  // invisible on the artwork/artists/network pages despite being live.
  const portland = await prisma.city.findUnique({ where: { slug: "portland" } });
  // Best-effort split for this one-shot admin quick-add — the full editor
  // (with real First/Last fields) is where this gets corrected for real.
  const nameParts = trimmedName.split(/\s+/);
  const artist = await prisma.artist.create({
    data: {
      name: trimmedName,
      firstName: nameParts[0],
      lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : null,
      slug,
      isPlaceholder: true,
      cityId: portland?.id ?? null,
    },
  });
  return artist.id;
}

/**
 * Toggle a profile's public visibility. `isPlaceholder: true` hides it from the
 * real Portland site (see lib/city-scope.ts); `false` makes it live. Exposed
 * as a one-click switch in the admin artists list.
 */
export async function setArtistPlaceholder(artistId: string, isPlaceholder: boolean) {
  await requireAdmin();
  await prisma.artist.update({
    where: { id: artistId },
    data: {
      isPlaceholder,
      // Publishing consumes the pending review request, if any.
      ...(isPlaceholder ? {} : { submittedForReviewAt: null }),
    },
  });
  // The admin list and the public city pages both read this flag.
  revalidatePath("/admin/artists");
  revalidatePath("/cities/portland");
  revalidatePath("/cities/portland/artists");
}

/**
 * Tucks profiles out of the default admin list and unconditionally out of
 * public pages (see artistScopeWhere in lib/city-scope.ts), independent of
 * isPlaceholder — archiving doesn't change whatever Live/Hidden state a
 * profile had, so unarchiving restores it exactly as it was.
 */
export async function setArtistsArchived(artistIds: string[], isArchived: boolean) {
  await requireAdmin();
  if (artistIds.length === 0) return;
  await prisma.artist.updateMany({ where: { id: { in: artistIds } }, data: { isArchived } });
  revalidatePath("/admin/artists");
  revalidatePath("/cities/portland");
  revalidatePath("/cities/portland/artists");
}
