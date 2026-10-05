/**
 * Small + / − buttons for the map tab's views, in the bottom-right corner
 * of both the Geographic map and the Network graph. Kept quiet — scroll and
 * pinch zoom too; these are for anyone who doesn't know that.
 */
export function ZoomControls({ onZoomIn, onZoomOut }: { onZoomIn: () => void; onZoomOut: () => void }) {
  const button =
    'flex items-center justify-center w-7 h-7 text-[0.95rem] leading-none text-[#999] hover:text-white hover:bg-white/10 transition-colors cursor-pointer';
  return (
    <div className="flex flex-col rounded-md border border-[#444] bg-[#0a0a0a]/80 backdrop-blur-sm overflow-hidden">
      <button type="button" aria-label="Zoom in" onClick={onZoomIn} className={button}>
        +
      </button>
      <div className="h-px bg-[#333]" />
      <button type="button" aria-label="Zoom out" onClick={onZoomOut} className={button}>
        −
      </button>
    </div>
  );
}
