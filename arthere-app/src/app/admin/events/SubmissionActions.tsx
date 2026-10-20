"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { dismissSubmission, publishSubmission } from "./actions";

export function SubmissionActions({
  id,
  placeId,
  isNewVenue,
  places,
}: {
  id: string;
  placeId: string | null;
  isNewVenue: boolean;
  places: { id: string; name: string }[];
}) {
  const [chosen, setChosen] = useState(placeId ?? "");
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <div className="flex flex-col gap-2 items-end text-xs">
      <select value={chosen} onChange={(e) => setChosen(e.target.value)} className="border border-[#ddd] rounded px-2 py-1 max-w-[200px]">
        <option value="">{isNewVenue ? "Pick place once onboarded…" : "Pick a place…"}</option>
        {places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <div className="flex gap-2">
        <button
          disabled={pending || !chosen}
          className="px-3 py-1 rounded-full bg-[#1a1a1a] text-white font-medium disabled:opacity-40"
          onClick={() => start(async () => { try { await publishSubmission(id, chosen); } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } })}
        >
          Publish event
        </button>
        <button disabled={pending} className="px-3 py-1 rounded-full border border-[#ddd]" onClick={() => start(() => dismissSubmission(id))}>
          Dismiss
        </button>
      </div>
      {isNewVenue && <Link href="/admin/organizations" className="underline text-[#888]">Add the organization →</Link>}
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}
