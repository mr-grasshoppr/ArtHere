import { prisma } from "@/lib/db";
import { MEDIUM_OPTIONS as DEFAULT_MEDIUM_OPTIONS } from "@/lib/artist-options";

// The live, admin-extensible medium vocabulary (see MediumOption in
// prisma/schema.prisma). Falls back to the hardcoded defaults only if the
// table is unexpectedly empty, so tagging/UI never goes blank.
export async function getMediumOptions(): Promise<string[]> {
  const rows = await prisma.mediumOption.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.length > 0 ? rows.map((r) => r.label) : DEFAULT_MEDIUM_OPTIONS;
}
