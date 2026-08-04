"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function createLogoSlide(): Promise<string> {
  await requireAdmin();
  const last = await prisma.logoSlide.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  const slide = await prisma.logoSlide.create({
    data: {
      sortOrder: (last?.sortOrder ?? -1) + 1,
      color: "#0D9CC3",
      imageUrl: "",
      artistName: "",
    },
  });
  return slide.id;
}

export async function updateLogoSlide(
  id: string,
  data: { color?: string; imageUrl?: string; artistName?: string }
) {
  await requireAdmin();
  await prisma.logoSlide.update({ where: { id }, data });
}

export async function deleteLogoSlide(id: string) {
  await requireAdmin();
  await prisma.logoSlide.delete({ where: { id } });
}

// Swaps sortOrder with the adjacent slide — simplest reorder mechanism for a
// small, admin-only list (no drag-and-drop infra elsewhere in this app).
export async function moveLogoSlide(id: string, direction: "up" | "down") {
  await requireAdmin();
  const slides = await prisma.logoSlide.findMany({ orderBy: { sortOrder: "asc" } });
  const i = slides.findIndex((s) => s.id === id);
  if (i === -1) return;
  const j = direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= slides.length) return;

  await prisma.$transaction([
    prisma.logoSlide.update({ where: { id: slides[i].id }, data: { sortOrder: slides[j].sortOrder } }),
    prisma.logoSlide.update({ where: { id: slides[j].id }, data: { sortOrder: slides[i].sortOrder } }),
  ]);
}
