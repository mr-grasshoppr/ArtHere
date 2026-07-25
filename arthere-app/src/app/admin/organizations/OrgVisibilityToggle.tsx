"use client";

import { useState, useTransition } from "react";
import { setPlaceVisibility } from "./actions";

/**
 * One-click Live/Hidden switch for an organization page. Lives inside the org
 * row (a <Link>), so clicks are stopped from bubbling into navigation. "Live" =
 * shown in the public Community directory (inDirectory true).
 */
export default function OrgVisibilityToggle({
  placeId,
  inDirectory,
}: {
  placeId: string;
  inDirectory: boolean;
}) {
  const [live, setLive] = useState(inDirectory);
  const [pending, startTransition] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !live;
    setLive(next); // optimistic
    startTransition(async () => {
      try {
        await setPlaceVisibility(placeId, next);
      } catch {
        setLive(!next); // revert on failure
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      title={live ? "Live in the Community directory — click to hide" : "Hidden from the directory — click to publish"}
      className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex-shrink-0 ${
        live
          ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
          : "bg-[#f5f5f5] border-[#e5e5e5] text-[#999] hover:border-[#ccc]"
      } ${pending ? "opacity-60" : ""}`}
    >
      {live ? "● Live" : "Hidden"}
    </button>
  );
}
