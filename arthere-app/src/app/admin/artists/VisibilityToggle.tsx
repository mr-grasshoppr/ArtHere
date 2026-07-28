"use client";

import { useState, useTransition } from "react";
import { setArtistPlaceholder } from "./actions";

/**
 * One-click Live/Hidden switch for a profile. Lives inside the artist row,
 * which is itself a <Link> — so clicks are stopped from bubbling up into
 * navigation. "Live" = public (isPlaceholder false); "Hidden" = placeholder.
 */
export default function VisibilityToggle({
  artistId,
  isPlaceholder,
}: {
  artistId: string;
  isPlaceholder: boolean;
}) {
  const [hidden, setHidden] = useState(isPlaceholder);
  const [pending, startTransition] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !hidden;
    setHidden(next); // optimistic
    startTransition(async () => {
      try {
        await setArtistPlaceholder(artistId, next);
      } catch {
        setHidden(!next); // revert on failure
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      title={hidden ? "Hidden from the public site — click to publish" : "Live on the public site — click to hide"}
      className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex-shrink-0 ${
        hidden
          ? "bg-[#f5f5f5] border-[#e5e5e5] text-[#999] hover:border-[#ccc]"
          : "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
      } ${pending ? "opacity-60" : ""}`}
    >
      {hidden ? "Hidden" : "● Live"}
    </button>
  );
}
