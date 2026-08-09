"use client";

import { useState } from "react";
import { previewArtistInvite, sendArtistInvite } from "./actions";
import { InvitePreviewModal } from "@/components/admin/InvitePreviewModal";
import type { InvitePreview } from "@/lib/magic-link";

// Sends the first-time onboarding invite to an artist. Needs an email —
// prefilled from the artist's owner account when one exists, otherwise the
// admin types one and it's provisioned on send (e.g. a profile created bare
// via "+ New artist" has no owner yet).
export function SendInviteButton({ artistId, initialEmail }: { artistId: string; initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [wasSent, setWasSent] = useState(false);

  async function handlePreview() {
    if (!email.trim()) return;
    setState("loading");
    setErrorMsg("");
    try {
      setPreview(await previewArtistInvite(artistId, email.trim()));
      setState("idle");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }

  if (state === "sent") {
    return <p className="text-xs text-green-600">✓ Invite sent to {email}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="owner@email.com"
        className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-xs focus:outline-none focus:border-[#999]"
      />
      <button
        onClick={handlePreview}
        disabled={state === "loading" || !email.trim()}
        className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#1a1a1a] text-white text-xs font-medium hover:opacity-80 transition-opacity disabled:opacity-40"
      >
        {state === "loading" ? "Preparing…" : "Send profile invite ↗"}
      </button>
      {state === "error" && <p className="text-xs text-red-500">Failed: {errorMsg || "unknown error"}</p>}

      {preview && (
        <InvitePreviewModal
          email={preview.email}
          link={preview.link}
          initialGreetingName={preview.greetingName}
          initialSubject={preview.subject}
          initialBodyText={preview.bodyText}
          onClose={() => {
            setPreview(null);
            if (wasSent) setState("sent");
          }}
          onSend={async (subject, bodyText, greetingName) => {
            await sendArtistInvite(artistId, { email: preview.email, link: preview.link, subject, bodyText, greetingName });
            setWasSent(true);
          }}
        />
      )}
    </div>
  );
}
