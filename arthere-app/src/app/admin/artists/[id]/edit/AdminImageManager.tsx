"use client";

import { useState, useRef, useTransition } from "react";
import { setHeroImage, deleteImage, setBioPhoto } from "../actions";

type Image = {
  id: string;
  url: string;
  altText: string | null;
  isHero: boolean;
  sortOrder: number;
};

export default function AdminImageManager({
  artistId,
  initialImages,
  initialBioPhotoUrl,
}: {
  artistId: string;
  initialImages: Image[];
  initialBioPhotoUrl: string | null;
}) {
  const [images, setImages] = useState<Image[]>(initialImages);
  const [bioPhotoUrl, setBioPhotoUrl] = useState<string | null>(initialBioPhotoUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadingBio, setUploadingBio] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const bioFileRef = useRef<HTMLInputElement>(null);

  async function handleArtworkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError("");

    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      form.append("artistId", artistId);
      form.append("isHero", images.length === 0 ? "true" : "false");
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: form });
        if (!res.ok) {
          const err = await res.json();
          setError(err.error ?? "Upload failed");
        } else {
          const data = await res.json();
          setImages((prev) => [
            ...prev,
            { id: data.id, url: data.url, altText: null, isHero: data.isHero, sortOrder: prev.length },
          ]);
        }
      } catch {
        setError("Upload failed. Please try again.");
      }
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleBioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBio(true);
    setError("");

    const form = new FormData();
    form.append("file", file);
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

  function handleSetHero(imageId: string) {
    startTransition(async () => {
      await setHeroImage(artistId, imageId);
      setImages((prev) => prev.map((img) => ({ ...img, isHero: img.id === imageId })));
    });
  }

  function handleDelete(imageId: string) {
    startTransition(async () => {
      await deleteImage(artistId, imageId);
      setImages((prev) => {
        const remaining = prev.filter((img) => img.id !== imageId);
        const wasHero = prev.find((img) => img.id === imageId)?.isHero;
        if (wasHero && remaining.length > 0) {
          remaining[0] = { ...remaining[0], isHero: true };
        }
        return remaining;
      });
    });
  }

  return (
    <div className="space-y-6">
      {/* Bio photo */}
      <div>
        <h3 className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-3">Bio Photo</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-[#f0f0f0] flex-shrink-0">
            {bioPhotoUrl ? (
              <img src={bioPhotoUrl} alt="Bio photo" className="w-full h-full object-cover" />
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
            <p className="text-xs text-[#bbb] mt-1">Shown on the artist&apos;s profile page</p>
          </div>
        </div>
      </div>

      {/* Artwork images */}
      <div>
        <h3 className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-3">
          Artwork Images ({images.length})
        </h3>

        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
            {images.map((img) => (
              <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-[#f0f0f0]">
                <img src={img.url} alt={img.altText ?? ""} className="w-full h-full object-cover" />

                {/* Hero badge */}
                {img.isHero && (
                  <div className="absolute top-1 left-1 text-[10px] bg-[#1a1a1a] text-white px-1.5 py-0.5 rounded">
                    hero
                  </div>
                )}

                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                  {!img.isHero && (
                    <button
                      onClick={() => handleSetHero(img.id)}
                      disabled={isPending}
                      className="w-full text-[11px] bg-white text-[#1a1a1a] rounded px-2 py-1 hover:bg-[#f0f0f0] transition-colors disabled:opacity-50"
                    >
                      Set as hero
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(img.id)}
                    disabled={isPending}
                    className="w-full text-[11px] bg-red-500 text-white rounded px-2 py-1 hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                  <a
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-[11px] bg-white/20 text-white rounded px-2 py-1 hover:bg-white/30 transition-colors text-center"
                  >
                    View full
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleArtworkUpload}
          className="hidden"
          id="artwork-upload"
        />
        <label
          htmlFor="artwork-upload"
          className={`inline-block text-sm px-4 py-2 border border-dashed border-[#e5e5e5] rounded-lg text-[#888] cursor-pointer hover:border-[#999] transition-colors ${
            uploading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          {uploading ? "Uploading…" : "+ Add artwork images"}
        </label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
