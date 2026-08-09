"use client";

import { useState } from "react";
import Link from "next/link";
import { parseMediumList } from "@/lib/artist-options";
import { MediumMultiSelect } from "@/components/MediumMultiSelect";
import { setArtworkMedium } from "../artists/[id]/actions";

type Image = {
  id: string;
  url: string;
  altText: string | null;
  medium: string[];
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

  function updateMedium(image: Image, next: string[]) {
    setImages((prev) => prev.map((img) => (img.id === image.id ? { ...img, medium: next } : img)));
    setArtworkMedium(image.artist.id, image.id, next);
  }

  // Once a piece has at least one medium set, it's no longer ambiguous —
  // drop it from the queue instead of waiting for a page reload.
  const remaining = images.filter((img) => img.medium.length === 0);

  if (remaining.length === 0) {
    return <p className="text-sm text-[#999]">Nothing left to review.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
      {remaining.map((img) => {
        const artistMedium = parseMediumList(img.artist.medium);
        return (
          <div key={img.id} className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
            <div className="relative aspect-square bg-[#f4f4f0]">
              <img src={img.url} alt={img.altText ?? ""} className="w-full h-full object-cover" />
            </div>
            <div className="p-3">
              <Link
                href={`/admin/artists/${img.artist.id}/edit`}
                className="text-sm font-medium hover:underline"
              >
                {img.artist.name}
              </Link>
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
  );
}
