"use client";

import { useState } from "react";

type Image = {
  id: string;
  url: string;
  altText: string | null;
  isHero: boolean;
  sortOrder: number;
  aiTags: unknown;
};

export default function ArtistImages({ images }: { images: Image[] }) {
  const [selected, setSelected] = useState<Image | null>(null);

  if (images.length === 0) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-6">
        <h2 className="font-medium mb-2">Images</h2>
        <p className="text-sm text-[#999]">No images uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg p-5">
      <h2 className="font-medium mb-4">Images ({images.length})</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {images.map((img) => (
          <button
            key={img.id}
            onClick={() => setSelected(img)}
            className="relative aspect-square rounded-lg overflow-hidden bg-[#f0f0f0] hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]"
          >
            <img src={img.url} alt={img.altText ?? ""} className="w-full h-full object-cover" />
            {img.isHero && (
              <span className="absolute top-1 left-1 text-[10px] bg-[#1a1a1a] text-white px-1 py-0.5 rounded">
                hero
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selected.url}
              alt={selected.altText ?? ""}
              className="w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="mt-3 text-white/70 text-sm space-y-1">
              {selected.altText && <p>{selected.altText}</p>}
              {selected.isHero && <p>Hero image</p>}
              {selected.aiTags != null && (
                <pre className="text-xs mt-2 bg-white/10 p-3 rounded-lg overflow-auto">
                  {JSON.stringify(selected.aiTags as Record<string, unknown>, null, 2)}
                </pre>
              )}
              <a
                href={selected.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-white/50 hover:text-white transition-colors text-xs"
              >
                Open full size ↗
              </a>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-white/50 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
