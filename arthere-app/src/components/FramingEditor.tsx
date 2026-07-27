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
 * Click or drag anywhere on the preview to move the focal point there; the
 * zoom slider scales in/out around that same point. Opens as an inline panel
 * (caller decides whether to wrap it in a modal).
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
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function setFromPointer(e: { clientX: number; clientY: number }) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100);
    setValue((v) => ({ ...v, x, y }));
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    setFromPointer(e);
  }
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setFromPointer(e);
  }
  function handlePointerUp() {
    setDragging(false);
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

      <p className="text-xs text-[#999]">Click or drag on the image to set the focus point.</p>

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
