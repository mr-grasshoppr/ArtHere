import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin";
import { parseNeighborhoodList, isCityLevelNeighborhood } from "@/lib/neighborhoods";
import NeighborhoodManager, { type NeighborhoodRow } from "./NeighborhoodManager";

export default async function AdminNeighborhoodsPage() {
  await requireAdminPage();

  const [areas, curated, places, artists] = await Promise.all([
    prisma.neighborhoodArea.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.neighborhood.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.place.findMany({ select: { neighborhood: true } }),
    prisma.artist.findMany({ select: { neighborhood: true } }),
  ]);

  // How many profiles actually reference each value, so unused leftovers are
  // obvious and safe to hide.
  const usage = new Map<string, number>();
  for (const { neighborhood } of [...places, ...artists]) {
    for (const n of parseNeighborhoodList(neighborhood)) {
      if (!isCityLevelNeighborhood(n)) usage.set(n, (usage.get(n) ?? 0) + 1);
    }
  }

  const neighborhoods: NeighborhoodRow[] = curated.map((n) => ({
    id: n.id,
    name: n.name,
    areaId: n.areaId,
    hidden: n.hidden,
    usage: usage.get(n.name) ?? 0,
  }));

  return (
    <div>
      <h1 className="text-2xl font-medium mb-2">Neighborhoods</h1>
      <p className="text-sm text-[#888] mb-6 max-w-[680px]">
        Groups the neighborhood filters on the artwork, artists, and network pages. Areas appear in
        this order, with their neighborhoods nested underneath. A filter option only shows on the
        site if at least one profile actually uses it, so entries marked <em>unused</em> are
        harmless. Anyone writing something like &ldquo;NW Portland and Beaverton&rdquo; is counted
        under both.
      </p>
      <NeighborhoodManager areas={areas.map((a) => ({ id: a.id, name: a.name }))} neighborhoods={neighborhoods} />
    </div>
  );
}
