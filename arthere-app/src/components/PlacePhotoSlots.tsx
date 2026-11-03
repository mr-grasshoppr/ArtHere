"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PLACE_HERO_OBJECT_POSITION } from "@/lib/focal-style";
import { FramingButton } from "@/components/FramingButton";
import { PhotoSlotFrame } from "@/components/PhotoSlotFrame";
import type { FramingValue } from "@/components/FramingEditor";

const ACCEPT = "image/jpeg,image/png,image/webp";
const ACTION_BTN =
  "flex-1 bg-black/60 text-white rounded-md py-1.5 text-xs text-center hover:bg-black/75 transition-colors";
const ROUND_BTN =
  "w-6 h-6 rounded-full bg-black/55 text-white text-xs leading-none hover:bg-black/75 transition-colors";

type Common = {
  /** Which API route owns these images: the owner's own, or admin. */
  framingEndpoint?: "/api/image-focus" | "/api/admin/image-focus";
  styleFor: (url?: string | null, fallback?: string) => CSSProperties;
  rememberFocal: (url: string, value: FramingValue) => void;
  uploading: boolean;
};

function pick(e: React.ChangeEvent<HTMLInputElement>, fn: (files: File[]) => void) {
  const files = Array.from(e.target.files ?? []);
  e.target.value = "";
  if (files.length) fn(files);
}

/** Place hero: the same Adjust / Replace controls and drop target as the artist header photo. */
export function PlaceHeroSlot({
  url,
  onFile,
  ...c
}: Common & { url: string | null; onFile: (file: File) => void }) {
  // The live hero is 21:9 but capped in height on wide screens, so its real
  // shape depends on the window. Measure it, so Adjust previews the crop this
  // screen will publish rather than a fixed 21:9.
  const imgRef = useRef<HTMLImageElement>(null);
  const [aspect, setAspect] = useState("21 / 9");
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) setAspect(`${Math.round(width)} / ${Math.round(height)}`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [url]);

  return (
    <PhotoSlotFrame
      onFiles={(files) => onFile(files[0])}
      onMove={() => {}}
      className="relative w-full aspect-[21/9] max-h-[420px] min-h-[200px] overflow-hidden bg-[#f4f4f0]"
    >
      {url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imgRef} src={url} alt="" draggable={false} className="w-full h-full object-cover" style={c.styleFor(url, PLACE_HERO_OBJECT_POSITION)} />
          <div className="absolute left-3 bottom-3 z-10 flex gap-2 w-[260px] max-w-[70%]">
            <FramingButton
              imageUrl={url}
              endpoint={c.framingEndpoint ?? "/api/image-focus"}
              aspect={aspect}
              label="Adjust"
              className={ACTION_BTN}
              defaultFraming={{ x: 50, y: 38, scale: 1 }}
              onSaved={(v) => c.rememberFocal(url, v)}
            />
            <label className={`${ACTION_BTN} cursor-pointer`}>
              {c.uploading ? "Uploading…" : "Replace"}
              <input type="file" accept={ACCEPT} onChange={(e) => pick(e, (f) => onFile(f[0]))} className="hidden" />
            </label>
          </div>
        </>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer gap-1 absolute inset-0 text-center">
          <span className="text-[#777] text-sm">{c.uploading ? "Uploading…" : "Drop a header photo here"}</span>
          <span className="text-[#999] text-xs underline underline-offset-2">or browse — this appears at the top of your page</span>
          <input type="file" accept={ACCEPT} onChange={(e) => pick(e, (f) => onFile(f[0]))} className="hidden" />
        </label>
      )}
    </PhotoSlotFrame>
  );
}

/** Place gallery: drag-to-reorder tiles with ← → arrows, Adjust, Replace and × — the artist gallery's controls. */
export function PlaceGallerySlots({
  images,
  max,
  onAdd,
  onReplace,
  onRemove,
  onReorder,
  ...c
}: Common & {
  images: string[];
  max: number;
  onAdd: (files: File[]) => void;
  onReplace: (url: string, file: File) => void;
  onRemove: (url: string) => void;
  onReorder: (next: string[]) => void;
}) {
  const swap = (a: string, b: string) => {
    const next = [...images];
    const i = next.indexOf(a);
    const j = next.indexOf(b);
    if (i < 0 || j < 0) return;
    [next[i], next[j]] = [next[j], next[i]];
    onReorder(next);
  };
  const step = (url: string, d: -1 | 1) => {
    const i = images.indexOf(url);
    const j = i + d;
    if (j < 0 || j >= images.length) return;
    swap(url, images[j]);
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: max }, (_, slot) => {
        const url = images[slot];
        if (url) {
          return (
            <PhotoSlotFrame
              key={url}
              imageId={url}
              onFiles={(files) => onReplace(url, files[0])}
              onMove={(from) => swap(from, url)}
              className="rounded-lg overflow-hidden bg-[#f0ede9] aspect-square relative cursor-grab active:cursor-grabbing"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" draggable={false} className="w-full h-full object-cover" style={c.styleFor(url)} />
              <div className="absolute top-1.5 left-1.5 z-10 flex gap-1">
                <button type="button" onClick={() => step(url, -1)} className={ROUND_BTN} title="Move earlier" aria-label="Move earlier">←</button>
                {slot < images.length - 1 && (
                  <button type="button" onClick={() => step(url, 1)} className={ROUND_BTN} title="Move later" aria-label="Move later">→</button>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(url)}
                className={`absolute top-1.5 right-1.5 z-10 text-sm ${ROUND_BTN}`}
                title="Remove this photo"
                aria-label="Remove this photo"
              >×</button>
              <div className="absolute left-1.5 right-1.5 bottom-1.5 z-10 flex gap-1.5">
                <FramingButton
                  imageUrl={url}
                  endpoint={c.framingEndpoint ?? "/api/image-focus"}
                  aspect="1 / 1"
                  label="Adjust"
                  className={ACTION_BTN}
                  onSaved={(v) => c.rememberFocal(url, v)}
                />
                <label className={`${ACTION_BTN} cursor-pointer`}>
                  Replace
                  <input type="file" accept={ACCEPT} onChange={(e) => pick(e, (f) => onReplace(url, f[0]))} className="hidden" />
                </label>
              </div>
            </PhotoSlotFrame>
          );
        }
        return (
          <PhotoSlotFrame
            key={`empty-${slot}`}
            onFiles={onAdd}
            onMove={() => {}}
            className="rounded-lg border-2 border-dashed border-[#e5e5e5] aspect-square relative overflow-hidden hover:border-[#bbb] transition-colors"
          >
            <label className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center px-2 cursor-pointer">
              <span className="text-[#777] text-sm">{c.uploading ? "Uploading…" : "Drop a photo here"}</span>
              <span className="text-[#999] text-xs underline underline-offset-2">or browse</span>
              <input type="file" accept={ACCEPT} multiple onChange={(e) => pick(e, onAdd)} className="hidden" />
            </label>
          </PhotoSlotFrame>
        );
      })}
    </div>
  );
}
