"use client";

import { useState } from "react";
import { sendPlaceInvite } from "../actions";

// Sends the first-time onboarding invite to an organization. Needs an email —
// prefilled from the org's owner account when one exists, otherwise the admin
// types one and it's provisioned on send.
export function SendPlaceInviteButton({ placeId, initialEmail }: { placeId: string; initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSend() {
    if (!email.trim()) return;
    setState("sending");
    try {
      await sendPlaceInvite(placeId, email.trim());
      setState("sent");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }

  if (state === "sent") {
    return <p className="text-xs text-green-600">✓ Onboarding invite sent to {email}</p>;
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
        onClick={handleSend}
        disabled={state === "sending" || !email.trim()}
        className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#1a1a1a] text-white text-xs font-medium hover:opacity-80 transition-opacity disabled:opacity-40"
      >
        {state === "sending" ? "Sending…" : "Send onboarding invite ↗"}
      </button>
      {state === "error" && <p className="text-xs text-red-500">Failed: {errorMsg || "unknown error"}</p>}
    </div>
  );
}
