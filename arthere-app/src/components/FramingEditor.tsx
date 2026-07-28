"use client";

import { useRef, useState } from "react";

export interface FramingValue {
  x: number; // 0-100
  y: number; // 0-100
  scale: number; // >= 1
}

const DEFAULT_FRAMING: FramingValue = { x: 50, y: 50, scale: 1 };
const MIN_SCALE = 1;
const MAX_SCALE = 3;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Pan-and-zoom framing editor for a single image. Renders in the exact CSS
 * model used at display time (object-position + transform-origin + scale, see
 * lib/image-focus.ts#focalStyle) so what you see here is exactly what ships —
 * no separate preview math to keep in sync.
 *
 * Drag the preview to pan the image — content follows your finger/cursor,
 * same convention as any photo cropper. The zoom slider scales in/out around
 * the current focal point. Opens as an inline panel (caller decides whether
 * to wrap it in a modal).
 */
export function FramingEditor({
  imageUrl,
  initial,
  aspect = "16 / 9",
  onSave,
  onCancel,
  saving = false,
}: {
  imageUrl: string;
  initial?: FramingValue | null;
  /** CSS aspect-ratio for the preview box — match where this image is actually shown. */
  aspect?: string;
  onSave: (value: FramingValue) => void | Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [value, setValue] = useState<FramingValue>(initial ?? DEFAULT_FRAMING);
  const containerRef = useRef<HTMLDivElement>(null);
  // Refs, not state, for the drag-in-progress bookkeeping — a drag is a fast,
  // high-frequency gesture and must never depend on a React re-render landing
  // between one pointer event and the next.
  const draggingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // setPointerCapture can throw (NotFoundError) in some browser/input
    // combinations — a real risk here (Safari's Pointer Events support is
    // notoriously inconsistent) and one that must never block the drag
    // itself: capture is a nice-to-have (keeps tracking if the cursor leaves
    // the box), not a requirement for the drag logic below.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore — dragging still works without capture
    }
    draggingRef.current = true;
    lastPointRef.current = { x: e.clientX, y: e.clientY };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    // Delta since the last event, as a percentage of the preview box — the
    // same convention every photo cropper uses: the image content follows
    // your finger/cursor 1:1, rather than the pointer's raw position becoming
    // the new focal point. Moving the finger left should reveal more of the
    // image's right side, exactly like dragging a photo left with your
    // finger on it — which is why the delta is SUBTRACTED from the current
    // object-position (increasing object-position% shows more of the image's
    // right/bottom edge).
    const dxPercent = ((e.clientX - lastPointRef.current.x) / rect.width) * 100;
    const dyPercent = ((e.clientY - lastPointRef.current.y) / rect.height) * 100;
    lastPointRef.current = { x: e.clientX, y: e.clientY };

    setValue((v) => ({
      ...v,
      x: clamp(v.x - dxPercent, 0, 100),
      y: clamp(v.y - dyPercent, 0, 100),
    }));
  }

  function handlePointerUp() {
    draggingRef.current = false;
  }

  const position = `${value.x}% ${value.y}%`;

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full overflow-hidden rounded-lg bg-[#f0f0f0] cursor-crosshair select-none touch-none"
        style={{ aspectRatio: aspect }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{
            objectPosition: position,
            transform: value.scale > 1 ? `scale(${value.scale})` : undefined,
            transformOrigin: position,
          }}
        />
        {/* Focal point marker */}
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)] pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${value.x}%`, top: `${value.y}%` }}
        />
      </div>

      <p className="text-xs text-[#999]">Drag the image to reposition it.</p>

      <div className="flex items-center gap-3">
        <label className="text-xs text-[#888] uppercase tracking-wide w-12 flex-shrink-0">Zoom</label>
        <input
          type="range"
          min={MIN_SCALE}
          max={MAX_SCALE}
          step={0.05}
          value={value.scale}
          onChange={(e) => setValue((v) => ({ ...v, scale: Number(e.target.value) }))}
          className="flex-1"
        />
        <span className="text-xs text-[#999] w-10 text-right">{Math.round(value.scale * 100)}%</span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSave(value)}
          disabled={saving}
          className="px-4 py-2 bg-[#1a1a1a] text-white text-sm rounded-full hover:opacity-80 transition-opacity disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save framing"}
        </button>
        <button
          type="button"
          onClick={() => setValue(DEFAULT_FRAMING)}
          disabled={saving}
          className="px-4 py-2 text-sm text-[#888] border border-[#e5e5e5] rounded-full hover:border-[#999] transition-colors disabled:opacity-40"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 text-sm text-[#888] hover:text-[#1a1a1a] transition-colors ml-auto disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
