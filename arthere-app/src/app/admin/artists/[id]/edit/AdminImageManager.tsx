"use client";

import { useState, useRef } from "react";
import { setBioPhoto, setArtworkMedium, deleteImage, arrangeArtistImages } from "../actions";
import { FramingButton } from "@/components/FramingButton";
import { focalStyle, type Focal } from "@/lib/focal-style";
import type { FramingValue } from "@/components/FramingEditor";
import { HeaderPhotoSlot, GalleryPhotoSlots, type PhotoSlotsContext } from "@/components/ArtworkPhotoSlots";
import { useArtworkPhotos, type PhotoAdapter, type PhotoImage } from "@/lib/useArtworkPhotos";
import { resizeImageForUpload } from "@/lib/client-image-resize";

type Image = {
  id: string;
  url: string;
  altText: string | null;
  isHero: boolean;
  sortOrder: number;
  medium: string[];
  uploadedBy: string | null;
};

export default function AdminImageManager({
  artistId,
  initialImages,
  initialBioPhotoUrl,
  initialFocals,
  initialMediumOptions,
}: {
  artistId: string;
  initialImages: Image[];
  initialBioPhotoUrl: string | null;
  /** url → stored framing, keyed by image url; absent = default centered framing. */
  initialFocals?: Record<string, Focal>;
  initialMediumOptions: string[];
}) {
  const [bioPhotoUrl, setBioPhotoUrl] = useState<string | null>(initialBioPhotoUrl);
  const [focals, setFocals] = useState<Record<string, Focal>>(initialFocals ?? {});
  const [mediumOptions, setMediumOptions] = useState<string[]>(initialMediumOptions);
  const styleFor = (url?: string | null) => focalStyle(url ? focals[url] : undefined);
  function rememberFocal(url: string, value: FramingValue) {
    setFocals((prev) => ({ ...prev, [url]: value }));
  }
  const [uploadingBio, setUploadingBio] = useState(false);
  const [error, setError] = useState("");
  const bioFileRef = useRef<HTMLInputElement>(null);

  // Header first, then the gallery in order — the same arrangement the
  // artist's own form starts from.
  const initialPhotos: PhotoImage[] = [...initialImages]
    .sort((a, b) => Number(b.isHero) - Number(a.isHero) || a.sortOrder - b.sortOrder)
    .map((img) => ({ id: img.id, url: img.url, isHero: img.isHero, medium: img.medium, uploadedBy: img.uploadedBy }));

  const adapter: PhotoAdapter = {
    upload: async (file, asHero) => {
      const form = new FormData();
      form.append("file", await resizeImageForUpload(file));
      form.append("artistId", artistId);
      form.append("isHero", asHero ? "true" : "false");
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Upload failed");
      return { ...(await res.json()), uploadedBy: "admin" };
    },
    arrange: (order, heroId) => arrangeArtistImages(artistId, order, heroId),
    remove: (id) => deleteImage(artistId, id),
    setMedium: (id, next) => setArtworkMedium(artistId, id, next),
  };
  const photos = useArtworkPhotos(initialPhotos, adapter);
  const photoCtx: PhotoSlotsContext = {
    photos,
    styleFor,
    rememberFocal,
    framingEndpoint: "/api/admin/image-focus",
    mediumOptions,
    onMediumOptionsChange: setMediumOptions,
  };

  async function handleBioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBio(true);
    setError("");

    const form = new FormData();
    form.append("file", await resizeImageForUpload(file));
    form.append("artistId", artistId);
    form.append("isBioPhoto", "true");

    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Upload failed");
      } else {
        const data = await res.json();
        setBioPhotoUrl(data.url);
        await setBioPhoto(artistId, data.url);
      }
    } catch {
      setError("Upload failed. Please try again.");
    }

    setUploadingBio(false);
    if (bioFileRef.current) bioFileRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      {/* Bio photo */}
      <div>
        <h3 className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-3">
          Bio Photo
          <span className="ml-2 text-[9px] font-normal normal-case text-[#00805a] bg-[#00ae7a]/10 px-1.5 py-0.5 rounded-full align-middle">
            artist-editable
          </span>
        </h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-[#f0f0f0] flex-shrink-0">
            {bioPhotoUrl ? (
              <img src={bioPhotoUrl} alt="Bio photo" className="w-full h-full object-cover" style={styleFor(bioPhotoUrl)} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#ccc] text-lg">?</div>
            )}
          </div>
          <div>
            <input
              ref={bioFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleBioUpload}
              className="hidden"
              id="bio-upload"
            />
            <label
              htmlFor="bio-upload"
              className={`inline-block text-sm px-4 py-2 border border-[#e5e5e5] rounded-lg text-[#555] cursor-pointer hover:border-[#999] transition-colors ${
                uploadingBio ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {uploadingBio ? "Uploading…" : bioPhotoUrl ? "Replace bio photo" : "Upload bio photo"}
            </label>
            {bioPhotoUrl && (
              <FramingButton
                imageUrl={bioPhotoUrl}
                endpoint="/api/admin/image-focus"
                aspect="1 / 1"
                className="ml-2 inline-block text-sm text-[#555] hover:text-[#1a1a1a] transition-colors underline underline-offset-2"
                label="Adjust framing"
                onSaved={(v) => rememberFocal(bioPhotoUrl, v)}
              />
            )}
            <p className="text-xs text-[#bbb] mt-1">Shown on the artist&apos;s profile page</p>
          </div>
        </div>
      </div>

      {/* Header and gallery — the same slots, drag-to-reorder and medium
          pills as the artist's own editor. */}
      <div>
        <h3 className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-1">
          Header image
          <span className="ml-2 text-[9px] font-normal normal-case text-[#00805a] bg-[#00ae7a]/10 px-1.5 py-0.5 rounded-full align-middle">
            artist-editable
          </span>
        </h3>
        <p className="text-[11px] text-[#bbb] mb-3">
          The small label on each gallery image shows who added it. &ldquo;unknown&rdquo; means it was uploaded before this was tracked.
        </p>
        <HeaderPhotoSlot ctx={photoCtx} />
      </div>

      <GalleryPhotoSlots
        ctx={photoCtx}
        title="Gallery"
        renderBadge={(img) => (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/45 text-white">{img.uploadedBy ?? "unknown"}</span>
        )}
      />

      {(error || photos.error) && <p className="text-sm text-red-500">{error || photos.error}</p>}
    </div>
  );
}
