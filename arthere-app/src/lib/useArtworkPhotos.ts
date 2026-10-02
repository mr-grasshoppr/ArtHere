"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_ARTWORK_IMAGES } from "@/lib/artist-options";

/** Gallery tiles: the four pieces a profile shows, less the cover. */
export const GALLERY_SLOTS = MAX_ARTWORK_IMAGES - 1;

export type PhotoImage = {
  id: string;
  url: string;
  isHero: boolean;
  medium: string[];
  /** Admin view only: who added it. */
  uploadedBy?: string | null;
};

export type PendingUpload = { key: string; previewUrl: string; file: File; target: string; error?: string };

/**
 * How the editor talks to the server. The artist's own form and the admin
 * editor differ only here — the arrangement rules and the slots are shared.
 * Every method throws an Error with a readable message on failure.
 */
export type PhotoAdapter = {
  upload: (file: File, asHero: boolean) => Promise<{ id: string; url: string; isHero: boolean; uploadedBy?: string | null }>;
  arrange: (order: string[], heroId: string | null) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setMedium: (id: string, next: string[]) => Promise<void>;
};

/**
 * One artist's photos as the editor arranges them: the header first, then
 * the gallery slots, then anything kept back. Every change — upload,
 * replace, drag, arrow, delete — goes through here so both editors behave
 * identically.
 */
