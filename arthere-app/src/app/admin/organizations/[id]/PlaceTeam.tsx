"use client";

import { useState, useTransition } from "react";
import { addPlaceTeamMember, previewPlaceTeamInvite, removePlaceTeamMember, sendPlaceInvite } from "../actions";
import { InvitePreviewModal } from "@/components/admin/InvitePreviewModal";
import type { InvitePreview } from "@/lib/magic-link";

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
  const [preview, setPreview] = useState<InvitePreview | null>(null);

  function handleInvite(e: React.SyntheticEvent) {
    e.preventDefault();
    const clean = email.trim();
    if (!clean) return;
    setError("");
    startTransition(async () => {
      try {
        const { userId, ...invite } = await addPlaceTeamMember(placeId, clean);
        setTeam((prev) => (prev.some((m) => m.userId === userId) ? prev : [...prev, { userId, email: invite.email, role: "member" }]));
        setEmail("");
        setPreview(invite);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invite failed");
      }
    });
  }

  function handleResend(userId: string) {
    setError("");
    startTransition(async () => {
      try {
        setPreview(await previewPlaceTeamInvite(placeId, userId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't prepare the invite");
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
    <div className="space-y-3">
      <div>
        <h3 className="block text-xs text-[#888] uppercase tracking-wide mb-1">Other page admins</h3>
        <p className="text-xs text-[#999]">They can edit this page too. Add one by email, then preview and send their sign-in link (no password needed). Closing the preview still adds them, without emailing.</p>
      </div>

      <div className="space-y-1.5">
        {team.filter((m) => m.role === "member").map((m) => (
          <div key={m.userId} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-[#1a1a1a] truncate">{m.email}</span>
                          </div>
            {m.role === "member" && (
              <div className="flex items-center gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleResend(m.userId)}
                disabled={isPending}
                className="text-xs text-[#bbb] hover:text-[#1a1a1a] transition-colors disabled:opacity-40"
              >
                Send invite
              </button>
              <button
                type="button"
                onClick={() => handleRemove(m.userId)}
                disabled={isPending && removingId === m.userId}
                className="text-xs text-[#bbb] hover:text-red-500 transition-colors disabled:opacity-40 flex-shrink-0"
              >
                {isPending && removingId === m.userId ? "Removing…" : "Remove"}
              </button>
              </div>
            )}
          </div>
        ))}
        {!team.some((m) => m.role === "member") && <p className="text-sm text-[#bbb]">No other page admins yet.</p>}
      </div>

      {/* A div, not a form: this sits inside the page editor's own form, and a nested submit would save the whole page. */}
      <div className="flex gap-2 pt-2 border-t border-[#f0f0f0]">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleInvite(e); }}
          placeholder="another-admin@email.com"
          className="flex-1 px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:border-[#999]"
        />
        <button
          type="button"
          onClick={handleInvite}
          disabled={isPending || !email.trim()}
          className="px-4 py-2 rounded-full bg-[#1a1a1a] text-white text-xs font-medium hover:opacity-80 transition-opacity disabled:opacity-40 whitespace-nowrap"
        >
          {isPending && !removingId ? "Inviting…" : "Invite"}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}

      {preview && (
        <InvitePreviewModal
          email={preview.email}
          link={preview.link}
          initialGreetingName={preview.greetingName}
          initialSubject={preview.subject}
          initialBodyText={preview.bodyText}
          onClose={() => setPreview(null)}
          onSend={async (subject, bodyText, greetingName) => {
            await sendPlaceInvite(placeId, { email: preview.email, link: preview.link, subject, bodyText, greetingName });
          }}
        />
      )}
    </div>
  );
}
