"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  approveMediumOption,
  rejectMediumOption,
  deleteMediumOption,
  removeMediumFromArtist,
  removeMediumFromArtwork,
  promoteMediumOption,
} from "./actions";

type ArtistUse = { id: string; name: string; slug: string };
type ArtworkUse = { id: string; artistId: string; artistName: string; artistSlug: string };
export type MediumRow = { id: string; label: string; approved: boolean; artists: ArtistUse[]; images: ArtworkUse[] };
export type OrphanRow = { artist: ArtistUse; labels: string[] };

export default function MediumOptionsManager({ rows, orphans }: { rows: MediumRow[]; orphans: OrphanRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(rows);
  const [strays, setStrays] = useState(orphans);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // promoteOrphan refetches via router.refresh() rather than hand-patching
  // local state (a promoted label can appear under several artists at
  // once) — these resync items/strays once the new server props land.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setItems(rows), [rows]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setStrays(orphans), [orphans]);

  function promoteOrphan(label: string) {
    // A promoted label can appear under several artists at once — simplest
    // to just refetch rather than hand-patch every affected row.
    startTransition(async () => {
      await promoteMediumOption(label);
      router.refresh();
    });
  }

  function unTagOrphan(artistId: string, label: string) {
    setStrays((prev) =>
      prev
        .map((o) => (o.artist.id === artistId ? { ...o, labels: o.labels.filter((l) => l !== label) } : o))
        .filter((o) => o.labels.length > 0)
    );
    startTransition(() => removeMediumFromArtist(artistId, label));
  }

  const pending = items.filter((r) => !r.approved);
  const approved = items.filter((r) => r.approved);

  function approve(id: string) {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, approved: true } : r)));
    startTransition(() => approveMediumOption(id));
  }

  function reject(id: string) {
    setItems((prev) => prev.filter((r) => r.id !== id));
    startTransition(() => rejectMediumOption(id));
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((r) => r.id !== id));
    startTransition(() => deleteMediumOption(id));
  }

  function unTagArtist(row: MediumRow, artistId: string) {
    setItems((prev) => prev.map((r) => (r.id === row.id ? { ...r, artists: r.artists.filter((a) => a.id !== artistId) } : r)));
    startTransition(() => removeMediumFromArtist(artistId, row.label));
  }

  function unTagArtwork(row: MediumRow, imageId: string) {
    setItems((prev) => prev.map((r) => (r.id === row.id ? { ...r, images: r.images.filter((i) => i.id !== imageId) } : r)));
    startTransition(() => removeMediumFromArtwork(imageId, row.label));
  }

  function Row({ r, onPrimaryAction }: { r: MediumRow; onPrimaryAction: React.ReactNode }) {
    const usageCount = r.artists.length + r.images.length;
    const isOpen = expanded === r.id;
    return (
      <div className="border-b border-[#f0f0f0] last:border-b-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="flex-1 text-sm font-medium">{r.label}</span>
          <button
            type="button"
            disabled={usageCount === 0}
            onClick={() => setExpanded(isOpen ? null : r.id)}
            className="text-xs text-[#999] underline disabled:no-underline disabled:cursor-default"
          >
            {usageCount === 0 ? "unused" : `${isOpen ? "hide" : "show"} ${usageCount} tagged`}
          </button>
          {onPrimaryAction}
        </div>
        {isOpen && (
          <div className="px-4 pb-3 pl-8 space-y-1.5">
            {r.artists.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-xs">
                <Link href={`/admin/artists/${a.id}/edit`} className="text-[#555] hover:text-[#1a1a1a] hover:underline">
                  {a.name}
                </Link>
                <span className="text-[#bbb]">— profile medium</span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => unTagArtist(r, a.id)}
                  className="text-[#ccc] hover:text-red-500 disabled:opacity-40"
                  title={`Remove "${r.label}" from ${a.name}'s profile`}
                >
                  ×
                </button>
              </div>
            ))}
            {r.images.map((img) => (
              <div key={img.id} className="flex items-center gap-2 text-xs">
                <Link href={`/admin/artists/${img.artistId}/edit`} className="text-[#555] hover:text-[#1a1a1a] hover:underline">
                  {img.artistName}
                </Link>
                <span className="text-[#bbb]">— one artwork tag</span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => unTagArtwork(r, img.id)}
                  className="text-[#ccc] hover:text-red-500 disabled:opacity-40"
                  title={`Remove "${r.label}" from this artwork`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {strays.length > 0 && (
        <section>
          <h2 className="font-medium text-sm text-[#a84573] uppercase tracking-wide mb-1">
            Unrecognized values ({strays.length})
          </h2>
          <p className="text-xs text-[#999] mb-3">
            These artists have a medium value that isn&rsquo;t a known option at all — often free
            text left behind after its option row was deleted here, or from before this page
            existed.
          </p>
          <div className="bg-white border border-[#f062a4]/30 rounded-lg divide-y divide-[#f0f0f0]">
            {strays.map((o) => (
              <div key={o.artist.id} className="px-4 py-3">
                <Link href={`/admin/artists/${o.artist.id}/edit`} className="text-sm font-medium text-[#1a1a1a] hover:underline">
                  {o.artist.name}
                </Link>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {o.labels.map((label) => (
                    <span
                      key={label}
                      className="flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full text-xs bg-[#f062a4]/10 text-[#a84573]"
                    >
                      {label}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => promoteOrphan(label)}
                        title={`Add "${label}" as a real, approved medium option`}
                        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[#f062a4]/25 disabled:opacity-40"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => unTagOrphan(o.artist.id, label)}
                        title={`Remove "${label}" from ${o.artist.name}'s profile`}
                        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[#f062a4]/25 disabled:opacity-40"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-medium text-sm text-[#888] uppercase tracking-wide mb-3">
          Pending approval {pending.length > 0 && `(${pending.length})`}
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-[#999]">Nothing waiting on review.</p>
        ) : (
          <div className="bg-white border border-[#e5e5e5] rounded-lg">
            {pending.map((r) => (
              <Row
                key={r.id}
                r={r}
                onPrimaryAction={
                  <>
                    <button
                      type="button"
                      onClick={() => approve(r.id)}
                      disabled={isPending}
                      className="text-xs px-3 py-1.5 rounded-full bg-[#1a1a1a] text-white hover:opacity-80 transition-opacity disabled:opacity-40"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => reject(r.id)}
                      disabled={isPending}
                      className="text-xs px-3 py-1.5 rounded-full border border-[#e5e5e5] text-[#888] hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      Reject
                    </button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-medium text-sm text-[#888] uppercase tracking-wide mb-3">
          Approved ({approved.length})
        </h2>
        <div className="bg-white border border-[#e5e5e5] rounded-lg">
          {approved.map((r) => (
            <Row
              key={r.id}
              r={r}
              onPrimaryAction={
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  disabled={isPending}
                  className="text-xs px-3 py-1.5 rounded-full border border-[#e5e5e5] text-[#888] hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-40"
                >
                  Remove
                </button>
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}
