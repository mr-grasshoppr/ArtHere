// Downscale uploads in the browser before they ever reach the server.
//
// Originally this existed only to dodge a platform limit: Vercel's serverless
// functions cap the request body at ~4.5MB, so a full-res phone photo would
// 413 before our own 20MB check ran. That's still true, but the binding
// constraint now is the Blob store, which is billed on both stored bytes and
// egress — and nothing on the site displays these anywhere near full
// resolution, so full-res pixels cost money and buy nothing.
const TARGET_MAX_BYTES = 1 * 1024 * 1024;

// Roughly 2x the widest any layout actually renders an image (the artist
// profile hero, ~768px CSS), so they stay sharp on retina displays without
// storing pixels nobody sees.
const MAX_DIMENSION = 2000;

export async function resizeImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Undecodable here — hand it to the server rather than failing the upload.
    return file;
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));

  // Leave images that are already modest completely untouched: re-encoding
  // them would cost a generation of quality for no meaningful saving. Note
  // this checks dimensions as well as bytes — the old version only checked
  // bytes, so a 4000px image under the size cap was stored at full res.
  if (scale === 1 && file.size <= TARGET_MAX_BYTES) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // WebP first: noticeably smaller than JPEG at equivalent quality, and it
  // preserves transparency — encoding a transparent PNG (a logo slide, say)
  // as JPEG would flatten the alpha onto a black background. Falls back to
  // JPEG if the browser can't encode WebP.
  for (const [mimeType, ext] of [
    ["image/webp", "webp"],
    ["image/jpeg", "jpg"],
  ] as const) {
    for (const quality of [0.85, 0.7, 0.55]) {
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, mimeType, quality)
      );
      // Null means this browser can't encode that format — try the next.
      if (!blob) break;
      // Accept once under budget, or at the lowest quality as a best effort.
      if (blob.size <= TARGET_MAX_BYTES || quality === 0.55) {
        return new File([blob], file.name.replace(/\.\w+$/, `.${ext}`), { type: mimeType });
      }
    }
  }

  return file;
}
