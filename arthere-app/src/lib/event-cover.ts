import { waitUntil } from '@vercel/functions';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import { archiveOriginal } from '@/lib/originals';
import { computeAndStoreFocus } from '@/lib/image-focus';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 20 * 1024 * 1024;

/** Validate, resize and store an event cover photo under `prefix` in Blob. */
export async function storeEventCover(file: File, prefix: string): Promise<{ url: string } | { error: string }> {
  if (!IMAGE_TYPES.includes(file.type)) return { error: 'Cover photo must be a JPEG, PNG or WebP image.' };
  if (file.size > MAX_BYTES) return { error: 'Cover photo is too large (max 20 MB).' };
  const raw = Buffer.from(await file.arrayBuffer());
  let resized: Buffer;
  try {
    resized = await sharp(raw).rotate().resize({ width: 1800, withoutEnlargement: true }).jpeg({ quality: 86 }).toBuffer();
  } catch {
    return { error: 'That photo couldn’t be read. Please try a different image.' };
  }
  waitUntil(archiveOriginal(raw, file.name, prefix, file.type));
  const blob = await put(`${prefix}/${Date.now()}-cover.jpg`, resized, {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'image/jpeg',
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });
  waitUntil(computeAndStoreFocus(blob.url));
  return { url: blob.url };
}
