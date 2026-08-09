"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function setResponseIsTest(id: string, isTest: boolean) {
  await requireAdmin();
  await prisma.surveyResponse.update({ where: { id }, data: { isTest } });
  // Stat cards, funnel, and charts are computed server-side from non-test
  // rows — without this they'd stay stale until a manual refresh.
  revalidatePath("/admin/survey");
  revalidatePath("/admin");
}

// Archiving just tucks rows out of the default table view — unlike isTest it
// does NOT affect stats/funnel/charts, since archived responses are still
// real data, just not ones you need in front of you right now.
export async function setResponsesArchived(ids: string[], isArchived: boolean) {
  await requireAdmin();
  if (ids.length === 0) return;
  await prisma.surveyResponse.updateMany({ where: { id: { in: ids } }, data: { isArchived } });
  revalidatePath("/admin/survey");
}
