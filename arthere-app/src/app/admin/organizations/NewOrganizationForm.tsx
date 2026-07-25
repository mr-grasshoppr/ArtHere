"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrganization } from "./actions";

// Deliberately creates an organization page from admin — the only way a Place
// is created now that artists no longer spawn them by typing a venue name.
export default function NewOrganizationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setError("");
    startTransition(async () => {
      try {
        const id = await createOrganization(trimmed);
        router.push(`/admin/organizations/${id}/edit`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create organization");
      }
    });
  }

  return (
    <form onSubmit={handleCreate} className="bg-white border border-[#e5e5e5] rounded-lg p-4 flex items-center gap-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New organization name…"
        className="flex-1 px-3 py-2 border border-[#e5e5e5] rounded-lg bg-white text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[#999] text-sm"
      />
      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="px-5 py-2 bg-[#1a1a1a] text-white text-sm rounded-full hover:opacity-80 transition-opacity disabled:opacity-40 whitespace-nowrap"
      >
        {pending ? "Creating…" : "+ New organization"}
      </button>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </form>
  );
}
