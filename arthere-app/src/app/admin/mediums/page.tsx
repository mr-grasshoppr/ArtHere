import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin";
import { parseMediumList } from "@/lib/artist-options";
import MediumOptionsManager, { type MediumRow } from "./MediumOptionsManager";

export default async function AdminMediumsPage() {
  await requireAdminPage();

  const [options, artists, images] = await Promise.all([
    prisma.mediumOption.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.artist.findMany({ select: { id: true, name: true, slug: true, medium: true } }),
    prisma.artworkImage.findMany({
      select: { id: true, medium: true, artist: { select: { id: true, name: true, slug: true } } },
    }),
  ]);

  // Who's actually tagged with each label — a plain count before, now the
  // full list, so a bad tag (like a materials list someone typed into
  // "Other") can be pulled off the specific artist/artwork right here
  // instead of hunting through each profile editor individually.
  const artistsByLabel = new Map<string, { id: string; name: string; slug: string }[]>();
  for (const a of artists) {
    for (const m of parseMediumList(a.medium)) {
      const list = artistsByLabel.get(m) ?? [];
      list.push({ id: a.id, name: a.name, slug: a.slug });
      artistsByLabel.set(m, list);
    }
  }
  const imagesByLabel = new Map<string, { id: string; artistId: string; artistName: string; artistSlug: string }[]>();
  for (const img of images) {
    for (const m of img.medium) {
      const list = imagesByLabel.get(m) ?? [];
      list.push({ id: img.id, artistId: img.artist.id, artistName: img.artist.name, artistSlug: img.artist.slug });
      imagesByLabel.set(m, list);
    }
  }

  const rows: MediumRow[] = options.map((o) => ({
    id: o.id,
    label: o.label,
    approved: o.approved,
    artists: artistsByLabel.get(o.label) ?? [],
    images: imagesByLabel.get(o.label) ?? [],
  }));

  // Artists carrying a medium value that isn't a MediumOption row at all —
  // orphaned free text, e.g. from before this table tracked anything, or a
  // label whose option row was later deleted here without touching the
  // artist's own stored string (deleting an option was never meant to
  // silently edit anyone's profile). These are invisible to the list above,
  // which only knows about labels that still exist as options.
  const knownLabels = new Set(options.map((o) => o.label));
  const orphans: { artist: { id: string; name: string; slug: string }; labels: string[] }[] = [];
  for (const a of artists) {
    const stray = parseMediumList(a.medium).filter((m) => !knownLabels.has(m));
    if (stray.length > 0) orphans.push({ artist: { id: a.id, name: a.name, slug: a.slug }, labels: stray });
  }

  return (
    <div>
      <h1 className="text-2xl font-medium mb-2">Mediums</h1>
      <p className="text-sm text-[#888] mb-6 max-w-[680px]">
        The shared medium vocabulary used across artist profiles and artwork tagging. A label typed
        into an artist&rsquo;s free-text &ldquo;Other&rdquo; field, or added on the fly while
        tagging a piece, lands here as <em>pending</em> rather than going live immediately — approve
        it to make it selectable everywhere, or reject it to discard. Expand a label to see exactly
        who&rsquo;s tagged with it — an artist&rsquo;s overall profile medium, or a specific piece of
        artwork they tagged themselves — and pull it off just that one, without editing their whole
        profile. Removing the option itself only stops it from being offered going forward; it
        doesn&rsquo;t touch anyone already tagged.
      </p>
      <MediumOptionsManager rows={rows} orphans={orphans} />
    </div>
  );
}
