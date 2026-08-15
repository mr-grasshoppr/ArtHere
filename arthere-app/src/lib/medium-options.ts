import { prisma } from "@/lib/db";
import { MEDIUM_OPTIONS as DEFAULT_MEDIUM_OPTIONS } from "@/lib/artist-options";

// The live, admin-extensible medium vocabulary (see MediumOption in
// prisma/schema.prisma). Falls back to the hardcoded defaults only if the
// table is unexpectedly empty, so tagging/UI never goes blank.
export async function getMediumOptions(): Promise<string[]> {
  const rows = await prisma.mediumOption.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.length > 0 ? rows.map((r) => r.label) : DEFAULT_MEDIUM_OPTIONS;
}

// Whenever an artist or admin saves a medium that isn't in the list yet
// (via the free-text "Other" field on the artist profile), fold it into the
// shared vocabulary automatically — for now, no separate approval step —
// so it shows up as a real pill everywhere (artwork tagging, other artists'
// profiles) instead of staying siloed as one artist's free text. Matches
// case-insensitively so "photography" doesn't create a second "Photography".
export async function registerMediumOptions(labels: string[]): Promise<void> {
  const clean = [...new Set(labels.map((l) => l.trim()).filter(Boolean))];
  if (clean.length === 0) return;

  const existing = await prisma.mediumOption.findMany({ select: { label: true } });
  const existingLower = new Set(existing.map((r) => r.label.toLowerCase()));
  const toAdd = clean.filter((l) => !existingLower.has(l.toLowerCase()));
  if (toAdd.length === 0) return;

  await prisma.mediumOption.createMany({
    data: toAdd.map((label, i) => ({ label, sortOrder: existing.length + i })),
    skipDuplicates: true,
  });
}
