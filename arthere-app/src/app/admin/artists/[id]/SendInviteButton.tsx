"use client";

import { useState } from "react";
import Link from "next/link";
import { previewArtistInvite, sendArtistInvite } from "./actions";
import { InvitePreviewModal } from "@/components/admin/InvitePreviewModal";
import type { InvitePreview } from "@/lib/magic-link";

// Sends the first-time onboarding invite to an artist. The owner email itself
// is set on the Edit Profile page (the one place it's entered and saved) —
// this button only ever sends to that address, it doesn't collect a new one,
// so typing an email here can no longer look like it "saved" without an
// invite actually going out.
export function SendInviteButton({
  artistId,
  editHref,
  email,
}: {
  artistId: string;
  editHref: string;
  email: string | null;
}) {
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [wasSent, setWasSent] = useState(false);

  async function handlePreview() {
    if (!email) return;
    setState("loading");
    setErrorMsg("");
    try {
      setPreview(await previewArtistInvite(artistId, email));
      setState("idle");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }

  if (state === "sent") {
    return <p className="text-xs text-green-600">✓ Invite sent to {email}</p>;
  }

  if (!email) {
    return (
      <Link
        href={editHref}
        className="text-xs text-[#888] hover:text-[#1a1a1a] underline underline-offset-2 transition-colors"
      >
        Add an owner email in Edit Profile to send an invite →
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handlePreview}
        disabled={state === "loading"}
        className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#1a1a1a] text-white text-xs font-medium hover:opacity-80 transition-opacity disabled:opacity-40"
      >
        {state === "loading" ? "Preparing…" : `Send profile invite to ${email} ↗`}
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
