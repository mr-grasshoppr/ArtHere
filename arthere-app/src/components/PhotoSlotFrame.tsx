"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

// Marks a drag that is one of the artist's own photos being reordered, as
// opposed to a file coming in from the desktop.
const IMAGE_DRAG_TYPE = "application/x-arthere-image";

const IMAGE_FILE = /^image\/(jpeg|png|webp)$/;

// Touch screens get no native drag-and-drop, so a held finger does it by hand.
const LONG_PRESS_MS = 400;
const MOVE_TOLERANCE_PX = 10;

// Every mounted slot, by key, so a finger released over one can find its handler.
const slots = new Map<string, (fromId: string) => void>();

function slotAt(x: number, y: number): HTMLElement | null {
  return document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-photo-slot]") ?? null;
}

/**
 * Drop target (and, when it holds a photo, drag source) for one photo slot.
 * Handles every way something can land on it: a file from the desktop,
 * another slot's photo dragged over with a mouse, or one held for a moment
 * on a touch screen — it lifts to show it can be moved, then follows the
 * finger to the slot it should swap with.
 */
export function PhotoSlotFrame({
  imageId,
  onFiles,
  onMove,
  className = "",
  style,
  children,
}: {
  /** The photo this slot holds; omit for an empty slot, which can't be dragged. */
  imageId?: string;
  onFiles: (files: File[]) => void;
  /** Another photo was dropped here: swap it with this slot. */
  onMove: (fromId: string) => void;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const [over, setOver] = useState(false);
  const [lift, setLift] = useState<{ dx: number; dy: number } | null>(null);
  // Once a finger has touched this slot, the browser's own drag is switched
  // off so it can't compete with the hold-to-lift below.
  const [touched, setTouched] = useState(false);
  const pressTimer = useRef<number | null>(null);
  const pressStart = useRef({ x: 0, y: 0 });
  const autoId = useId();
  const key = imageId ?? autoId;
  const onMoveRef = useRef(onMove);
  useEffect(() => { onMoveRef.current = onMove; });
  useEffect(() => {
    slots.set(key, (from) => onMoveRef.current(from));
    return () => { slots.delete(key); };
  }, [key]);

  function cancelPress() {
    if (pressTimer.current !== null) window.clearTimeout(pressTimer.current);
    pressTimer.current = null;
  }

  function beginLift(from: string, start: { x: number; y: number }) {
    pressTimer.current = null;
    navigator.vibrate?.(15);
    setLift({ dx: 0, dy: 0 });
    let target: HTMLElement | null = null;

    // Without this the page scrolls under the finger instead of the photo moving.
    const stopScroll = (ev: TouchEvent) => ev.preventDefault();
    const move = (ev: PointerEvent) => {
      setLift({ dx: ev.clientX - start.x, dy: ev.clientY - start.y });
      const next = slotAt(ev.clientX, ev.clientY);
      if (next !== target) {
        target?.removeAttribute("data-drop-target");
        next?.setAttribute("data-drop-target", "true");
        target = next;
      }
    };
    const finish = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      window.removeEventListener("touchmove", stopScroll);
      target?.removeAttribute("data-drop-target");
      setLift(null);
      const to = target?.dataset.photoSlot;
      if (ev.type === "pointerup" && to && to !== key) slots.get(to)?.(from);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    window.addEventListener("touchmove", stopScroll, { passive: false });
  }

  function accepts(e: React.DragEvent) {
    const types = Array.from(e.dataTransfer.types);
    return types.includes("Files") || types.includes(IMAGE_DRAG_TYPE);
  }

  return (
    <div
      data-photo-slot={key}
      className={`${className} ${over ? "ring-2 ring-[#1a1a1a] ring-offset-2" : ""} data-[drop-target=true]:ring-2 data-[drop-target=true]:ring-[#1a1a1a] data-[drop-target=true]:ring-offset-2`}
      style={{
        ...style,
        ...(imageId ? { WebkitTouchCallout: "none", userSelect: "none" } : null),
        ...(lift
          ? {
              transform: `translate(${lift.dx}px, ${lift.dy}px) scale(1.05)`,
              zIndex: 50,
              opacity: 0.92,
              boxShadow: "0 12px 28px rgba(0,0,0,.28)",
              // So the slot under the finger, not this one, is what gets found.
              pointerEvents: "none",
              transition: "none",
            }
          : null),
      }}
      draggable={!!imageId && !touched}
      onPointerDown={(e) => {
        if (!imageId || e.pointerType !== "touch") return;
        setTouched(true);
        pressStart.current = { x: e.clientX, y: e.clientY };
        const start = { ...pressStart.current };
        pressTimer.current = window.setTimeout(() => beginLift(imageId, start), LONG_PRESS_MS);
      }}
      onPointerMove={(e) => {
        if (pressTimer.current === null) return;
        const moved = Math.hypot(e.clientX - pressStart.current.x, e.clientY - pressStart.current.y);
        // A swipe is the page scrolling, not a hold.
        if (moved > MOVE_TOLERANCE_PX) cancelPress();
      }}
      onPointerUp={cancelPress}
      onPointerCancel={cancelPress}
      // A long press on Android would otherwise open the image menu.
      onContextMenu={(e) => { if (touched && imageId) e.preventDefault(); }}
      onDragStart={(e) => {
        if (!imageId) return;
        e.dataTransfer.setData(IMAGE_DRAG_TYPE, imageId);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        if (!accepts(e)) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={(e) => {
        // Moving onto a child fires leave on the frame; only clear when the
        // pointer has actually left it.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={(e) => {
        if (!accepts(e)) return;
        e.preventDefault();
        setOver(false);
        const from = e.dataTransfer.getData(IMAGE_DRAG_TYPE);
        if (from) {
          if (from !== imageId) onMove(from);
          return;
        }
        const files = Array.from(e.dataTransfer.files).filter((f) => IMAGE_FILE.test(f.type));
        if (files.length) onFiles(files);
      }}
    >
      {children}
    </div>
  );
}

/** Sits over a slot while its photo uploads, or says why it didn't. */
export function UploadOverlay({
  previewUrl,
  error,
  onRetry,
  onDismiss,
}: {
  previewUrl: string;
  error?: string;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="absolute inset-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={previewUrl} alt="" className="w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0 bg-white/60 flex flex-col items-center justify-center gap-2 p-2 text-center">
        {error ? (
          <>
            <span className="text-xs text-red-600">{error}</span>
            <span className="flex gap-3 text-xs">
              <button type="button" onClick={onRetry} className="underline underline-offset-2 text-[#1a1a1a]">Retry</button>
              <button type="button" onClick={onDismiss} className="underline underline-offset-2 text-[#777]">Dismiss</button>
            </span>
          </>
        ) : (
          <>
            <span className="text-xs text-[#1a1a1a]">Uploading…</span>
            <span className="w-2/3 h-1 rounded bg-black/10 overflow-hidden">
              <span className="block h-full w-1/3 bg-[#07b26b] animate-pulse" />
            </span>
          </>
        )}
      </div>
    </div>
  );
}
