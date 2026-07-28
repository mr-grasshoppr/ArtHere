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
