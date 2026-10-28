"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

// New videos go to the front, same as the Instagram carousel: sortOrder steps
// below the current minimum rather than renumbering every row.
export async function createStoryVideo(): Promise<string> {
  await requireAdmin();
  const first = await prisma.storyVideo.findFirst({
    orderBy: { sortOrder: "asc" },
    select: { sortOrder: true },
  });
  const video = await prisma.storyVideo.create({
    data: { sortOrder: (first?.sortOrder ?? 1) - 1 },
  });
  revalidatePath("/stories");
  return video.id;
}

export async function updateStoryVideo(
  id: string,
  data: { title?: string; byline?: string; description?: string; videoUrl?: string; published?: boolean }
) {
  await requireAdmin();
  await prisma.storyVideo.update({ where: { id }, data });
  revalidatePath("/stories");
}

export async function deleteStoryVideo(id: string) {
  await requireAdmin();
  await prisma.storyVideo.delete({ where: { id } });
  revalidatePath("/stories");
}

export async function moveStoryVideo(id: string, direction: "up" | "down") {
  await requireAdmin();
  const videos = await prisma.storyVideo.findMany({ orderBy: { sortOrder: "asc" } });
  const i = videos.findIndex((v) => v.id === id);
  if (i === -1) return;
  const j = direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= videos.length) return;

  await prisma.$transaction([
    prisma.storyVideo.update({ where: { id: videos[i].id }, data: { sortOrder: videos[j].sortOrder } }),
    prisma.storyVideo.update({ where: { id: videos[j].id }, data: { sortOrder: videos[i].sortOrder } }),
  ]);
  revalidatePath("/stories");
}
