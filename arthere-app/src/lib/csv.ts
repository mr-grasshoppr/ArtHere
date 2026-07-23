// Shared CSV helpers for admin exports.

/**
 * Escape a value for a CSV cell. Quotes values containing delimiters and
 * neutralizes spreadsheet formula injection (a leading =, +, -, or @ would
 * otherwise execute as a formula when the export is opened in Excel/Sheets).
 */
export function esc(v: string | null | undefined): string {
  if (v == null || v === "") return "";
  let s = String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function row(values: (string | null | undefined)[]): string {
  return values.map(esc).join(",");
}

export function csvResponse(lines: string[], filenamePrefix: string): Response {
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
