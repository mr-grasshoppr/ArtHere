"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { parseMediumList } from "@/lib/artist-options";
import { MediumMultiSelect } from "@/components/MediumMultiSelect";
import { setArtworkMedium } from "../artists/[id]/actions";
import { setImagesReviewed, setImagesExcluded, setImagesExcludedFromGrid } from "./actions";

type Image = {
  id: string;
  url: string;
  altText: string | null;
  medium: string[];
  reviewed: boolean;
  excluded: boolean;
  /** Hidden from the public browse grids (city artwork page, city ambient
   *  background) — distinct from `excluded`, which only hides it here. */
  excludedFromGrid: boolean;
  artist: { id: string; name: string; slug: string; medium: string | null; isPlaceholder: boolean; isArchived: boolean };
};

type SortKey = "newest" | "medium" | "live-first" | "hidden-first";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  medium: "By medium",
  "live-first": "Live artists first",
  "hidden-first": "Hidden artists first",
};

function isLive(artist: Image["artist"]) {
  return !artist.isPlaceholder && !artist.isArchived;
}

function sortImages(images: Image[], sort: SortKey): Image[] {
  if (sort === "newest") return images;
  const withIndex = images.map((img, i) => ({ img, i }));
  const cmp: Record<Exclude<SortKey, "newest">, (a: typeof withIndex[0], b: typeof withIndex[0]) => number> = {
    medium: (a, b) => {
      const am = a.img.artist.medium ?? "";
      const bm = b.img.artist.medium ?? "";
      if (!am && bm) return 1;
      if (am && !bm) return -1;
      return am.localeCompare(bm) || a.i - b.i;
    },
    "live-first": (a, b) => Number(isLive(b.img.artist)) - Number(isLive(a.img.artist)) || a.i - b.i,
    "hidden-first": (a, b) => Number(isLive(a.img.artist)) - Number(isLive(b.img.artist)) || a.i - b.i,
  };
  return [...withIndex].sort(cmp[sort]).map(({ img }) => img);
}

