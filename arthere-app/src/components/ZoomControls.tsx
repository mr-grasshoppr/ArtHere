/**
 * Small + / − buttons and a round reset arrow for the map tab's views, in
 * the bottom-right corner of both the Geographic map and the Network graph.
 * Kept quiet — scroll and pinch zoom too; these are for anyone who doesn't
 * know that, and reset is the way back from somewhere unrecoverable.
 */
export function ZoomControls({
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}) {
  const button =
    'flex items-center justify-center w-7 h-7 text-[0.95rem] leading-none text-[#999] hover:text-white hover:bg-white/10 transition-colors cursor-pointer';
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-col rounded-md border border-[#444] bg-[#0a0a0a]/80 backdrop-blur-sm overflow-hidden">
        <button type="button" aria-label="Zoom in" onClick={onZoomIn} className={button}>
          +
        </button>
        <div className="h-px bg-[#333]" />
        <button type="button" aria-label="Zoom out" onClick={onZoomOut} className={button}>
          −
        </button>
      </div>

      {/* A round arrow, labelled on hover. */}
      <div className="group relative">
        <button
          type="button"
          aria-label="Reset view"
          onClick={onReset}
          className={`${button} rounded-full border border-[#444] bg-[#0a0a0a]/80 backdrop-blur-sm`}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 12a8 8 0 1 1-2.34-5.66" />
            <path d="M20 4v5h-5" />
          </svg>
        </button>
        <span className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 whitespace-nowrap rounded-md bg-[#111] border border-[#333] px-2 py-1 text-[0.68rem] text-[#ccc] opacity-0 group-hover:opacity-100 transition-opacity">
          Reset view
        </span>
      </div>
    </div>
  );
}
