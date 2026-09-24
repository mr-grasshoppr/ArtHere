"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

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
