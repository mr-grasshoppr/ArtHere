"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDraftArtistFromEmail } from "@/app/admin/artists/interested-actions";

/**
 * Turns a Contact Tracking / Contact Submissions row into a placeholder
 * artist profile, prefilled from whatever's on file for that email (website/
 * social, community connections), then jumps straight to editing it. No
 * invite is sent — this just gets a draft started for the admin to finish.
 */
export function CreateDraftProfileButton({ email, className }: { email: string; className?: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleClick() {
    setState("loading");
    setErrorMsg("");
    try {
      const { artistId } = await createDraftArtistFromEmail(email);
      router.push(`/admin/artists/${artistId}/edit`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "loading"}
        className={
          className ??
          "text-xs px-3 py-1.5 rounded border border-[#e5e5e5] text-[#888] hover:border-[#999] transition-colors disabled:opacity-40 whitespace-nowrap"
        }
      >
        {state === "loading" ? "Creating…" : "Create draft profile →"}
      </button>
      {state === "error" && <p className="text-xs text-red-500">{errorMsg || "Failed"}</p>}
    </div>
  );
}
