"use client";

import { useState } from "react";
import type { FramingValue } from "@/components/FramingEditor";

/**
 * Shared fetch-current/save logic for the "adjust framing" modal, used by
 * both FramingButton (a small text trigger) and PhotoGrid's tiles (the whole
 * image is the tap target) — kept in one place so both stay in sync.
 */
export function useFramingModal({
  imageUrl,
  endpoint,
  onSaved,
}: {
  imageUrl: string;
  endpoint: "/api/admin/image-focus" | "/api/image-focus";
  onSaved?: (value: FramingValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initial, setInitial] = useState<FramingValue | null>(null);
  const [error, setError] = useState("");

  async function handleOpen() {
    setOpen(true);
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${endpoint}?url=${encodeURIComponent(imageUrl)}`);
      if (res.ok) {
        const data = await res.json();
        setInitial(data.focus ?? null);
      }
    } catch {
      // Non-fatal — editor just opens at the default framing.
    }
    setLoading(false);
  }

  async function handleSave(value: FramingValue) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imageUrl, ...value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed");
      }
      onSaved?.(value);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
    setSaving(false);
  }

  return { open, setOpen, loading, saving, initial, error, handleOpen, handleSave };
}
