"use client";

import { useState, useTransition } from "react";
import { addPlaceTeamMember, removePlaceTeamMember } from "../actions";

interface Member {
  userId: string;
  email: string;
  role: "owner" | "member";
}

/**
 * Admin view of who can edit this org's page — same underlying data as the
 * org's own /place/edit "Team" section (PlaceTeamManager), with admin's
 * invite/remove going through the requireAdmin-gated server actions instead
 * of the self-serve API route.
 */
export default function PlaceTeam({ placeId, initialTeam }: { placeId: string; initialTeam: Member[] }) {
  const [team, setTeam] = useState(initialTeam);
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim();
    if (!clean) return;
    setError("");
    startTransition(async () => {
      try {
        const added = await addPlaceTeamMember(placeId, clean);
        setTeam((prev) => [...prev, { userId: added.userId, email: added.email, role: "member" }]);
        setEmail("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invite failed");
      }
    });
  }

  function handleRemove(userId: string) {
    setRemovingId(userId);
    setError("");
    startTransition(async () => {
      try {
        await removePlaceTeamMember(placeId, userId);
        setTeam((prev) => prev.filter((m) => m.userId !== userId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Remove failed");
      }
      setRemovingId(null);
    });
  }

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg p-5 space-y-3">
      <h2 className="font-medium text-sm text-[#888] uppercase tracking-wide">Team</h2>

      <div className="space-y-1.5">
        {team.map((m) => (
          <div key={m.userId} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-[#1a1a1a] truncate">{m.email}</span>
              <span className="text-[0.68rem] text-[#bbb] uppercase tracking-wide flex-shrink-0">{m.role}</span>
            </div>
            {m.role === "member" && (
              <button
                type="button"
                onClick={() => handleRemove(m.userId)}
                disabled={isPending && removingId === m.userId}
                className="text-xs text-[#bbb] hover:text-red-500 transition-colors disabled:opacity-40 flex-shrink-0"
              >
                {isPending && removingId === m.userId ? "Removing…" : "Remove"}
              </button>
            )}
          </div>
        ))}
        {team.length === 0 && <p className="text-sm text-[#bbb]">No owner or team members yet.</p>}
      </div>

      <form onSubmit={handleInvite} className="flex gap-2 pt-2 border-t border-[#f0f0f0]">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@email.com"
          className="flex-1 px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:border-[#999]"
        />
        <button
          type="submit"
          disabled={isPending || !email.trim()}
          className="px-4 py-2 rounded-full bg-[#1a1a1a] text-white text-xs font-medium hover:opacity-80 transition-opacity disabled:opacity-40 whitespace-nowrap"
        >
          {isPending && !removingId ? "Inviting…" : "Invite"}
        </button>
      </form>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
