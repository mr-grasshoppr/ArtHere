"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createArea, renameArea, deleteArea, moveArea,
  assignNeighborhood, setNeighborhoodHidden, moveNeighborhood,
} from "./actions";

export interface AreaRow { id: string; name: string }
export interface NeighborhoodRow {
  id: string;
  name: string;
  areaId: string | null;
  hidden: boolean;
  /** How many artist/place profiles currently use this value. */
  usage: number;
}

const BTN =
  "text-xs px-2.5 py-1 rounded-full border border-[#e5e5e5] text-[#555] hover:border-[#999] transition-colors disabled:opacity-30 disabled:pointer-events-none";

export default function NeighborhoodManager({
  areas, neighborhoods,
}: { areas: AreaRow[]; neighborhoods: NeighborhoodRow[] }) {
  const router = useRouter();
  const [newArea, setNewArea] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    try { await fn(); router.refresh(); }
    catch (e) { alert(e instanceof Error ? e.message : "Something went wrong"); }
    setBusy(false);
  }

  const inArea = (areaId: string | null) => neighborhoods.filter((n) => n.areaId === areaId);
  const unfiled = inArea(null);

  function NeighborhoodLine({ n, i, total }: { n: NeighborhoodRow; i: number; total: number }) {
    return (
      <div className="flex items-center gap-2 py-1.5 border-b border-[#f2f2f2] last:border-b-0">
        <span className={`flex-1 text-sm ${n.hidden ? "text-[#bbb] line-through" : "text-[#1a1a1a]"}`}>
          {n.name}
          <span className="ml-2 text-[0.7rem] text-[#aaa]">
            {n.usage > 0 ? `${n.usage} profile${n.usage === 1 ? "" : "s"}` : "unused"}
          </span>
        </span>

        <select
          value={n.areaId ?? ""}
          disabled={busy}
          onChange={(e) => run(() => assignNeighborhood(n.id, e.target.value || null))}
          className="text-xs border border-[#e5e5e5] rounded px-2 py-1 text-[#555] max-w-[150px]"
        >
          <option value="">— unfiled —</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <button className={BTN} disabled={busy || i === 0} onClick={() => run(() => moveNeighborhood(n.id, "up"))}>↑</button>
        <button className={BTN} disabled={busy || i === total - 1} onClick={() => run(() => moveNeighborhood(n.id, "down"))}>↓</button>
        <button className={BTN} disabled={busy} onClick={() => run(() => setNeighborhoodHidden(n.id, !n.hidden))}>
          {n.hidden ? "Show" : "Hide"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <input
          value={newArea}
          onChange={(e) => setNewArea(e.target.value)}
          placeholder="New area name, e.g. SE Portland"
          className="px-3 py-2 border border-[#e5e5e5] rounded text-sm w-64"
        />
        <button
          className="text-sm px-4 py-2 rounded-full bg-[#1a1a1a] text-white hover:opacity-80 disabled:opacity-40"
          disabled={busy || !newArea.trim()}
          onClick={() => run(async () => { await createArea(newArea); setNewArea(""); })}
        >
          + Add area
        </button>
      </div>

      {areas.map((area, ai) => {
        const members = inArea(area.id);
        return (
          <div key={area.id} className="bg-white border border-[#e5e5e5] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <input
                defaultValue={area.name}
                disabled={busy}
                onBlur={(e) => { if (e.target.value.trim() !== area.name) run(() => renameArea(area.id, e.target.value)); }}
                className="font-medium text-[#1a1a1a] border border-transparent hover:border-[#e5e5e5] focus:border-[#999] rounded px-2 py-1 outline-none"
              />
              <span className="text-xs text-[#aaa]">{members.length}</span>
              <div className="ml-auto flex gap-2">
                <button className={BTN} disabled={busy || ai === 0} onClick={() => run(() => moveArea(area.id, "up"))}>↑</button>
                <button className={BTN} disabled={busy || ai === areas.length - 1} onClick={() => run(() => moveArea(area.id, "down"))}>↓</button>
                <button
                  className="text-xs px-2.5 py-1 rounded-full border border-red-200 text-red-500 hover:border-red-400"
                  disabled={busy}
                  onClick={() => {
                    if (!confirm(`Delete the "${area.name}" area? Its neighborhoods become unfiled — none are deleted.`)) return;
                    run(() => deleteArea(area.id));
                  }}
                >
                  Delete area
                </button>
              </div>
            </div>
            {members.length === 0
              ? <p className="text-xs text-[#bbb] px-2 py-1">Nothing filed here yet.</p>
              : members.map((n, i) => <NeighborhoodLine key={n.id} n={n} i={i} total={members.length} />)}
          </div>
        );
      })}

      <div className="bg-white border border-dashed border-[#ddd] rounded-lg p-4">
        <div className="font-medium text-[#1a1a1a] mb-1">Unfiled</div>
        <p className="text-xs text-[#888] mb-2">
          New values typed by artists land here. File them into an area, or hide ones that are typos
          or test data — hiding keeps them off the public filters without editing anyone&rsquo;s profile.
        </p>
        {unfiled.length === 0
          ? <p className="text-xs text-[#bbb]">Everything is filed.</p>
          : unfiled.map((n, i) => <NeighborhoodLine key={n.id} n={n} i={i} total={unfiled.length} />)}
      </div>
    </div>
  );
}
