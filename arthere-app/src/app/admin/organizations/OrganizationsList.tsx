"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import OrgVisibilityToggle from "./OrgVisibilityToggle";
import { setPlacesArchived } from "./actions";

type PlaceRow = {
  id: string;
  name: string;
  neighborhood: string | null;
  heroImageUrl: string | null;
  inDirectory: boolean;
  isArchived: boolean;
  submittedForReviewAt: Date | null;
  createdAt: Date;
  lastPlaceEditAt: Date | null;
  user: { email: string | null } | null;
  _count: { artists: number; adminNotes: number };
};

export default function OrganizationsList({ places }: { places: PlaceRow[] }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkPending, startBulkTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = q
      ? places.filter((p) =>
          [p.name, p.user?.email, p.neighborhood]
            .filter(Boolean)
            .some((v) => v!.toLowerCase().includes(q)),
        )
      : places;
    return rows;
  }, [places, search]);

  // Live on the left (most recently edited first); drafts on the right
  // (most recently added or edited first).
  const lastTouched = (x: PlaceRow) =>
    Math.max(x.lastPlaceEditAt?.getTime() ?? 0, x.createdAt.getTime());
  const liveRows = useMemo(
    () =>
      filtered
        .filter((x) => x.inDirectory)
        .sort((a, b) => lastTouched(b) - lastTouched(a)),
    [filtered],
  );
  const draftRows = useMemo(
    () =>
      filtered
        .filter((x) => !x.inDirectory)
        .sort((a, b) => lastTouched(b) - lastTouched(a)),
    [filtered],
  );

  function toggleSelect(id: string, isSelected: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (isSelected) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleBulkArchive(isArchived: boolean) {
    const ids = [...selected];
    if (ids.length === 0) return;
    startBulkTransition(async () => {
      await setPlacesArchived(ids, isArchived);
      setSelected(new Set());
    });
  }

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
        {selected.size > 0 && (
          <div className="flex items-center gap-2 pl-2 border-l border-[#e5e5e5]">
            <span className="text-xs text-[#888]">
              {selected.size} selected
            </span>
            <button
              onClick={() => handleBulkArchive(true)}
              disabled={bulkPending}
              className="text-xs px-3 py-1.5 rounded border border-[#e5e5e5] text-[#555] hover:border-[#999] transition-colors disabled:opacity-50"
            >
              {bulkPending ? "Saving…" : "Archive"}
            </button>
            <button
              onClick={() => handleBulkArchive(false)}
              disabled={bulkPending}
              className="text-xs px-3 py-1.5 rounded border border-[#e5e5e5] text-[#555] hover:border-[#999] transition-colors disabled:opacity-50"
            >
              Unarchive
            </button>
          </div>
        )}
        <span className="text-sm text-[#888]">{filtered.length} shown</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {[
          { title: "Live", rows: liveRows },
          { title: "Drafts", rows: draftRows },
        ].map(({ title, rows }) => (
          <section key={title}>
            <h2 className="text-sm font-medium text-[#555] mb-2">
              {title}{" "}
              <span className="text-[#aaa] font-normal">({rows.length})</span>
            </h2>
            <div className="bg-white border border-[#e5e5e5] rounded-lg divide-y divide-[#f0f0f0]">
              {rows.length === 0 && (
                <p className="p-6 text-sm text-[#999]">
                  No organizations here.
                </p>
              )}

              {rows.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-[#fafafa] transition-colors ${p.isArchived ? "opacity-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={(e) => toggleSelect(p.id, e.target.checked)}
                    className="cursor-pointer flex-shrink-0"
                  />

                  <Link
                    href={`/admin/organizations/${p.id}/edit`}
                    className="flex flex-1 min-w-0 items-center gap-4"
                  >
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#f0f0f0] flex-shrink-0">
                      {p.heroImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.heroImageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#ccc] text-xl font-light">
                          {p.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{p.name}</span>
                        {p.submittedForReviewAt && (
                          <span
                            className="text-xs bg-[#f062a4]/10 text-[#a84573] border border-[#f062a4]/25 px-1.5 py-0.5 rounded flex-shrink-0"
                            title={`Submitted for review ${new Date(p.submittedForReviewAt).toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}`}
                          >
                            Needs review
                          </span>
                        )}
                        {p.isArchived && (
                          <span className="text-xs bg-[#e5e5e5] text-[#666] px-1.5 py-0.5 rounded flex-shrink-0">
                            archived
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-[#888] truncate">
                        {p.user?.email ?? "no owner email"} ·{" "}
                        {p.neighborhood ?? "no neighborhood"}
                      </div>
                    </div>

                    <div className="hidden 2xl:flex items-center gap-6 text-xs text-[#bbb] flex-shrink-0">
                      <span>{p._count.artists} artists</span>
                      <span>{p._count.adminNotes} notes</span>
                      <span title="Created">
                        Created{" "}
                        {new Date(p.createdAt).toLocaleDateString("en-US", {
                          timeZone: "America/Los_Angeles",
                        })}
                      </span>
                      <span title="Last edited by the org">
                        {p.lastPlaceEditAt
                          ? `Edited ${new Date(p.lastPlaceEditAt).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" })}`
                          : "Not edited"}
                      </span>
                    </div>
                    <div className="flex-shrink-0">
                      <OrgVisibilityToggle
                        placeId={p.id}
                        inDirectory={p.inDirectory}
                      />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
