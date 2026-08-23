"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

/**
 * New posts go to the *front* of the carousel — the newest thing posted is
 * the one worth showing first. sortOrder just steps below the current
 * minimum rather than renumbering every row.
 */
export async function createInstagramPost(): Promise<string> {
  await requireAdmin();
  const first = await prisma.instagramPost.findFirst({
    orderBy: { sortOrder: "asc" },
    select: { sortOrder: true },
  });
  const post = await prisma.instagramPost.create({
    data: {
      sortOrder: (first?.sortOrder ?? 1) - 1,
      imageUrl: "",
      alt: "",
      permalink: "",
    },
  });
  return post.id;
}

export async function updateInstagramPost(
  id: string,
  data: { imageUrl?: string; alt?: string; permalink?: string }
) {
  await requireAdmin();
  await prisma.instagramPost.update({ where: { id }, data });
}

export async function deleteInstagramPost(id: string) {
  await requireAdmin();
  await prisma.instagramPost.delete({ where: { id } });
}

// Swaps sortOrder with the adjacent post — same simple reorder the logo
// slide manager uses; there's no drag-and-drop infrastructure in this app.
export async function moveInstagramPost(id: string, direction: "up" | "down") {
  await requireAdmin();
  const posts = await prisma.instagramPost.findMany({ orderBy: { sortOrder: "asc" } });
  const i = posts.findIndex((p) => p.id === id);
  if (i === -1) return;
  const j = direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= posts.length) return;

  await prisma.$transaction([
    prisma.instagramPost.update({ where: { id: posts[i].id }, data: { sortOrder: posts[j].sortOrder } }),
    prisma.instagramPost.update({ where: { id: posts[j].id }, data: { sortOrder: posts[i].sortOrder } }),
  ]);
}
