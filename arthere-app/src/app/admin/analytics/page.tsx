import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin";
import { pctChange, summarizeSearches } from "@/lib/analytics-report";

export const dynamic = "force-dynamic";

const RANGES = [
  { key: "7", label: "7 days", days: 7 },
  { key: "30", label: "30 days", days: 30 },
  { key: "90", label: "90 days", days: 90 },
  { key: "all", label: "All time", days: null },
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const SEARCH_ROW_CAP = 50_000;

type Period = { gte?: Date; lt?: Date };

function whereIn(p: Period): Prisma.AnalyticsEventWhereInput {
  return p.gte || p.lt ? { createdAt: { ...(p.gte && { gte: p.gte }), ...(p.lt && { lt: p.lt }) } } : {};
}

async function countBy(p: Period, type: string, kind: string): Promise<Map<string, number>> {
  const rows = await prisma.analyticsEvent.groupBy({
    by: ["targetId"],
    where: { ...whereIn(p), type, kind },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.targetId ?? "", r._count._all]));
}

function Delta({ current, prev }: { current: number; prev: number | null }) {
  if (prev === null) return null;
  const pct = pctChange(current, prev);
  if (pct === null) return <span className="text-[#999] text-xs ml-2">new</span>;
  if (pct === 0) return <span className="text-[#999] text-xs ml-2">no change</span>;
  return (
    <span className={`text-xs ml-2 ${pct > 0 ? "text-[#07803f]" : "text-[#b3261e]"}`}>
      {pct > 0 ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}

function Card({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-[#e5e5e5] rounded-lg p-5">
      <h2 className="text-sm font-semibold text-[#1a1a1a]">{title}</h2>
      {note && <p className="text-xs text-[#888] mt-0.5 mb-3">{note}</p>}
      {!note && <div className="mb-3" />}
      {children}
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-[#999] italic">Nothing recorded in this range yet.</p>;
}

type Col = { head: string; right?: boolean };

function Table({ cols, rows }: { cols: Col[]; rows: React.ReactNode[][] }) {
  if (rows.length === 0) return <Empty />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-[#888] border-b border-[#eee]">
            {cols.map((c) => (
              <th key={c.head} className={`py-1.5 pr-3 font-medium ${c.right ? "text-right" : ""}`}>
                {c.head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-[#f5f5f5] last:border-0">
              {r.map((cell, j) => (
                <td key={j} className={`py-1.5 pr-3 align-top ${cols[j]?.right ? "text-right tabular-nums" : ""}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requireAdminPage();
  const { range: rangeParam } = await searchParams;
  const range = RANGES.find((r) => r.key === rangeParam) ?? RANGES[1];

  const now = new Date();
  const cur: Period = range.days ? { gte: new Date(now.getTime() - range.days * DAY_MS) } : {};
  const prev: Period | null = range.days
    ? { gte: new Date(now.getTime() - 2 * range.days * DAY_MS), lt: cur.gte }
    : null;

  const [
    totalsCur,
    totalsPrev,
    daily,
    artistViews,
    artistClicks,
    artistViewsPrev,
    artistClicksPrev,
    placeViews,
    placeClicks,
    artworkClicks,
    pageviews,
    flows,
    mapRegions,
    mapPins,
    mapNodes,
    mapViews,
    outbound,
    searchRows,
    firstEvent,
  ] = await Promise.all([
    prisma.analyticsEvent.groupBy({ by: ["type"], where: whereIn(cur), _count: { _all: true } }),
    prev ? prisma.analyticsEvent.groupBy({ by: ["type"], where: whereIn(prev), _count: { _all: true } }) : null,
    prisma.$queryRaw<{ day: Date; n: bigint }[]>`
      SELECT date_trunc('day', "createdAt" AT TIME ZONE 'America/Los_Angeles') AS day, count(*) AS n
      FROM "AnalyticsEvent"
      WHERE type = 'pageview' ${cur.gte ? Prisma.sql`AND "createdAt" >= ${cur.gte}` : Prisma.empty}
      GROUP BY 1 ORDER BY 1`,
    countBy(cur, "pageview", "artist"),
    countBy(cur, "click", "artist"),
    prev ? countBy(prev, "pageview", "artist") : null,
    prev ? countBy(prev, "click", "artist") : null,
    countBy(cur, "pageview", "place"),
    countBy(cur, "click", "place"),
    countBy(cur, "click", "artwork"),
    prisma.analyticsEvent.groupBy({
      by: ["path"],
      where: { ...whereIn(cur), type: "pageview" },
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
      take: 20,
    }),
    prisma.analyticsEvent.groupBy({
      by: ["path", "kind", "targetId"],
      where: { ...whereIn(cur), type: "click", kind: { in: ["artist", "place", "artwork", "city", "section"] } },
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
      take: 400,
    }),
    countBy(cur, "click", "map_region"),
    countBy(cur, "click", "map_pin"),
    countBy(cur, "click", "map_node"),
    countBy(cur, "click", "map_view"),
    countBy(cur, "click", "outbound"),
    prisma.analyticsEvent.findMany({
      where: { ...whereIn(cur), type: "search" },
      select: { meta: true },
      orderBy: { createdAt: "desc" },
      take: SEARCH_ROW_CAP,
    }),
    prisma.analyticsEvent.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
  ]);

  const total = (rows: { type: string; _count: { _all: number } }[] | null, type: string) =>
    rows ? rows.find((r) => r.type === type)?._count._all ?? 0 : null;

  // Names for the slugs and image URLs we're about to show.
  const topSlugs = (...maps: Map<string, number>[]) => [...new Set(maps.flatMap((m) => [...m.keys()]))];
  const flowSlugs = flows.filter((f) => f.targetId).map((f) => f.targetId as string);
  const flowArtworkUrls = flows.filter((f) => f.kind === "artwork" && f.targetId).map((f) => f.targetId as string);
  const artworkUrls = [...artworkClicks.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([u]) => u);
  const [artists, places, artworks] = await Promise.all([
    prisma.artist.findMany({
      where: { slug: { in: [...topSlugs(artistViews, artistClicks), ...flowSlugs] } },
      select: { slug: true, name: true },
    }),
    prisma.place.findMany({
      where: { slug: { in: [...topSlugs(placeViews, placeClicks), ...flowSlugs] } },
      select: { slug: true, name: true },
    }),
    prisma.artworkImage.findMany({
      where: { url: { in: [...new Set([...artworkUrls, ...flowArtworkUrls])] } },
      select: { url: true, artist: { select: { name: true, slug: true } } },
    }),
  ]);
  const artistName = new Map(artists.map((a) => [a.slug, a.name]));
  const placeName = new Map(places.map((p) => [p.slug, p.name]));
  const artworkInfo = new Map(artworks.map((a) => [a.url, a.artist]));

  const nameOf = (kind: string, id: string | null) => {
    if (!id) return "—";
    if (kind === "artist") return artistName.get(id) ?? id;
    if (kind === "place") return placeName.get(id) ?? id;
    if (kind === "artwork") {
      const a = artworkInfo.get(id);
      return a ? `Artwork by ${a.name}` : "Artwork (removed)";
    }
    return id;
  };

  // ── Artists and places: views of the profile + clicks through to it ──
  function interestRows(views: Map<string, number>, clicks: Map<string, number>, vPrev: Map<string, number> | null, cPrev: Map<string, number> | null, kind: string) {
    const ids = topSlugs(views, clicks);
    return ids
      .map((id) => ({ id, v: views.get(id) ?? 0, c: clicks.get(id) ?? 0 }))
      .sort((a, b) => b.v + b.c - (a.v + a.c))
      .slice(0, 25)
      .map(({ id, v, c }) => [
        nameOf(kind, id),
        <>
          {v}
          <Delta current={v} prev={vPrev ? vPrev.get(id) ?? 0 : null} />
        </>,
        <>
          {c}
          <Delta current={c} prev={cPrev ? cPrev.get(id) ?? 0 : null} />
        </>,
      ]);
  }

  const searches = summarizeSearches(searchRows);
  const maxDaily = Math.max(1, ...daily.map((d) => Number(d.n)));
  const top = (m: Map<string, number>, n = 15) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

  const flowsRanked = flows
    .map((f) => ({ ...f, n: f._count._all }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 40);

  const types = [
    { key: "pageview", label: "Page views" },
    { key: "click", label: "Clicks" },
    { key: "search", label: "Filter searches" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Analytics</h1>
          <p className="text-sm text-[#888] mt-1">
            First-party and cookie-free. {firstEvent ? `Recording since ${firstEvent.createdAt.toLocaleDateString("en-US", { dateStyle: "medium" })}.` : "No events recorded yet."}{" "}
            Your own visits are left out when you&rsquo;re signed in as admin or have opted out at{" "}
            <Link href="/notrack" className="underline">/notrack</Link>.
          </p>
        </div>
        <nav className="flex gap-1 text-sm" aria-label="Date range">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/admin/analytics?range=${r.key}`}
              className={`px-3 py-1 rounded-full border ${r.key === range.key ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "border-[#ddd] text-[#666] hover:border-[#999]"}`}
            >
              {r.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {types.map((t) => {
          const c = total(totalsCur, t.key) ?? 0;
          return (
            <div key={t.key} className="bg-white border border-[#e5e5e5] rounded-lg p-5">
              <div className="text-xs text-[#888]">{t.label}</div>
              <div className="text-2xl font-semibold tabular-nums mt-1">
                {c.toLocaleString()}
                <Delta current={c} prev={total(totalsPrev, t.key)} />
              </div>
              {prev && <div className="text-xs text-[#999] mt-1">vs. previous {range.days} days</div>}
            </div>
          );
        })}
      </div>

      <Card title="Page views per day" note="Pacific time.">
        {daily.length === 0 ? (
          <Empty />
        ) : (
          <div className="flex items-end gap-px h-28" role="img" aria-label="Daily page views">
            {daily.map((d) => (
              <div
                key={d.day.toISOString()}
                title={`${d.day.toISOString().slice(0, 10)}: ${Number(d.n)}`}
                className="flex-1 bg-[#f96a9b] min-w-[2px] rounded-t-sm"
                style={{ height: `${Math.max(3, (Number(d.n) / maxDaily) * 100)}%` }}
              />
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Artists" note="Profile views, plus clicks to the profile from anywhere (cards, artwork tiles, the map).">
          <Table cols={[{ head: "Artist" }, { head: "Views", right: true }, { head: "Clicks in", right: true }]} rows={interestRows(artistViews, artistClicks, artistViewsPrev, artistClicksPrev, "artist")} />
        </Card>
        <Card title="Places" note="Same measures for galleries, studios and collectives.">
          <Table cols={[{ head: "Place" }, { head: "Views", right: true }, { head: "Clicks in", right: true }]} rows={interestRows(placeViews, placeClicks, null, null, "place")} />
        </Card>
      </div>

      <Card title="Artworks" note="Clicks on a piece: grid tiles on the city page and the enlarge view on profiles.">
        <Table
          cols={[{ head: "Artwork" }, { head: "Artist" }, { head: "Clicks", right: true }]}
          rows={top(artworkClicks, 25).map(([url, n]) => {
            const a = artworkInfo.get(url);
            return [
              // eslint-disable-next-line @next/next/no-img-element
              <img key="i" src={url} alt="" className="h-12 w-12 object-cover rounded" loading="lazy" />,
              a ? <Link key="a" href={`/artists/${a.slug}`} className="underline">{a.name}</Link> : <span key="a" className="text-[#999]">removed</span>,
              n,
            ];
          })}
        />
      </Card>

      <Card title="Where clicks come from" note="The page a visitor was on → what they clicked. Compare the same artist across pages.">
        <Table
          cols={[{ head: "From page" }, { head: "To" }, { head: "Clicks", right: true }]}
          rows={flowsRanked.map((f) => [
            <code key="p" className="text-xs">{f.path}</code>,
            <span key="t">
              <span className="text-[#999] text-xs mr-1.5">{f.kind}</span>
              {nameOf(f.kind, f.targetId)}
            </span>,
            f.n,
          ])}
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Pages">
          <Table cols={[{ head: "Page" }, { head: "Views", right: true }]} rows={pageviews.map((p) => [<code key="p" className="text-xs">{p.path}</code>, p._count._all])} />
        </Card>
        <Card title="Outbound links" note="Where visitors left for (host and path only).">
          <Table cols={[{ head: "Link" }, { head: "Clicks", right: true }]} rows={top(outbound, 20).map(([id, n]) => [<code key="l" className="text-xs">{id}</code>, n])} />
        </Card>
      </div>

      <Card title="Map &amp; network" note="Clicks only — hovering and dragging aren't counted.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-medium text-[#888] mb-1">Regions (geographic)</h3>
            <Table cols={[{ head: "Region" }, { head: "Clicks", right: true }]} rows={top(mapRegions).map(([id, n]) => [id, n])} />
          </div>
          <div>
            <h3 className="text-xs font-medium text-[#888] mb-1">Pins (geographic)</h3>
            <Table cols={[{ head: "Place" }, { head: "Clicks", right: true }]} rows={top(mapPins).map(([id, n]) => [nameOf("place", id), n])} />
          </div>
          <div>
            <h3 className="text-xs font-medium text-[#888] mb-1">Nodes (network)</h3>
            <Table cols={[{ head: "Artist or place" }, { head: "Clicks", right: true }]} rows={top(mapNodes).map(([id, n]) => [id, n])} />
          </div>
          <div>
            <h3 className="text-xs font-medium text-[#888] mb-1">View switch</h3>
            <Table cols={[{ head: "View opened" }, { head: "Clicks", right: true }]} rows={top(mapViews).map(([id, n]) => [id, n])} />
          </div>
        </div>
      </Card>

      <Card
        title="Filter searches"
        note={`${searches.total.toLocaleString()} settled searches. A search counts once toward every value it included; refining a search counts as a new one.`}
      >
        {searches.total === 0 ? (
          <Empty />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["medium", "neighborhood", "places"].map((f) => (
              <div key={f}>
                <h3 className="text-xs font-medium text-[#888] mb-1 capitalize">{f === "places" ? "Affiliations (places)" : f}</h3>
                <Table cols={[{ head: "Value" }, { head: "Searches", right: true }]} rows={(searches.byFilter[f] ?? []).map((r) => [r.value, r.count])} />
              </div>
            ))}
          </div>
        )}
        {searches.combos.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-medium text-[#888] mb-1">Combinations</h3>
            <Table cols={[{ head: "Filters" }, { head: "Searches", right: true }]} rows={searches.combos.map((r) => [r.label, r.count])} />
          </div>
        )}
        {searches.empty.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-medium text-[#888] mb-1">Searches with no results</h3>
            <Table cols={[{ head: "Filters" }, { head: "Searches", right: true }]} rows={searches.empty.map((r) => [r.label, r.count])} />
          </div>
        )}
      </Card>
    </div>
  );
}
