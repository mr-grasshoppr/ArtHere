"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Compact multi-select for one artwork's medium, sized to sit under a
 * gallery thumbnail in the artist's own profile flow.
 *
 * Deliberately not MediumMultiSelect: that one renders every option as an
 * inline pill and offers a "+ New" button backed by an admin-only server
 * action, so artists would see an affordance that always fails. Here the
 * vocabulary is fixed and the whole control collapses to a single line.
 */
export function ArtworkMediumSelect({
  value,
  options,
  onChange,
  disabled = false,
}: {
  value: string[];
  options: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
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

  // One line, whatever the selection: the control sits under a thumbnail in a
  // three-across grid, so a growing list of pills would push the row apart.
  const summary =
    value.length === 0
      ? "+ Add medium"
      : value.length === 1
        ? value[0]
        : `${value[0]} +${value.length - 1}`;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full text-left truncate text-[0.72rem] px-2 py-1 rounded border transition-colors disabled:opacity-40 ${
          value.length > 0
            ? "border-[#ddd] text-[#1a1a1a] bg-white hover:border-[#999]"
            : "border-dashed border-[#ddd] text-[#aaa] hover:border-[#999] hover:text-[#666]"
        }`}
      >
        {summary}
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable
          className="absolute left-0 right-0 top-full mt-1 z-30 min-w-[150px] max-h-[220px] overflow-y-auto rounded-lg border border-[#e5e5e5] bg-white shadow-lg py-1"
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
        </div>
      )}
    </div>
  );
}
