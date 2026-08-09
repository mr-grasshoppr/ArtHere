"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

// Admin-only: mint a new selectable medium label on the fly (e.g. an admin
// tagging artwork hits a piece that's neither Painting nor Sculpture but
// "Printmaking" — this saves it as a first-class, reusable option instead of
// forcing free text). Returns the full updated list so callers can refresh
// their local option state without a page reload.
export async function addMediumOption(label: string): Promise<string[]> {
  await requireAdmin();
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Label is required");

  const count = await prisma.mediumOption.count();
  await prisma.mediumOption.upsert({
    where: { label: trimmed },
    create: { label: trimmed, sortOrder: count },
    update: {},
  });

  const rows = await prisma.mediumOption.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((r) => r.label);
}
