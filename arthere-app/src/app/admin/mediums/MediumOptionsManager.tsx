"use client";

import { useState, useTransition } from "react";
import { approveMediumOption, rejectMediumOption, deleteMediumOption } from "./actions";

export type MediumRow = { id: string; label: string; approved: boolean; usage: number };

export default function MediumOptionsManager({ rows }: { rows: MediumRow[] }) {
  const [items, setItems] = useState(rows);
  const [isPending, startTransition] = useTransition();

  const pending = items.filter((r) => !r.approved);
  const approved = items.filter((r) => r.approved);

  function approve(id: string) {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, approved: true } : r)));
    startTransition(() => approveMediumOption(id));
  }

  function reject(id: string) {
    setItems((prev) => prev.filter((r) => r.id !== id));
    startTransition(() => rejectMediumOption(id));
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((r) => r.id !== id));
    startTransition(() => deleteMediumOption(id));
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-medium text-sm text-[#888] uppercase tracking-wide mb-3">
          Pending approval {pending.length > 0 && `(${pending.length})`}
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-[#999]">Nothing waiting on review.</p>
        ) : (
          <div className="bg-white border border-[#e5e5e5] rounded-lg divide-y divide-[#f0f0f0]">
            {pending.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex-1 text-sm font-medium">{r.label}</span>
                <span className="text-xs text-[#999]">
                  {r.usage === 0 ? "unused" : `used ${r.usage}×`}
                </span>
                <button
                  type="button"
                  onClick={() => approve(r.id)}
                  disabled={isPending}
                  className="text-xs px-3 py-1.5 rounded-full bg-[#1a1a1a] text-white hover:opacity-80 transition-opacity disabled:opacity-40"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => reject(r.id)}
                  disabled={isPending}
                  className="text-xs px-3 py-1.5 rounded-full border border-[#e5e5e5] text-[#888] hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-40"
                >
                  Reject
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-medium text-sm text-[#888] uppercase tracking-wide mb-3">
          Approved ({approved.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {approved.map((r) => (
            <div
              key={r.id}
              className="group flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full text-sm bg-white border border-[#e5e5e5]"
            >
              <span>{r.label}</span>
              <span className="text-[10px] text-[#bbb]">{r.usage === 0 ? "unused" : `×${r.usage}`}</span>
              <button
                type="button"
                onClick={() => remove(r.id)}
                disabled={isPending}
                title={`Remove ${r.label}`}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[#ccc] hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
