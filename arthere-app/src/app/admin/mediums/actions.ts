"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { parseMediumList } from "@/lib/artist-options";
import { snapshotArtist } from "@/lib/profile-revision";

// Approve a pending label — the only thing that moves it into
// getMediumOptions()'s result, and so into every selectable medium list.
export async function approveMediumOption(id: string) {
  await requireAdmin();
  await prisma.mediumOption.update({ where: { id }, data: { approved: true } });
  revalidatePath("/admin/mediums");
}

// Reject a pending label. A hard delete, not a status flag — nothing else
// references MediumOption rows by id (artists/artwork store the medium as
// plain strings), so there's no dangling reference to worry about, and it
// frees the label to be resubmitted later if someone means it seriously.
export async function rejectMediumOption(id: string) {
  await requireAdmin();
  await prisma.mediumOption.delete({ where: { id } });
  revalidatePath("/admin/mediums");
}

// Remove an already-approved option — the general cleanup tool for a label
// that shouldn't have made it into the vocabulary (a typo, a near-duplicate,
// something that only makes sense for one artist). Same "no dangling
// reference" reasoning as rejectMediumOption.
export async function deleteMediumOption(id: string) {
  await requireAdmin();
  await prisma.mediumOption.delete({ where: { id } });
  revalidatePath("/admin/mediums");
}

// Turn an orphaned free-text value (one that's neither pending nor approved
// — see the "Unrecognized values" section) into a real, approved option in
// one step. For a value that turns out to be legitimate (e.g. "Jewelry",
// used by real artists but never actually added to the vocabulary) rather
// than junk — the admin reviewing it here already IS the approval.
export async function promoteMediumOption(label: string) {
  await requireAdmin();
  const trimmed = label.trim();
  if (!trimmed) return;
  const count = await prisma.mediumOption.count();
  await prisma.mediumOption.upsert({
    where: { label: trimmed },
    create: { label: trimmed, sortOrder: count, approved: true },
    update: { approved: true },
  });
  revalidatePath("/admin/mediums");
}

// Pull one label off one artist's overall profile medium — for cleaning up
// a specific bad tag (e.g. a materials list someone typed into "Other")
// without touching the rest of their profile or reopening the full editor.
// Case-insensitive match, same as how the medium field is parsed everywhere
// else (see parseMediumList / registerMediumOptions).
export async function removeMediumFromArtist(artistId: string, label: string) {
  const session = await requireAdmin();
  const artist = await prisma.artist.findUnique({ where: { id: artistId }, select: { medium: true } });
  if (!artist) throw new Error("Artist not found");

  const next = parseMediumList(artist.medium).filter((m) => m.toLowerCase() !== label.toLowerCase());
  await prisma.artist.update({ where: { id: artistId }, data: { medium: next.join(", ") } });
  await snapshotArtist(artistId, "admin", session.user?.email);
  revalidatePath("/admin/mediums");
}

// Pull one label off one piece of artwork — same idea as
// removeMediumFromArtist, but for a tag an artist (or admin) applied to a
// specific image rather than their profile as a whole.
export async function removeMediumFromArtwork(imageId: string, label: string) {
  await requireAdmin();
  const image = await prisma.artworkImage.findUnique({ where: { id: imageId }, select: { medium: true } });
  if (!image) throw new Error("Image not found");

  const next = image.medium.filter((m) => m.toLowerCase() !== label.toLowerCase());
  await prisma.artworkImage.update({ where: { id: imageId }, data: { medium: next } });
  revalidatePath("/admin/mediums");
}
