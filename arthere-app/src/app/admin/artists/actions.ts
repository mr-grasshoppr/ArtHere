"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/slug";

async function uniqueArtistSlug(name: string): Promise<string> {
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
  const artist = await prisma.artist.create({
    data: { name: trimmedName, slug, isPlaceholder: true },
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
  await prisma.artist.update({ where: { id: artistId }, data: { isPlaceholder } });
  // The admin list and the public city pages both read this flag.
  revalidatePath("/admin/artists");
  revalidatePath("/cities/portland");
  revalidatePath("/cities/portland/artists");
}
