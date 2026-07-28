"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

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
