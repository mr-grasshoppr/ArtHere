"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createArtist } from "./actions";

// Deliberately creates an artist profile from admin — Artist.userId is
// required (unlike Place), so this needs an email up front to provision the
// owner account immediately rather than deferring it to later.
export default function NewArtistForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail) return;
    setError("");
    startTransition(async () => {
      try {
        const id = await createArtist(trimmedName, trimmedEmail);
        router.push(`/admin/artists/${id}/edit`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create artist profile");
      }
    });
  }

  return (
    <form onSubmit={handleCreate} className="bg-white border border-[#e5e5e5] rounded-lg p-4 flex items-center gap-3 flex-wrap">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New artist name…"
        className="flex-1 min-w-[160px] px-3 py-2 border border-[#e5e5e5] rounded-lg bg-white text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[#999] text-sm"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="owner@email.com"
        className="flex-1 min-w-[180px] px-3 py-2 border border-[#e5e5e5] rounded-lg bg-white text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[#999] text-sm"
      />
      <button
        type="submit"
        disabled={pending || !name.trim() || !email.trim()}
        className="px-5 py-2 bg-[#1a1a1a] text-white text-sm rounded-full hover:opacity-80 transition-opacity disabled:opacity-40 whitespace-nowrap"
      >
        {pending ? "Creating…" : "+ New artist"}
      </button>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </form>
  );
}
