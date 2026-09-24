import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin";
import { parseMediumList } from "@/lib/artist-options";
import MediumOptionsManager, { type MediumRow } from "./MediumOptionsManager";

export default async function AdminMediumsPage() {
  await requireAdminPage();

  const [options, artists, images] = await Promise.all([
    prisma.mediumOption.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.artist.findMany({ select: { medium: true } }),
    prisma.artworkImage.findMany({ select: { medium: true } }),
  ]);

  // How many artists/artwork actually use each label — same "unused is
  // harmless, but worth knowing" pattern as the Neighborhoods admin page.
  const usage = new Map<string, number>();
  for (const { medium } of artists) {
    for (const m of parseMediumList(medium)) usage.set(m, (usage.get(m) ?? 0) + 1);
  }
  for (const { medium } of images) {
    for (const m of medium) usage.set(m, (usage.get(m) ?? 0) + 1);
  }

  const rows: MediumRow[] = options.map((o) => ({
    id: o.id,
    label: o.label,
    approved: o.approved,
    usage: usage.get(o.label) ?? 0,
  }));

  return (
    <div>
      <h1 className="text-2xl font-medium mb-2">Mediums</h1>
      <p className="text-sm text-[#888] mb-6 max-w-[680px]">
        The shared medium vocabulary used across artist profiles and artwork tagging. A label typed
        into an artist&rsquo;s free-text &ldquo;Other&rdquo; field, or added on the fly while
        tagging a piece, lands here as <em>pending</em> rather than going live immediately — approve
        it to make it selectable everywhere, or reject it to discard. Usage counts reflect who&rsquo;s
        already tagged with a label; removing an option here only stops it from being offered
        going forward; it&rsquo;s stored as plain text on the artist/artwork, so nothing already
        tagged changes.
      </p>
      <MediumOptionsManager rows={rows} />
    </div>
  );
}
