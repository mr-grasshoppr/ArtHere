"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import VisibilityToggle from "./VisibilityToggle";

type ArtistRow = {
  id: string;
  name: string;
  slug: string;
  medium: string | null;
  neighborhood: string | null;
  isPlaceholder: boolean;
  submittedForReviewAt: Date | null;
  createdAt: Date;
  user: { email: string | null; emailVerified: Date | null } | null;
  artworkImages: { id: string; url: string; isHero: boolean }[];
  _count: { adminNotes: number };
};

type SortKey = "newest" | "oldest" | "name-asc" | "name-desc" | "images-desc";

const SORTERS: Record<SortKey, (a: ArtistRow, b: ArtistRow) => number> = {
  newest: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  oldest: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  "name-asc": (a, b) => (a.name || "￿").localeCompare(b.name || "￿"),
  "name-desc": (a, b) => (b.name || "￿").localeCompare(a.name || "￿"),
  "images-desc": (a, b) => b.artworkImages.length - a.artworkImages.length,
};

export default function ArtistsList({ artists }: { artists: ArtistRow[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = q
      ? artists.filter((a) =>
          [a.name, a.user?.email, a.medium, a.neighborhood]
            .filter(Boolean)
            .some((v) => v!.toLowerCase().includes(q))
        )
      : artists;
    return [...rows].sort(SORTERS[sort]);
  }, [artists, search, sort]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by name, email, medium, neighborhood…"
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
          <option value="images-desc">Most images</option>
        </select>
        <span className="text-sm text-[#888]">{filtered.length} shown</span>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-lg divide-y divide-[#f0f0f0]">
        {filtered.length === 0 && (
          <p className="p-6 text-sm text-[#999]">No artist profiles match this filter.</p>
        )}
        {filtered.map((a) => {
          const heroImage = a.artworkImages.find((i) => i.isHero) ?? a.artworkImages[0];
          return (
            <Link
              key={a.id}
              href={`/admin/artists/${a.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-[#fafafa] transition-colors"
            >
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#f0f0f0] flex-shrink-0">
                {heroImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={heroImage.url} alt={a.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#ccc] text-xl font-light">
                    {a.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{a.name || <span className="text-[#bbb] italic">(no name)</span>}</span>
                  {a.user?.emailVerified && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">verified</span>
                  )}
                  {a.submittedForReviewAt && (
                    <span
                      className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded flex-shrink-0"
                      title={`Submitted for review ${new Date(a.submittedForReviewAt).toLocaleString()}`}
                    >
                      Needs review
                    </span>
                  )}
                </div>
                <div className="text-sm text-[#888] truncate">
                  {a.user?.email ?? "no owner yet"} · {a.medium ?? "no medium"} · {a.neighborhood ?? "no neighborhood"}
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs text-[#bbb] flex-shrink-0">
                <span>{a.artworkImages.length} images</span>
                <span>{a._count.adminNotes} notes</span>
                <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                <VisibilityToggle artistId={a.id} isPlaceholder={a.isPlaceholder} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
