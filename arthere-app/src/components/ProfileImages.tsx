"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";

type ArtworkImage = { id: string; url: string; altText: string | null; isHero: boolean };
type Focals = Map<string, CSSProperties>;

const DEFAULT_STYLE: CSSProperties = { objectPosition: "50% 50%" };

async function deleteImage(id: string) {
  await fetch(`/api/images?id=${id}`, { method: "DELETE" });
}

// Deleting removes the image from the database and blob storage — there is
// no undo, so always confirm first.
function confirmDelete(): boolean {
  return window.confirm("Remove this photo? This can't be undone.");
}

export function ProfileHero({
  initialImages,
  artistName,
  bioPhotoUrl,
  focals,
}: {
  initialImages: ArtworkImage[];
  artistName: string;
  bioPhotoUrl?: string | null;
  /** url → framing style, from stored/auto-detected image focal points. */
  focals?: Focals;
}) {
  const [images, setImages] = useState(initialImages);
  const heroImage = images.find((img) => img.isHero) ?? images[0] ?? null;

  async function remove(id: string) {
    if (!confirmDelete()) return;
    setImages((prev) => prev.filter((img) => img.id !== id));
    await deleteImage(id);
  }

  return (
    <div className="mb-16 relative">
      {heroImage ? (
        <div className="rounded-lg overflow-hidden bg-[#f0ede9] relative group" style={{ aspectRatio: "2.5 / 1" }}>
          <Image
            src={heroImage.url}
            alt={heroImage.altText ?? artistName}
            fill
            className="object-cover"
            style={focals?.get(heroImage.url) ?? DEFAULT_STYLE}
            priority
          />
          <button
            onClick={() => remove(heroImage.id)}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white text-lg leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            title="Remove header image"
          >×</button>
        </div>
      ) : (
        <div className="rounded-lg bg-[#f5f5f5]" style={{ aspectRatio: "2.5 / 1" }} />
      )}
      {bioPhotoUrl && (
        <div className="absolute -bottom-12 left-4 w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-sm">
          <Image
            src={bioPhotoUrl}
            alt={artistName}
            fill
            className="object-cover"
            style={focals?.get(bioPhotoUrl) ?? DEFAULT_STYLE}
          />
        </div>
      )}
    </div>
  );
}

export function ProfileGallery({
  initialImages,
  focals,
}: {
  initialImages: ArtworkImage[];
  /** url → framing style, from stored/auto-detected image focal points. */
  focals?: Focals;
}) {
  // Keep the full list in state and derive the visible gallery from it, so
  // a delete reveals the next image instead of leaving a stale 3-item slice.
  const [allImages, setAllImages] = useState(initialImages);
  const heroImage = allImages.find((img) => img.isHero) ?? allImages[0] ?? null;
  const images = allImages.filter((img) => img.id !== heroImage?.id).slice(0, 3);

  if (images.length === 0) return null;

  async function remove(id: string) {
    if (!confirmDelete()) return;
    setAllImages((prev) => prev.filter((img) => img.id !== id));
    await deleteImage(id);
  }

  return (
    <section className="mt-10">
      <h2 className="text-sm font-medium text-[#999] uppercase tracking-wider mb-4">Gallery</h2>
      <div className={`grid gap-3 ${images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {images.map((img) => (
          <div key={img.id} className="rounded-lg overflow-hidden bg-[#f0ede9] aspect-square relative group">
            <Image src={img.url} alt={img.altText ?? ""} fill className="object-cover" style={focals?.get(img.url) ?? DEFAULT_STYLE} />
            <button
              onClick={() => remove(img.id)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white text-base leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              title="Remove photo"
            >×</button>
          </div>
        ))}
      </div>
    </section>
  );
}

// Default export kept for any existing imports
export default function ProfileImages({
  initialImages,
  artistName,
  bioPhotoUrl,
}: {
  initialImages: ArtworkImage[];
  artistName: string;
  bioPhotoUrl?: string | null;
}) {
  return (
    <>
      <ProfileHero initialImages={initialImages} artistName={artistName} bioPhotoUrl={bioPhotoUrl} />
      <ProfileGallery initialImages={initialImages} />
    </>
  );
}
