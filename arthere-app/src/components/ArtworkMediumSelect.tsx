"use client";

import { useEffect, useRef, useState } from "react";
import { addMediumOption } from "@/lib/medium-options-actions";

/**
 * How one artwork gets its medium tag, sized to sit under a gallery
 * thumbnail: the tags already chosen show as pills you can remove, and a
 * dashed "+ Tag medium" pill opens the list to add more. An untagged piece
 * reads as an invitation, not as a missing field.
 *
 * The vocabulary is fixed for artists. Admins pass `onOptionsChange` to also
 * get a "New label" row that adds to the shared list.
 */
export function ArtworkMediumSelect({
  value,
  options,
  onChange,
  onOptionsChange,
  disabled = false,
}: {
  value: string[];
  options: string[];
  onChange: (next: string[]) => void;
  /** Admin only: called with the full list after a new label is created. */
  onOptionsChange?: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle(option: string) {
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  }

  async function createLabel() {
    const label = draft.trim();
    setDraft("");
    if (!label) return;
    const next = await addMediumOption(label);
    onOptionsChange?.(next);
    if (!value.includes(label)) onChange([...value, label]);
  }

  return (
    <div ref={wrapRef} className="relative flex flex-wrap items-center gap-1">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-[#1a1a1a] text-white text-[0.68rem] leading-tight"
        >
          {tag}
          <button
            type="button"
            disabled={disabled}
            onClick={() => toggle(tag)}
            aria-label={`Remove ${tag}`}
            className="w-3.5 h-3.5 rounded-full text-white/70 hover:text-white hover:bg-white/20 leading-none transition-colors"
          >×</button>
        </span>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="px-2 py-0.5 rounded-full border border-dashed border-[#bbb] text-[#777] text-[0.68rem] leading-tight hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors disabled:opacity-40"
      >
        {value.length === 0 ? "+ Tag medium" : "+ Add"}
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable
          className="absolute left-0 top-full mt-1 z-30 min-w-[170px] max-h-[240px] overflow-y-auto rounded-lg border border-[#e5e5e5] bg-white shadow-lg py-1"
        >
          {options.map((option) => {
            const selected = value.includes(option);
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => toggle(option)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-[0.78rem] text-[#333] hover:bg-[#f5f5f5] transition-colors"
              >
                <span
                  className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center flex-shrink-0 ${
                    selected ? "bg-[#1a1a1a] border-[#1a1a1a]" : "border-[#ccc]"
                  }`}
                >
                  {selected && (
                    <svg viewBox="0 0 10 8" className="w-2 h-2 fill-none stroke-white stroke-2">
                      <path d="M1 4l2.5 2.5L9 1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="truncate">{option}</span>
              </button>
            );
          })}
          {onOptionsChange && (
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); createLabel(); }
              }}
              placeholder="+ New label…"
              className="w-[calc(100%-1rem)] mx-2 mt-1 mb-1 px-2 py-1 text-[0.75rem] border border-dashed border-[#ccc] rounded outline-none focus:border-[#1a1a1a]"
            />
          )}
        </div>
      )}
    </div>
  );
}