export function useArtworkPhotos(initial: PhotoImage[], adapter: PhotoAdapter) {
  const [images, setImages] = useState<PhotoImage[]>(initial);
  // Photos on their way up. Each shows in its slot straight away from the
  // local file; a failed one stays, with Retry, instead of vanishing into a
  // line of red text.
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [error, setError] = useState("");
  const uploading = pending.some((p) => !p.error);

  // Uploads finish after the render that started them, so they read the
  // arrangement (and the adapter) from here rather than from a stale closure.
  const imagesRef = useRef(images);
  useEffect(() => { imagesRef.current = images; }, [images]);
  const adapterRef = useRef(adapter);
  useEffect(() => { adapterRef.current = adapter; });

  const heroImage = images.find((img) => img.isHero) ?? images[0] ?? null;
  const otherImages = images.filter((img) => img.id !== heroImage?.id);
  // A profile shows a header and three gallery pieces. Anything past that
  // is kept — uploads are never refused — and shown as not visible, for the
  // artist to swap in. lib/artist-images is the same rule server side, and
  // the city grid draws on that slice alone.
  const galleryImages = otherImages.slice(0, GALLERY_SLOTS);
  const hiddenImages = otherImages.slice(GALLERY_SLOTS);

  /**
   * Saves which pieces the profile shows, and in what order. The whole
   * arrangement goes in one request — a sequence of moves can leave two
   * pieces claiming one slot if a request fails midway.
   */
  async function arrange(next: PhotoImage[], heroId: string | null) {
    const previous = imagesRef.current;
    setImages(next.map((img) => ({ ...img, isHero: img.id === heroId })));
    try {
      await adapterRef.current.arrange(next.map((img) => img.id), heroId);
    } catch (err) {
      setImages(previous);
      setError(err instanceof Error ? err.message : "Could not save that change.");
    }
  }

  // ─── Uploading ───────────────────────────────────────────────────────

  function enqueue(file: File, target: string): PendingUpload {
    const p = { key: crypto.randomUUID(), previewUrl: URL.createObjectURL(file), file, target };
    setPending((prev) => [...prev, p]);
    return p;
  }

  function settle(key: string) {
    setPending((prev) => {
      const done = prev.find((p) => p.key === key);
      if (done) URL.revokeObjectURL(done.previewUrl);
      return prev.filter((p) => p.key !== key);
    });
  }

  /** Uploads one queued photo and puts it where its target says. */
  async function runUpload(p: PendingUpload) {
    setPending((prev) => prev.map((x) => (x.key === p.key ? { ...x, error: undefined } : x)));
    try {
      const cur = imagesRef.current;
      const curHero = cur.find((img) => img.isHero) ?? cur[0] ?? null;
      const rest = cur.filter((img) => img.id !== curHero?.id);
      const asHero = p.target === "hero" || (p.target === "add" && cur.length === 0);
      const data = await adapterRef.current.upload(p.file, asHero);
      const uploaded: PhotoImage = { id: data.id, url: data.url, isHero: false, medium: [], uploadedBy: data.uploadedBy };
      if (p.target === "hero") {
        // The header that was there is kept, at the back rather than pushed
        // into the gallery: changing a header shouldn't quietly rearrange
        // the three pieces underneath it.
        await arrange([{ ...uploaded, isHero: true }, ...rest, ...(curHero ? [curHero] : [])], uploaded.id);
      } else if (p.target === "add") {
        const first = cur.length === 0;
        setImages((prev) => {
          const base = first ? prev.map((img) => ({ ...img, isHero: false })) : prev;
          return [...base, { ...uploaded, isHero: data.isHero }];
        });
      } else {
        // Replacing a gallery piece: the new one takes that slot and the old
        // one moves to the back, still there if the artist wants it again.
        const replaced = cur.find((img) => img.id === p.target);
        await arrange(
          [
            ...(curHero ? [curHero] : []),
            ...rest.map((img) => (img.id === p.target ? uploaded : img)),
            ...(replaced ? [replaced] : []),
          ],
          curHero?.id ?? null
        );
      }
      settle(p.key);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setPending((prev) => prev.map((x) => (x.key === p.key ? { ...x, error: message } : x)));
    }
  }

  function placeHero(file: File) {
    runUpload(enqueue(file, "hero"));
  }

  function replacePiece(oldId: string, file: File) {
    runUpload(enqueue(file, oldId));
  }

  // One after another, so each lands after the last and the first photo on an
  // empty profile becomes the header.
  async function addPieces(files: File[]) {
    const queued = files.map((f) => enqueue(f, "add"));
    for (const p of queued) await runUpload(p);
  }

  function retryUpload(key: string) {
    const p = pending.find((x) => x.key === key);
    if (p) runUpload(p);
  }

  function pickFiles(e: React.ChangeEvent<HTMLInputElement>, onFiles: (files: File[]) => void) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length) onFiles(files);
  }

  // ─── Arranging ───────────────────────────────────────────────────────

  /** Move a kept-back piece into the last gallery slot, and that one out. */
  function showInGallery(id: string) {
    const piece = images.find((img) => img.id === id);
    if (!piece || !heroImage) return;
    const rest = otherImages.filter((img) => img.id !== id);
    arrange([heroImage, ...rest.slice(0, GALLERY_SLOTS - 1), piece, ...rest.slice(GALLERY_SLOTS - 1)], heroImage.id);
  }

  /** Make a piece the header; the old header takes the slot it vacated. */
  function makeHeader(id: string) {
    const piece = images.find((img) => img.id === id);
    if (!piece || !heroImage) return;
    arrange([piece, ...otherImages.map((img) => (img.id === id ? heroImage : img))], id);
  }

  /** Dragging one piece onto another trades their places, header included. */
  function swapPieces(aId: string, bId: string) {
    const ordered = heroImage ? [heroImage, ...otherImages] : [];
    const i = ordered.findIndex((img) => img.id === aId);
    const j = ordered.findIndex((img) => img.id === bId);
    if (i < 0 || j < 0 || i === j) return;
    const next = [...ordered];
    [next[i], next[j]] = [next[j], next[i]];
    arrange(next, next[0].id);
  }

  /** Arrow buttons: the same swap as dragging, for touch screens and keyboards. */
  function stepPiece(id: string, by: -1 | 1) {
    const ordered = heroImage ? [heroImage, ...otherImages] : [];
    const i = ordered.findIndex((img) => img.id === id);
    const neighbour = ordered[i + by];
    if (i >= 0 && neighbour) swapPieces(id, neighbour.id);
  }

  /** Dropping a piece on an empty slot moves it to the end of the gallery. */
  function moveToGalleryEnd(id: string) {
    if (!heroImage || id === heroImage.id) return;
    const piece = otherImages.find((img) => img.id === id);
    if (!piece) return;
    const others = otherImages.filter((img) => img.id !== id);
    const shown = galleryImages.filter((img) => img.id !== id).length;
    arrange([heroImage, ...others.slice(0, shown), piece, ...others.slice(shown)], heroImage.id);
  }

  async function removeImage(id: string) {
    setError("");
    const previous = images;
    setImages((prev) => {
      const remaining = prev.filter((img) => img.id !== id);
      // Taking the header away promotes the next piece, as the server does.
      if (prev.find((img) => img.id === id)?.isHero && remaining.length > 0) {
        remaining[0] = { ...remaining[0], isHero: true };
      }
      return remaining;
    });
    try {
      await adapterRef.current.remove(id);
    } catch (err) {
      setImages(previous);
      setError(err instanceof Error ? err.message : "Could not remove that piece.");
    }
  }

  // Saved per piece as it's toggled rather than with the rest of the profile:
  // artwork rows are created by the upload endpoint, so they already exist and
  // there's nothing to batch them with.
  async function updateMedium(id: string, next: string[]) {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, medium: next } : img)));
    try {
      await adapterRef.current.setMedium(id, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save medium.");
    }
  }

  return {
    images, heroImage, galleryImages, hiddenImages,
    pending, uploading, error, setError,
    placeHero, replacePiece, addPieces, retryUpload, settle, pickFiles,
    showInGallery, makeHeader, swapPieces, stepPiece, moveToGalleryEnd,
    removeImage, updateMedium,
  };
}

export type ArtworkPhotos = ReturnType<typeof useArtworkPhotos>;
