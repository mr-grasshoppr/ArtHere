/**
 * Parse JSON out of a model response. Models occasionally wrap output in
 * ```json fences or add a stray sentence despite instructions — a raw
 * JSON.parse would then throw and fail the whole request. This strips
 * fences and falls back to extracting the first {...} or [...] block.
 * Throws only if no parseable JSON exists at all.
 */
export function parseModelJson<T>(text: string): T {
  const stripped = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  try {
    return JSON.parse(stripped) as T;
  } catch {
    // Fall back to the first JSON-looking block in the text.
    const match = stripped.match(/[{[][\s\S]*[}\]]/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error(`Model response contained no parseable JSON: ${text.slice(0, 200)}`);
  }
}
