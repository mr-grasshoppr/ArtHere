"use client";

import { useTransition } from "react";
import { setEventStatus } from "./actions";

export function EventModeration({ id, status }: { id: string; status: "PENDING" | "PUBLISHED" | "HIDDEN" }) {
  const [pending, start] = useTransition();
  const btn = "px-3 py-1 rounded-full text-xs font-medium disabled:opacity-40";
  return (
    <div className="flex gap-2">
      {status !== "PUBLISHED" && (
        <button disabled={pending} className={`${btn} bg-[#1a1a1a] text-white`} onClick={() => start(() => setEventStatus(id, "PUBLISHED"))}>
          Approve
        </button>
      )}
      {status !== "HIDDEN" && (
        <button disabled={pending} className={`${btn} border border-[#ddd]`} onClick={() => start(() => setEventStatus(id, "HIDDEN"))}>
          {status === "PENDING" ? "Decline" : "Hide"}
        </button>
      )}
    </div>
  );
}
