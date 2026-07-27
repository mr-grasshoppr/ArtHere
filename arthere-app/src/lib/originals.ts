import { put } from '@vercel/blob';

// Preserve the raw, unprocessed bytes of every upload to an immutable archive.
//
// This is the source-of-truth copy of each contribution. It uses
// addRandomSuffix so an original can NEVER be overwritten — unlike the display
// copies, which live at predictable paths and have been clobbered by resize
// scripts in the past. Nothing reads from `originals/` at runtime; it exists
// purely so no original is ever lost again.
//
// Best-effort: archiving runs after the response (via waitUntil) and its
// failure must never block or fail the user's upload.
export async function archiveOriginal(
  bytes: Buffer | ArrayBuffer,
  originalName: string,
  prefix: string,
  contentType?: string,
): Promise<string | null> {
  try {
    const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'upload';
    const { url } = await put(`originals/${prefix}/${Date.now()}-${safe}`, bytes, {
      access: 'public',
      addRandomSuffix: true, // immutable — never overwrite an original
      contentType,
    });
    return url;
  } catch (err) {
    console.error('[originals] failed to archive original', prefix, originalName, err);
    return null;
  }
}
