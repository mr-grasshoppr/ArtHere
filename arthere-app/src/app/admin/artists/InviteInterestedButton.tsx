"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { previewInterestedInvite } from "./interested-actions";
import { sendArtistInvite } from "./[id]/actions";
import { InvitePreviewModal } from "@/components/admin/InvitePreviewModal";
import type { InvitePreview } from "@/lib/magic-link";

// First-invite action for a row in the "Interested" tab — converts the
// contact submission into a placeholder artist (if not already done) and
// opens the same preview/edit-before-send modal the regular per-artist
// invite flow uses, prefilled with the "first featured artists" welcome copy.
export function InviteInterestedButton({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [preview, setPreview] = useState<(InvitePreview & { artistId: string }) | null>(null);
  const [wasSent, setWasSent] = useState(false);

  async function handleOpen() {
    setState("loading");
    setErrorMsg("");
    try {
      setPreview(await previewInterestedInvite(submissionId));
      setState("idle");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }

  if (state === "sent") {
    return <p className="text-xs text-green-600">✓ Invite sent</p>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleOpen}
        disabled={state === "loading"}
        className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#1a1a1a] text-white text-xs font-medium hover:opacity-80 transition-opacity disabled:opacity-40 whitespace-nowrap"
      >
        {state === "loading" ? "Preparing…" : "Invite to build profile →"}
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
            await sendArtistInvite(preview.artistId, { email: preview.email, link: preview.link, subject, bodyText, greetingName });
            setWasSent(true);
            // Only now does this submission "move" from Not yet invited to
            // Invited — awaiting profile; refresh so the list picks that up.
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
