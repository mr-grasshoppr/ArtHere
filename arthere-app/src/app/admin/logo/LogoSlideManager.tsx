"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LogoSlide } from "@prisma/client";
import { createLogoSlide, updateLogoSlide, deleteLogoSlide, moveLogoSlide } from "./actions";
import { resizeImageForUpload } from "@/lib/client-image-resize";
import { FramingButton } from "@/components/FramingButton";

const BTN = "text-xs px-3 py-1.5 rounded-full border border-[#e5e5e5] text-[#555] hover:border-[#999] transition-colors disabled:opacity-40 disabled:pointer-events-none";

export default function LogoSlideManager({ initialSlides }: { initialSlides: LogoSlide[] }) {
  const router = useRouter();
  const [slides, setSlides] = useState(initialSlides);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => setSlides(initialSlides), [initialSlides]);

  function scheduleSave(id: string, data: { color?: string; artistName?: string }) {
    clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(() => {
      updateLogoSlide(id, data).catch(() => {});
    }, 500);
  }

  function patchLocal(id: string, data: Partial<LogoSlide>) {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  }

  async function handleAdd() {
    await createLogoSlide();
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this slide?")) return;
    setSlides((prev) => prev.filter((s) => s.id !== id));
    await deleteLogoSlide(id);
    router.refresh();
  }

  async function handleMove(id: string, direction: "up" | "down") {
    await moveLogoSlide(id, direction);
    router.refresh();
  }

  async function handleImageUpload(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(id);
    try {
      const form = new FormData();
      form.append("file", await resizeImageForUpload(file));
      form.append("prefix", "logo-slides");
      const res = await fetch("/api/admin/upload/blob", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Upload failed");
      const { url } = (await res.json()) as { url: string };
      patchLocal(id, { imageUrl: url });
      await updateLogoSlide(id, { imageUrl: url });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    }
    setUploadingId(null);
    e.target.value = "";
  }

  return (
    <div className="space-y-4">
      {slides.map((slide, i) => (
        <div key={slide.id} className="bg-white border border-[#e5e5e5] rounded-lg p-4 flex gap-4 items-start">
          <div className="relative w-24 h-24 rounded-md overflow-hidden bg-[#f0f0f0] flex-shrink-0">
            {slide.imageUrl ? (
              <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#ccc] text-xs">no image</div>
            )}
          </div>

          <div className="flex-1 min-w-0 grid grid-cols-2 gap-3">
            <label className="text-xs text-[#888] flex flex-col gap-1">
              Artist name
              <input
                type="text"
                defaultValue={slide.artistName}
                onChange={(e) => {
                  patchLocal(slide.id, { artistName: e.target.value });
                  scheduleSave(slide.id, { artistName: e.target.value });
                }}
                className="px-2.5 py-1.5 border border-[#e5e5e5] rounded text-sm text-[#1a1a1a]"
              />
            </label>

            <label className="text-xs text-[#888] flex flex-col gap-1">
              Color (shown before this slide&apos;s image)
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={slide.color}
                  onChange={(e) => {
                    patchLocal(slide.id, { color: e.target.value });
                    scheduleSave(slide.id, { color: e.target.value });
                  }}
                  className="w-9 h-9 rounded border border-[#e5e5e5] cursor-pointer"
                />
                <input
                  type="text"
                  value={slide.color}
                  onChange={(e) => {
                    patchLocal(slide.id, { color: e.target.value });
                    scheduleSave(slide.id, { color: e.target.value });
                  }}
                  className="px-2.5 py-1.5 border border-[#e5e5e5] rounded text-sm text-[#1a1a1a] w-24"
                />
              </div>
            </label>

            <div className="col-span-2 flex items-center gap-2 flex-wrap">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleImageUpload(slide.id, e)}
                className="hidden"
                id={`logo-upload-${slide.id}`}
              />
              <label htmlFor={`logo-upload-${slide.id}`} className={`${BTN} cursor-pointer`}>
                {uploadingId === slide.id ? "Uploading…" : slide.imageUrl ? "Replace image" : "Upload image"}
              </label>

              {slide.imageUrl && (
                <FramingButton
                  imageUrl={slide.imageUrl}
                  endpoint="/api/admin/image-focus"
                  aspect="1668 / 1457"
                  className={BTN}
                  label="Adjust position"
                />
              )}

              <button type="button" className={BTN} disabled={i === 0} onClick={() => handleMove(slide.id, "up")}>
                Move up
              </button>
              <button type="button" className={BTN} disabled={i === slides.length - 1} onClick={() => handleMove(slide.id, "down")}>
                Move down
              </button>
              <button
                type="button"
                onClick={() => handleDelete(slide.id)}
                className="text-xs px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:border-red-400 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAdd}
        className="text-sm px-4 py-2 rounded-full bg-[#1a1a1a] text-white hover:opacity-80 transition-opacity"
      >
        + Add slide
      </button>
    </div>
  );
}
