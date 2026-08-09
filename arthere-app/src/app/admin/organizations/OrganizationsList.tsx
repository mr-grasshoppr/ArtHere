"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import OrgVisibilityToggle from "./OrgVisibilityToggle";

type PlaceRow = {
  id: string;
  name: string;
  neighborhood: string | null;
  heroImageUrl: string | null;
  inDirectory: boolean;
  createdAt: Date;
  user: { email: string | null } | null;
  _count: { artists: number; adminNotes: number };
};

type SortKey = "newest" | "oldest" | "name-asc" | "name-desc" | "artists-desc";

const SORTERS: Record<SortKey, (a: PlaceRow, b: PlaceRow) => number> = {
  newest: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  oldest: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  "name-asc": (a, b) => a.name.localeCompare(b.name),
  "name-desc": (a, b) => b.name.localeCompare(a.name),
  "artists-desc": (a, b) => b._count.artists - a._count.artists,
};

export default function OrganizationsList({ places }: { places: PlaceRow[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = q
      ? places.filter((p) =>
          [p.name, p.user?.email, p.neighborhood].filter(Boolean).some((v) => v!.toLowerCase().includes(q))
        )
      : places;
    return [...rows].sort(SORTERS[sort]);
  }, [places, search, sort]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by name, email, neighborhood…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[220px] px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm bg-white focus:outline-none focus:border-[#999]"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm bg-white text-[#555] focus:outline-none focus:border-[#999] cursor-pointer"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="artists-desc">Most artists</option>
        </select>
        <span className="text-sm text-[#888]">{filtered.length} shown</span>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-lg divide-y divide-[#f0f0f0]">
        {filtered.length === 0 && <p className="p-6 text-sm text-[#999]">No organizations match this filter.</p>}
        {filtered.map((p) => (
          <Link
            key={p.id}
            href={`/admin/organizations/${p.id}`}
            className="flex items-center gap-4 px-5 py-4 hover:bg-[#fafafa] transition-colors"
          >
            <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#f0f0f0] flex-shrink-0">
              {p.heroImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.heroImageUrl} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#ccc] text-xl font-light">
                  {p.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{p.name}</div>
              <div className="text-sm text-[#888] truncate">
                {p.user?.email ?? "no owner email"} · {p.neighborhood ?? "no neighborhood"}
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-[#bbb] flex-shrink-0">
              <span>{p._count.artists} artists</span>
              <span>{p._count.adminNotes} notes</span>
              <span>{new Date(p.createdAt).toLocaleDateString()}</span>
              <OrgVisibilityToggle placeId={p.id} inDirectory={p.inDirectory} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
