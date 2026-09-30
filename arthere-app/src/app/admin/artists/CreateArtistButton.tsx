"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createArtist } from "./actions";

// No name field up front — this creates a bare placeholder profile and drops
// the admin straight into the edit flow, where the real name gets entered.
// Kept separate from the search field so the two don't get confused for one
// combined control.
export default function CreateArtistButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    startTransition(async () => {
      const id = await createArtist();
      router.push(`/admin/artists/${id}/edit`);
    });
  }

  return (
    <button
      onClick={handleCreate}
      disabled={pending}
      className="px-6 py-3 bg-[#1a1a1a] text-white text-sm font-medium rounded-full hover:opacity-80 transition-opacity disabled:opacity-40 whitespace-nowrap"
    >
      {pending ? "Creating…" : "+ Create New"}
    </button>
  );
}
