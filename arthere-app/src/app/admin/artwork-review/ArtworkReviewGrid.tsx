"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { parseMediumList } from "@/lib/artist-options";
import { MediumMultiSelect } from "@/components/MediumMultiSelect";
import { setArtworkMedium } from "../artists/[id]/actions";
import { setImagesReviewed } from "./actions";

type Image = {
  id: string;
  url: string;
  altText: string | null;
  medium: string[];
  reviewed: boolean;
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
}: {
  images: Image[];
  initialMediumOptions: string[];
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
              className={`bg-white border border-[#e5e5e5] rounded-lg overflow-hidden transition-opacity ${
                img.reviewed ? "opacity-50" : ""
              }`}
            >
              <div className="relative aspect-square bg-[#f4f4f0]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.altText ?? ""} className="w-full h-full object-cover" />
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
