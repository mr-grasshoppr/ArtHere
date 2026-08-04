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

// Deliberately creates an artist profile from admin. Unlike Place, Artist.userId
// is required — there's no lazy/deferred-owner path — so this takes an email
// up front and provisions (or reuses) the account immediately, the same way
// attachPlaceUser does for organizations, just not deferrable.
export async function createArtist(name: string, email: string): Promise<string> {
  await requireAdmin();
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedName) throw new Error("Name is required");
  if (!trimmedEmail) throw new Error("An email is required to create an artist profile");

  const user = await prisma.user.upsert({
    where: { email: trimmedEmail },
    create: { email: trimmedEmail },
    update: {},
  });
  if (await prisma.artist.findUnique({ where: { userId: user.id } })) {
    throw new Error("That email is already linked to another artist profile.");
  }

  const slug = await uniqueArtistSlug(trimmedName);
  const artist = await prisma.artist.create({
    data: { name: trimmedName, slug, userId: user.id, isPlaceholder: true },
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
