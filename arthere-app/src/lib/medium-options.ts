import { prisma } from "@/lib/db";
import { MEDIUM_OPTIONS as DEFAULT_MEDIUM_OPTIONS } from "@/lib/artist-options";

// The live, admin-extensible medium vocabulary (see MediumOption in
// prisma/schema.prisma). Falls back to the hardcoded defaults only if the
// table is unexpectedly empty, so tagging/UI never goes blank. Unapproved
// labels (see registerMediumOptions) are excluded — they only become
// selectable here once approved at /admin/mediums.
export async function getMediumOptions(): Promise<string[]> {
  const rows = await prisma.mediumOption.findMany({ where: { approved: true }, orderBy: { sortOrder: "asc" } });
  return rows.length > 0 ? rows.map((r) => r.label) : DEFAULT_MEDIUM_OPTIONS;
}

// Whenever an artist or admin saves a medium that isn't in the list yet (via
// the free-text "Other" field on the artist profile), record it as an
// unapproved submission rather than putting it live immediately — this is
// the only ungated path into the shared vocabulary (anyone with a profile
// can type anything here), and it's what let a stream of one-off typos and
// near-duplicates ("acrylic ink", "alco", "K") pollute the list for
// everyone. It now waits at /admin/mediums until an admin approves it.
// Matches case-insensitively so "photography" doesn't create a second
// "Photography".
export async function registerMediumOptions(labels: string[]): Promise<void> {
  const clean = [...new Set(labels.map((l) => l.trim()).filter(Boolean))];
  if (clean.length === 0) return;

  const existing = await prisma.mediumOption.findMany({ select: { label: true } });
  const existingLower = new Set(existing.map((r) => r.label.toLowerCase()));
  const toAdd = clean.filter((l) => !existingLower.has(l.toLowerCase()));
  if (toAdd.length === 0) return;

  await prisma.mediumOption.createMany({
    data: toAdd.map((label, i) => ({ label, sortOrder: existing.length + i, approved: false })),
    skipDuplicates: true,
  });
}