export default function ArtworkReviewGrid({
  images: initialImages,
  initialMediumOptions,
  showingExcluded,
}: {
  images: Image[];
  initialMediumOptions: string[];
  /** Whether the current filter already includes excluded images. When it
   *  doesn't, excluding an image here should make it vanish immediately
   *  (matching what the server query will do on the next load) rather than
   *  just dim in place. */
  showingExcluded: boolean;
}) {
  const [images, setImages] = useState(initialImages);
  const [mediumOptions, setMediumOptions] = useState(initialMediumOptions);
  const [sort, setSort] = useState<SortKey>("newest");
  const [bulkPending, startBulkTransition] = useTransition();

  function updateMedium(image: Image, next: string[]) {
    setImages((prev) => prev.map((img) => (img.id === image.id ? { ...img, medium: next } : img)));
    setArtworkMedium(image.artist.id, image.id, next);
  }

  function toggleReviewed(image: Image) {
    const next = !image.reviewed;
    setImages((prev) => prev.map((img) => (img.id === image.id ? { ...img, reviewed: next } : img)));
    setImagesReviewed([image.id], next);
  }

  function toggleExcluded(image: Image) {
    const next = !image.excluded;
    setImagesExcluded([image.id], next);
    if (next && !showingExcluded) {
      setImages((prev) => prev.filter((img) => img.id !== image.id));
    } else {
      setImages((prev) => prev.map((img) => (img.id === image.id ? { ...img, excluded: next } : img)));
    }
  }

  // Independent of `excluded` above — this hides the piece from the public
  // site (city artwork page, city ambient background), not from this review
  // list, so the card stays put either way.
  function toggleExcludedFromGrid(image: Image) {
    const next = !image.excludedFromGrid;
    setImages((prev) => prev.map((img) => (img.id === image.id ? { ...img, excludedFromGrid: next } : img)));
    setImagesExcludedFromGrid([image.id], next);
  }

  function markAllReviewed() {
    const ids = images.filter((img) => !img.reviewed).map((img) => img.id);
    if (ids.length === 0) return;
    startBulkTransition(async () => {
      setImages((prev) => prev.map((img) => ({ ...img, reviewed: true })));
      await setImagesReviewed(ids, true);
    });
  }

  if (images.length === 0) {
    return <p className="text-sm text-[#999]">Nothing to show with this filter.</p>;
  }

  const remainingCount = images.filter((img) => !img.reviewed).length;
  const sortedImages = sortImages(images, sort);

  return (
    <div>
      <div className="mb-5 flex items-center gap-3 flex-wrap">
        <button
          onClick={markAllReviewed}
          disabled={bulkPending || remainingCount === 0}
          className="text-xs px-4 py-2 rounded-full border border-[#e5e5e5] text-[#555] hover:border-[#999] transition-colors disabled:opacity-40"
        >
          {bulkPending ? "Saving…" : `Mark all ${remainingCount} remaining as reviewed`}
        </button>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="px-3 py-2 border border-[#e5e5e5] rounded-lg text-xs bg-white text-[#555] focus:outline-none focus:border-[#999] cursor-pointer"
        >
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
        {sortedImages.map((img) => {
          const artistMedium = parseMediumList(img.artist.medium);
          return (
            <div
              key={img.id}
              className={`bg-white border rounded-lg overflow-hidden transition-opacity ${
                img.excluded ? "border-[#f062a4]/40 opacity-60" : "border-[#e5e5e5]"
              } ${img.reviewed && !img.excluded ? "opacity-50" : ""}`}
            >
              <div className="relative aspect-square bg-[#f4f4f0] group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.altText ?? ""} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => toggleExcludedFromGrid(img)}
                  title={
                    img.excludedFromGrid
                      ? "Show this image in the public artwork/city grids again"
                      : "Hide this image from the public artwork/city grids"
                  }
                  className={`absolute top-1.5 left-1.5 z-10 text-[10px] font-medium px-2 py-1 rounded-full transition-colors cursor-pointer ${
                    img.excludedFromGrid
                      ? "bg-[#e08a1e] text-white"
                      : "bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-black/60"
                  }`}
                >
                  {img.excludedFromGrid ? "↺ Show in grid" : "✕ Hide from grid"}
                </button>
                <button
                  type="button"
                  onClick={() => toggleExcluded(img)}
                  title={img.excluded ? "Include this image in the review grid" : "Exclude this image from the review grid"}
                  className={`absolute top-1.5 right-1.5 z-10 text-[10px] font-medium px-2 py-1 rounded-full transition-colors cursor-pointer ${
                    img.excluded
                      ? "bg-[#f062a4] text-white"
                      : "bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-black/60"
                  }`}
                >
                  {img.excluded ? "↺ Include" : "✕ Exclude"}
                </button>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Link
                    href={`/admin/artists/${img.artist.id}/edit`}
                    className="text-sm font-medium hover:underline truncate"
                  >
                    {img.artist.name}
                  </Link>
                  <label className="flex items-center gap-1.5 text-xs text-[#888] flex-shrink-0 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={img.reviewed}
                      onChange={() => toggleReviewed(img)}
                      className="cursor-pointer"
                    />
                    Reviewed
                  </label>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
                      isLive(img.artist) ? "bg-[#00ae7a]/10 text-[#00805a]" : "bg-[#e5e5e5] text-[#777]"
                    }`}
                  >
                    {isLive(img.artist) ? "Live" : "Hidden"}
                  </span>
                  {img.excluded && (
                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#f062a4]/10 text-[#a84573]">
                      Excluded
                    </span>
                  )}
                  {img.excludedFromGrid && (
                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#e08a1e]/10 text-[#a8681e]">
                      Hidden from grid
                    </span>
                  )}
                  {artistMedium.length > 0 && (
                    <span className="text-xs text-[#999] truncate">Reports: {artistMedium.join(", ")}</span>
                  )}
                </div>
                <div className="mt-2">
                  <MediumMultiSelect
                    value={img.medium}
                    onChange={(next) => updateMedium(img, next)}
                    options={mediumOptions}
                    onOptionsChange={setMediumOptions}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
