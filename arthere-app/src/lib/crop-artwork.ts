import sharp from "sharp";
import { put } from "@vercel/blob";
import type { ArtworkCropBox } from "./claude";

export async function cropAndUpload(
  sourceUrl: string,
  cropBox: ArtworkCropBox,
  blobKey: string
): Promise<string> {
  const res = await fetch(sourceUrl);
  const buffer = Buffer.from(await res.arrayBuffer());

  const meta = await sharp(buffer).metadata();
  const imgW = meta.width ?? 1;
  const imgH = meta.height ?? 1;

  const left = Math.max(0, Math.round(cropBox.x * imgW));
  const top = Math.max(0, Math.round(cropBox.y * imgH));
  const width = Math.min(imgW - left, Math.round(cropBox.w * imgW));
  const height = Math.min(imgH - top, Math.round(cropBox.h * imgH));

  const cropped = await sharp(buffer)
    .extract({ left, top, width, height })
    .jpeg({ quality: 90 })
    .toBuffer();

  const blob = await put(blobKey, cropped, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/jpeg",
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });

  return blob.url;
}
