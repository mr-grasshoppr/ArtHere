"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createArtist } from "./actions";

// Deliberately creates an artist profile from admin — no owner account
// needed up front, matching how organizations already work. Useful for
// building a prototype page to pitch an artist before they've agreed to
// anything; an owner email can be attached later via the invite flow.
export default function NewArtistForm() {
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
        const id = await createArtist(trimmed);
        router.push(`/admin/artists/${id}/edit`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create artist profile");
      }
    });
  }

  return (
    <form onSubmit={handleCreate} className="bg-white border border-[#e5e5e5] rounded-lg p-4 flex items-center gap-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New artist name…"
        className="flex-1 px-3 py-2 border border-[#e5e5e5] rounded-lg bg-white text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[#999] text-sm"
      />
      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="px-5 py-2 bg-[#1a1a1a] text-white text-sm rounded-full hover:opacity-80 transition-opacity disabled:opacity-40 whitespace-nowrap"
      >
        {pending ? "Creating…" : "+ New artist"}
      </button>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </form>
  );
}
