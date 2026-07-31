"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FramingEditor } from "./FramingEditor";
import { useFramingModal } from "@/lib/useFramingModal";

type FramingEndpoint = "/api/admin/image-focus" | "/api/image-focus";

/**
 * A single square photo tile: tap it to open the framing editor (crop/zoom),
 * press-and-drag it to reorder within the grid, or hit the × to remove it —
 * the same interaction model as Instagram's own photo-picker grid.
 *
 * Dragging vs. tapping is disambiguated by movement distance: a plain tap
 * (no meaningful movement) opens the framing modal; crossing the threshold
 * engages a reorder drag instead. This tile owns its own framing-modal state
 * (via useFramingModal) and reports drag movement up to the parent grid,
 * which owns the array order.
 */
function PhotoTile({
  url,
  index,
  framingEndpoint,
  framingAspect,
  focal,
  onRemove,
  onDragMove,
  onDragEnd,
}: {
  url: string;
  index: number;
  framingEndpoint: FramingEndpoint;
  framingAspect: string;
  focal?: CSSProperties;
  onRemove: () => void;
  onDragMove: (fromIndex: number, clientX: number, clientY: number) => void;
  onDragEnd: (wasDragging: boolean) => void;
}) {
  const { open, setOpen, loading, saving, initial, error, handleOpen, handleSave } =
    useFramingModal({ imageUrl: url, endpoint: framingEndpoint });
  const dragRef = useRef<{ startX: number; startY: number; dragging: boolean } | null>(null);
  const DRAG_THRESHOLD = 8;

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, dragging: false };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current;
    if (!d) return;
    if (!d.dragging) {
      const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
      if (dist > DRAG_THRESHOLD) d.dragging = true;
    }
    if (d.dragging) onDragMove(index, e.clientX, e.clientY);
  }

  function handlePointerUp() {
    const wasDragging = dragRef.current?.dragging ?? false;
    dragRef.current = null;
    onDragEnd(wasDragging);
    if (!wasDragging) handleOpen();
  }

  return (
    <div
      data-tile-index={index}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative aspect-square rounded-lg overflow-hidden bg-[#f0f0f0] cursor-grab active:cursor-grabbing touch-none select-none group"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" draggable={false} className="w-full h-full object-cover pointer-events-none" style={focal} />

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ×
      </button>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent text-white text-[10px] text-center py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Tap to adjust · drag to reorder
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-xl p-5 w-full max-w-[480px] shadow-xl">
            <h3 className="text-sm font-medium text-[#1a1a1a] mb-3">Adjust framing</h3>
            {loading ? (
              <p className="text-sm text-[#999]">Loading…</p>
            ) : (
              <FramingEditor
                imageUrl={url}
                initial={initial}
                aspect={framingAspect}
                saving={saving}
                onSave={handleSave}
                onCancel={() => setOpen(false)}
              />
            )}
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export function PhotoGrid({
  images,
  max,
  framingEndpoint,
  framingAspect = "1 / 1",
  focals,
  onReorder,
  onRemove,
  onAddFiles,
  uploading = false,
  addLabel = "+ Add photo",
}: {
  images: string[];
  max: number;
  /** Which API route owns these images: admin-only or self-service. */
  framingEndpoint: FramingEndpoint;
  /** Aspect ratio for the framing-editor preview — match how these tiles actually display on the live site. */
  framingAspect?: string;
  /** url → framing style, so tile thumbnails preview the saved crop too. */
  focals?: Map<string, CSSProperties>;
  /** Called once a drag-reorder finishes, with the new full order. */
  onReorder: (next: string[]) => void;
  onRemove: (url: string) => void;
  onAddFiles: (files: File[]) => void;
  uploading?: boolean;
  addLabel?: string;
}) {
  // Local order drives the live drag preview; resyncs whenever the parent's
  // own images array changes (upload, removal, or a save round-trip).
  const [order, setOrder] = useState(images);
  useEffect(() => setOrder(images), [images]);
  const orderRef = useRef(order);
  orderRef.current = order;

  function handleDragMove(fromIndex: number, clientX: number, clientY: number) {
    const el = document.elementFromPoint(clientX, clientY);
    const tileEl = (el as HTMLElement | null)?.closest("[data-tile-index]") as HTMLElement | null;
    if (!tileEl) return;
    const overIndex = Number(tileEl.dataset.tileIndex);
    if (Number.isNaN(overIndex) || overIndex === fromIndex) return;
    setOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(overIndex, 0, moved);
      return next;
    });
  }

  function handleDragEnd(wasDragging: boolean) {
    if (wasDragging) onReorder(orderRef.current);
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {order.map((url, i) => (
        <PhotoTile
          key={url}
          url={url}
          index={i}
          framingEndpoint={framingEndpoint}
          framingAspect={framingAspect}
          focal={focals?.get(url)}
          onRemove={() => onRemove(url)}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />
      ))}
      {order.length < max && (
        <label className="aspect-square rounded-lg border-2 border-dashed border-[#e5e5e5] flex flex-col items-center justify-center cursor-pointer hover:border-[#bbb] transition-colors gap-1">
          <span className="text-[#ccc] text-sm text-center px-2">{uploading ? "Uploading…" : addLabel}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) onAddFiles(files);
              e.target.value = "";
            }}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
