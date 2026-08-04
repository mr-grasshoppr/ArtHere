// Vercel's serverless functions cap the request body at ~4.5MB, well below
// the 20MB our own upload route advertises — a full-res phone photo hits
// that platform limit (413) before our app-level check ever runs. Downscale
// client-side so uploads actually reach the server.
const TARGET_MAX_BYTES = 4 * 1024 * 1024;
const MAX_DIMENSION = 2400;

export async function resizeImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  if (file.size <= TARGET_MAX_BYTES) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  for (const quality of [0.85, 0.7, 0.55]) {
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && blob.size <= TARGET_MAX_BYTES) {
      return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
    }
  }
  return file;
}
