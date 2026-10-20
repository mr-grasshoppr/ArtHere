"use client";

import { useState, useTransition } from "react";
import { sendEventsPrompts, type PromptResult } from "./actions";

export interface PromptOrg {
  id: string;
  name: string;
  email: string | null;
  lastPrompted: string | null;
}

export function SendPromptPanel({ orgs }: { orgs: PromptOrg[] }) {
  const sendable = orgs.filter((o) => o.email);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<PromptResult[] | null>(null);
  const [pending, start] = useTransition();

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      <div className="flex items-center gap-3 mb-3 text-sm">
        <button className="underline" onClick={() => setSelected(new Set(sendable.map((o) => o.id)))}>Select all</button>
        <button className="underline" onClick={() => setSelected(new Set())}>None</button>
        <button
          disabled={pending || selected.size === 0}
          className="ml-auto px-4 py-2 rounded-full bg-[#1a1a1a] text-white text-xs font-medium disabled:opacity-40"
          onClick={() => {
            if (!confirm(`Email the events prompt to ${selected.size} organization${selected.size === 1 ? "" : "s"}?`)) return;
            start(async () => {
              setResults(await sendEventsPrompts([...selected]));
              setSelected(new Set());
            });
          }}
        >
          {pending ? "Sending…" : `Send to ${selected.size} selected`}
        </button>
      </div>
      {results && (
        <p className="text-sm mb-3">
          {results.filter((r) => r.status === "sent").length} sent
          {results.some((r) => r.status === "failed") && (
            <span className="text-red-600">
              {" "}· failed: {results.filter((r) => r.status === "failed").map((r) => `${r.name} (${r.error})`).join("; ")}
            </span>
          )}
        </p>
      )}
      <ul className="divide-y divide-[#f0f0f0] border border-[#eee] rounded-lg">
        {orgs.map((o) => (
          <li key={o.id} className="flex items-center gap-3 px-3 py-2 text-sm">
            <input type="checkbox" disabled={!o.email} checked={selected.has(o.id)} onChange={() => toggle(o.id)} aria-label={`Select ${o.name}`} />
            <span className="font-medium">{o.name}</span>
            <span className="text-[#999] text-xs">{o.email ?? "no owner email"}</span>
            {o.lastPrompted && <span className="ml-auto text-xs text-[#aaa]">last asked {o.lastPrompted}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
