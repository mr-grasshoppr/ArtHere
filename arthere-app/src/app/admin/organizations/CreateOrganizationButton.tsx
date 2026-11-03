"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrganization } from "./actions";

// No name field up front — this creates a bare draft page and drops the admin
// straight into the edit flow, where the real name gets entered. Mirrors
// CreateArtistButton.
export default function CreateOrganizationButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    setError("");
    startTransition(async () => {
      try {
        const id = await createOrganization();
        router.push(`/admin/organizations/${id}/edit`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create organization");
      }
    });
  }

  return (
    <>
      <button
        onClick={handleCreate}
        disabled={pending}
        className="px-6 py-3 bg-[#1a1a1a] text-white text-sm font-medium rounded-full hover:opacity-80 transition-opacity disabled:opacity-40 whitespace-nowrap"
      >
        {pending ? "Creating…" : "+ Create New"}
      </button>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </>
  );
}
