"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrganization } from "../../actions";
import { FramingButton } from "@/components/FramingButton";
import { focalStyle, type Focal } from "@/lib/focal-style";
import type { FramingValue } from "@/components/FramingEditor";

type Org = {
  id: string;
  name: string;
  neighborhood: string;
  description: string;
  website: string;
  email: string;
  heroImageUrl: string | null;
  thumbnailImageUrl: string | null;
  galleryImages: string[];
};

const inputCls =
  "w-full px-3 py-2 border border-[#e5e5e5] rounded-lg bg-white text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[#999] text-sm";
const labelCls = "block text-xs text-[#888] uppercase tracking-wide mb-1.5";

async function uploadBlob(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("prefix", "places");
  const res = await fetch("/api/admin/upload/blob", { method: "POST", body: form });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Upload failed");
  return (await res.json()).url as string;
}

export default function OrgEditor({ place, initialFocals }: { place: Org; initialFocals?: Record<string, Focal> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [focals, setFocals] = useState<Record<string, Focal>>(initialFocals ?? {});
  const styleFor = (url?: string | null) => focalStyle(url ? focals[url] : undefined);
  function rememberFocal(url: string, value: FramingValue) {
    setFocals((prev) => ({ ...prev, [url]: value }));
  }

  const [name, setName] = useState(place.name);
  const [neighborhood, setNeighborhood] = useState(place.neighborhood);
  const [description, setDescription] = useState(place.description);
  const [website, setWebsite] = useState(place.website);
  const [email, setEmail] = useState(place.email);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(place.heroImageUrl);
  const [thumbnailImageUrl, setThumbnailImageUrl] = useState<string | null>(place.thumbnailImageUrl);
  const [galleryImages, setGalleryImages] = useState<string[]>(place.galleryImages);

  // Images the thumbnail can be chosen from: the hero plus every gallery photo.
  const thumbnailChoices = [heroImageUrl, ...galleryImages].filter((u): u is string => !!u);

  async function handleHero(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      setHeroImageUrl(await uploadBlob(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleThumbnail(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      setThumbnailImageUrl(await uploadBlob(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const f of files) {
      try {
        urls.push(await uploadBlob(f));
      } catch {
        /* skip a failed file */
      }
    }
    setGalleryImages((prev) => [...prev, ...urls]);
    setUploading(false);
    e.target.value = "";
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        await updateOrganization(place.id, {
          name,
          neighborhood,
          description,
          website,
          email,
          heroImageUrl,
          thumbnailImageUrl,
          galleryImages,
        });
        setSaved(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Hero image */}
      <section className="bg-white border border-[#e5e5e5] rounded-lg p-5 space-y-3">
        <h2 className="font-medium text-sm text-[#888] uppercase tracking-wide">Hero image</h2>
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-[#f0f0f0]">
          {heroImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImageUrl} alt="" className="w-full h-full object-cover" style={styleFor(heroImageUrl)} />
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-block text-sm text-[#555] border border-[#e5e5e5] rounded-full px-4 py-2 cursor-pointer hover:border-[#999] transition-colors">
            {uploading ? "Uploading…" : heroImageUrl ? "Replace hero image" : "Upload hero image"}
            <input type="file" accept="image/*" onChange={handleHero} className="hidden" />
          </label>
          {heroImageUrl && (
            <FramingButton
              imageUrl={heroImageUrl}
              endpoint="/api/admin/image-focus"
              aspect="21 / 9"
              className="text-sm text-[#555] hover:text-[#1a1a1a] transition-colors underline underline-offset-2"
              onSaved={(v) => rememberFocal(heroImageUrl, v)}
            />
          )}
        </div>
      </section>

      {/* Community thumbnail */}
      <section className="bg-white border border-[#e5e5e5] rounded-lg p-5 space-y-3">
        <div>
          <h2 className="font-medium text-sm text-[#888] uppercase tracking-wide">Community thumbnail</h2>
          <p className="text-xs text-[#aaa] mt-1">The card shown in the Community directory. Defaults to the hero image if none is chosen.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-start">
          {thumbnailChoices.map((url) => {
            const selected = (thumbnailImageUrl ?? heroImageUrl) === url;
            return (
              <button
                key={url}
                type="button"
                onClick={() => setThumbnailImageUrl(url)}
                className={`relative w-32 aspect-video rounded-md overflow-hidden bg-[#f0f0f0] border-2 transition-colors ${selected ? "border-[#1a1a1a]" : "border-transparent hover:border-[#ccc]"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" style={styleFor(url)} />
                {selected && (
                  <span className="absolute bottom-1 right-1 bg-[#1a1a1a] text-white text-[0.6rem] px-1.5 py-0.5 rounded-full">Thumbnail</span>
                )}
              </button>
            );
          })}
          <label className="w-32 aspect-video rounded-md border-2 border-dashed border-[#e5e5e5] flex items-center justify-center cursor-pointer hover:border-[#bbb] transition-colors text-[#ccc] text-xs text-center px-2">
            {uploading ? "Uploading…" : "+ Upload thumbnail"}
            <input type="file" accept="image/*" onChange={handleThumbnail} className="hidden" />
          </label>
        </div>
      </section>

      {/* Basic info */}
      <section className="bg-white border border-[#e5e5e5] rounded-lg p-5 space-y-4">
        <h2 className="font-medium text-sm text-[#888] uppercase tracking-wide">Basic info</h2>
        <div>
          <label className={labelCls}>Name *</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Neighborhood</label>
            <input type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="e.g. Multnomah Village" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Owner email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@email.com" className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Website</label>
          <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>About</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className={`${inputCls} resize-y`} />
        </div>
      </section>

      {/* Gallery */}
      <section className="bg-white border border-[#e5e5e5] rounded-lg p-5 space-y-3">
        <h2 className="font-medium text-sm text-[#888] uppercase tracking-wide">Photos</h2>
        <div className="grid grid-cols-3 gap-2">
          {galleryImages.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-[#f0f0f0] group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" style={styleFor(url)} />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                <FramingButton
                  imageUrl={url}
                  endpoint="/api/admin/image-focus"
                  aspect="1 / 1"
                  className="w-full text-[11px] bg-white text-[#1a1a1a] rounded px-2 py-1 hover:bg-[#f0f0f0] transition-colors"
                  onSaved={(v) => rememberFocal(url, v)}
                />
                <button
                  type="button"
                  onClick={() => setGalleryImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="w-full text-[11px] bg-red-500 text-white rounded px-2 py-1 hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          <label className="aspect-square rounded-md border-2 border-dashed border-[#e5e5e5] flex items-center justify-center cursor-pointer hover:border-[#bbb] transition-colors text-[#ccc] text-sm">
            {uploading ? "Uploading…" : "+ Add"}
            <input type="file" accept="image/*" multiple onChange={handleGallery} className="hidden" />
          </label>
        </div>
      </section>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {saved && <p className="text-green-600 text-sm">Saved successfully.</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="px-6 py-2.5 bg-[#1a1a1a] text-white text-sm rounded-full hover:opacity-80 transition-opacity disabled:opacity-40"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/admin/organizations/${place.id}`)}
          className="px-6 py-2.5 text-sm text-[#888] border border-[#e5e5e5] rounded-full hover:border-[#999] transition-colors"
        >
          Done
        </button>
      </div>
    </form>
  );
}
