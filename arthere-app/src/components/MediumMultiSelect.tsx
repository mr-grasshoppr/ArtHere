"use client";

import { useState, useTransition } from "react";
import { addMediumOption } from "@/lib/medium-options-actions";

/**
 * Multi-select pills for an artwork/artist's medium, plus an admin-only
 * "+ New" affordance that mints a new label into the shared MediumOption
 * table (rather than a free-text field only that one artwork can use).
 */
export function MediumMultiSelect({
  value,
  onChange,
  options,
  onOptionsChange,
  size = "sm",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  options: string[];
  /** Called with the full updated option list after a new label is added. */
  onOptionsChange?: (next: string[]) => void;
  size?: "sm" | "md";
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  function toggle(option: string) {
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  }

  function submitNewLabel() {
    const label = draft.trim();
    setAdding(false);
    setDraft("");
    if (!label) return;
    startTransition(async () => {
      const next = await addMediumOption(label);
      onOptionsChange?.(next);
      onChange(value.includes(label) ? value : [...value, label]);
    });
  }

  const pillCls =
    size === "sm"
      ? "px-1.5 py-0.5 rounded-full text-[10px] border transition-colors"
      : "px-3 py-1.5 rounded-full text-[0.85rem] border transition-colors";

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => toggle(option)}
          className={`${pillCls} ${
            value.includes(option)
              ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
              : "bg-white text-[#666] border-[#e5e5e5] hover:border-[#999]"
          }`}
        >
          {option}
        </button>
      ))}
      {adding ? (
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); submitNewLabel(); }
            if (e.key === "Escape") { setAdding(false); setDraft(""); }
          }}
          onBlur={submitNewLabel}
          placeholder="New label…"
          disabled={isPending}
          className={`${pillCls} border-dashed border-[#999] outline-none w-24`}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          disabled={isPending}
          className={`${pillCls} border-dashed border-[#bbb] text-[#999] hover:border-[#999] hover:text-[#1a1a1a]`}
        >
          + New
        </button>
      )}
    </div>
  );
}
