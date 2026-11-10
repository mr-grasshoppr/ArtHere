/**
 * One attribution note for all the photos on a profile, set right-aligned on
 * the page background beneath them — not overlaid, so it never dims or covers
 * the artwork.
 */
export function PhotoCredit({ name }: { name: string }) {
  if (!name) return null;
  return (
    <p className="text-right text-[0.75rem] font-light italic leading-snug text-[#999]">
      Photos courtesy of {name}
    </p>
  );
}
