"use client";

import { useState } from "react";

// Runs the focal-point backfill by calling the batched endpoint in a loop until
// nothing remains. Safe to run anytime — already-analyzed images are skipped.
export default function ComputeFocalsButton() {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [error, setError] = useState("");

  async function run() {
    setState("running");
    setError("");
    let total = 0;
    let processed = 0;
    try {
      // Loop batches until the server reports nothing remaining.
      for (let i = 0; i < 200; i++) {
        const res = await fetch("/api/admin/compute-focals", { method: "POST" });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
        const data = await res.json();
        total = data.total;
        processed += data.processedThisCall;
        setProgress({ done: total - data.remaining, total });
        if (data.remaining === 0 || data.processedThisCall === 0) break;
      }
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setState("error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={run}
        disabled={state === "running"}
        className="text-sm px-4 py-2 border border-[#e5e5e5] rounded-full text-[#555] hover:border-[#999] transition-colors disabled:opacity-50"
      >
        {state === "running" ? "Analyzing images…" : "Compute image focal points"}
      </button>
      {state === "running" && progress.total > 0 && (
        <span className="text-xs text-[#888]">{progress.done} / {progress.total}</span>
      )}
      {state === "done" && <span className="text-xs text-green-600">✓ Done ({progress.total} images)</span>}
      {state === "error" && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
