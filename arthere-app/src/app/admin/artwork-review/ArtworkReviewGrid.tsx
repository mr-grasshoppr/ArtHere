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
  artist: { id: string; name: string; slug: string; medium: string | null };
};

export default function ArtworkReviewGrid({
  images: initialImages,
  initialMediumOptions,
}: {
  images: Image[];
  initialMediumOptions: string[];
}) {
  const [images, setImages] = useState(initialImages);
  const [mediumOptions, setMediumOptions] = useState(initialMediumOptions);
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

  return (
    <div>
      <div className="mb-5">
        <button
          onClick={markAllReviewed}
          disabled={bulkPending || remainingCount === 0}
          className="text-xs px-4 py-2 rounded-full border border-[#e5e5e5] text-[#555] hover:border-[#999] transition-colors disabled:opacity-40"
        >
          {bulkPending ? "Saving…" : `Mark all ${remainingCount} remaining as reviewed`}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
        {images.map((img) => {
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
                {artistMedium.length > 0 && (
                  <div className="text-xs text-[#999] mb-2">
                    Reports: {artistMedium.join(", ")}
                  </div>
                )}
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
