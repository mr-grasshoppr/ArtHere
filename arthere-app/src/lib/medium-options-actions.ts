"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

// Admin-only: mint a new medium label on the fly (e.g. an admin tagging
// artwork hits a piece that's neither Painting nor Sculpture but
// "Printmaking"). Saved as unapproved — same as a label typed into an
// artist's free-text "Other" field — so it doesn't become selectable
// everywhere until reviewed at /admin/mediums. It IS included in the
// returned list so it stays usable/selected for the artwork being tagged
// right now, in this admin's own session.
export async function addMediumOption(label: string): Promise<string[]> {
  await requireAdmin();
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Label is required");

  const count = await prisma.mediumOption.count();
  await prisma.mediumOption.upsert({
    where: { label: trimmed },
    create: { label: trimmed, sortOrder: count, approved: false },
    update: {},
  });

  const rows = await prisma.mediumOption.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((r) => r.label);
}
