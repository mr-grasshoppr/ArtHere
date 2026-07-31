"use client";

import { FramingEditor, type FramingValue } from "./FramingEditor";
import { useFramingModal } from "@/lib/useFramingModal";

/**
 * Small "Adjust framing" trigger + modal, wired to one of the image-focus API
 * routes. Drop this next to any uploaded image (admin or self-service) to let
 * a human override the auto-detected crop.
 */
export function FramingButton({
  imageUrl,
  endpoint,
  aspect = "16 / 9",
  className = "",
  label = "Adjust framing",
  onSaved,
}: {
  imageUrl: string;
  /** Which API route owns this image: admin-only or self-service (ownership-checked). */
  endpoint: "/api/admin/image-focus" | "/api/image-focus";
  aspect?: string;
  className?: string;
  label?: string;
  /** Called with the new value right after a successful save, so the caller's
   *  own preview (outside this modal) can update immediately instead of only
   *  reflecting the change on next full page load. */
  onSaved?: (value: FramingValue) => void;
}) {
  const { open, setOpen, loading, saving, initial, error, handleOpen, handleSave } =
    useFramingModal({ imageUrl, endpoint, onSaved });

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={className || "text-xs text-white bg-black/50 rounded px-2 py-1 hover:bg-black/70 transition-colors"}
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-xl p-5 w-full max-w-[480px] shadow-xl">
            <h3 className="text-sm font-medium text-[#1a1a1a] mb-3">Adjust framing</h3>
            {loading ? (
              <p className="text-sm text-[#999]">Loading…</p>
            ) : (
              <FramingEditor
                imageUrl={imageUrl}
                initial={initial}
                aspect={aspect}
                saving={saving}
                onSave={handleSave}
                onCancel={() => setOpen(false)}
              />
            )}
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
