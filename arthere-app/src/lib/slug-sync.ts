import { prisma } from "@/lib/db";
import { slugify, isPlaceholderSlug } from "@/lib/slug";

/**
 * Slugs are minted when a profile is created, often before it has a real name
 * ("new-artist-5"). Once the name is filled in, swap a placeholder slug for one
 * built from the name. A slug that already reads as a real name is left alone —
 * renaming those would break links people have already shared.
 *
 * Returns `{ slug }` to spread into the update's data, or `{}` for no change.
 */
export async function slugUpdateFor(
  kind: "artist" | "place",
  id: string,
  name: string,
): Promise<{ slug?: string }> {
  const base = slugify(name);
  if (!base) return {};
  const row =
    kind === "artist"
      ? await prisma.artist.findUnique({ where: { id }, select: { slug: true } })
      : await prisma.place.findUnique({ where: { id }, select: { slug: true } });
  if (!row || !isPlaceholderSlug(row.slug)) return {};

  const taken = async (slug: string) =>
    kind === "artist"
      ? !!(await prisma.artist.findFirst({ where: { slug, id: { not: id } }, select: { id: true } }))
      : !!(await prisma.place.findFirst({ where: { slug, id: { not: id } }, select: { id: true } }));
  let slug = base;
  let i = 1;
  while (await taken(slug)) slug = `${base}-${i++}`;
  return slug === row.slug ? {} : { slug };
}
