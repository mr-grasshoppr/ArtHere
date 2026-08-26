"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

// ─── Areas ───────────────────────────────────────────────────────────────────

export async function createArea(name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return;
  const last = await prisma.neighborhoodArea.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  await prisma.neighborhoodArea.create({
    data: { name: trimmed, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });
}

export async function renameArea(id: string, name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return;
  await prisma.neighborhoodArea.update({ where: { id }, data: { name: trimmed } });
}

/** Neighborhoods in the area fall back to unfiled rather than being deleted. */
export async function deleteArea(id: string) {
  await requireAdmin();
  await prisma.neighborhoodArea.delete({ where: { id } });
}

export async function moveArea(id: string, direction: "up" | "down") {
  await requireAdmin();
  const areas = await prisma.neighborhoodArea.findMany({ orderBy: { sortOrder: "asc" } });
  const i = areas.findIndex((a) => a.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i === -1 || j < 0 || j >= areas.length) return;
  await prisma.$transaction([
    prisma.neighborhoodArea.update({ where: { id: areas[i].id }, data: { sortOrder: areas[j].sortOrder } }),
    prisma.neighborhoodArea.update({ where: { id: areas[j].id }, data: { sortOrder: areas[i].sortOrder } }),
  ]);
}

// ─── Neighborhoods ───────────────────────────────────────────────────────────

/** Pass areaId null to unfile it. */
export async function assignNeighborhood(id: string, areaId: string | null) {
  await requireAdmin();
  const last = await prisma.neighborhood.findFirst({
    where: { areaId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  await prisma.neighborhood.update({
    where: { id },
    data: { areaId, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });
}

export async function setNeighborhoodHidden(id: string, hidden: boolean) {
  await requireAdmin();
  await prisma.neighborhood.update({ where: { id }, data: { hidden } });
}

/** Reorders within the neighborhood's own area. */
export async function moveNeighborhood(id: string, direction: "up" | "down") {
  await requireAdmin();
  const self = await prisma.neighborhood.findUnique({ where: { id }, select: { areaId: true } });
  if (!self) return;
  const siblings = await prisma.neighborhood.findMany({
    where: { areaId: self.areaId },
    orderBy: { sortOrder: "asc" },
  });
  const i = siblings.findIndex((n) => n.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i === -1 || j < 0 || j >= siblings.length) return;
  await prisma.$transaction([
    prisma.neighborhood.update({ where: { id: siblings[i].id }, data: { sortOrder: siblings[j].sortOrder } }),
    prisma.neighborhood.update({ where: { id: siblings[j].id }, data: { sortOrder: siblings[i].sortOrder } }),
  ]);
}
