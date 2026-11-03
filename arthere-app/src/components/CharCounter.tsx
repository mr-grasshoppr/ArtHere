/** "412 / 1000" under a textarea; turns red past the limit. */
export function CharCounter({ value, max, className = '' }: { value: string; max: number; className?: string }) {
  const over = value.length - max;
  return (
    <p className={`text-[0.72rem] ${over > 0 ? 'text-red-600' : 'text-[#aaa]'} ${className}`} aria-live="polite">
      {value.length} / {max} characters
      {over > 0 && ` — please shorten by ${over} to save`}
    </p>
  );
}
