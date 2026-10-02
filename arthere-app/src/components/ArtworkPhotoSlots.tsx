"use client";

import type { CSSProperties } from "react";
import { FramingButton } from "@/components/FramingButton";
import { ArtworkMediumSelect } from "@/components/ArtworkMediumSelect";
import { PhotoSlotFrame, UploadOverlay } from "@/components/PhotoSlotFrame";
import { GALLERY_SLOTS, type ArtworkPhotos, type PhotoImage } from "@/lib/useArtworkPhotos";
import type { FramingValue } from "@/components/FramingEditor";

/** What the artist's form and the admin editor each supply to the shared slots. */
export type PhotoSlotsContext = {
  photos: ArtworkPhotos;
  styleFor: (url?: string | null) => CSSProperties;
  rememberFocal: (url: string, value: FramingValue) => void;
  framingEndpoint: "/api/image-focus" | "/api/admin/image-focus";
  mediumOptions: string[];
  /** Admin only: lets the medium list grow. */
  onMediumOptionsChange?: (next: string[]) => void;
};

const ACCEPT = "image/jpeg,image/png,image/webp";
const ACTION_BTN =
  "flex-1 bg-black/60 text-white rounded-md py-1.5 text-xs text-center hover:bg-black/75 transition-colors";
const ROUND_BTN =
  "w-6 h-6 rounded-full bg-black/55 text-white text-xs leading-none hover:bg-black/75 transition-colors";

/** The 21:9 header image — the same shape the live profile shows. */
export function HeaderPhotoSlot({ ctx }: { ctx: PhotoSlotsContext }) {
  const { photos, styleFor, rememberFocal, framingEndpoint, mediumOptions, onMediumOptionsChange } = ctx;
  const { heroImage } = photos;
  const uploadingHere = photos.pending.filter((p) => p.target === "hero").slice(-1)[0];

  return (
    <>
      <PhotoSlotFrame
        imageId={heroImage?.id}
        onFiles={(files) => photos.placeHero(files[0])}
        onMove={(from) => heroImage && photos.swapPieces(from, heroImage.id)}
        className="rounded-lg overflow-hidden bg-[#f0ede9] relative"
        style={{ aspectRatio: "21 / 9" }}
      >
        {heroImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImage.url} alt="" draggable={false} className="w-full h-full object-cover" style={styleFor(heroImage.url)} />
            <div className="absolute left-2 right-2 bottom-2 z-10 flex gap-2 max-w-[260px]">
              <FramingButton
                imageUrl={heroImage.url}
                endpoint={framingEndpoint}
                aspect="21 / 9"
                label="Adjust"
                className={ACTION_BTN}
                onSaved={(v) => rememberFocal(heroImage.url, v)}
              />
              <label className={`${ACTION_BTN} cursor-pointer`}>
                Replace
                <input type="file" accept={ACCEPT} onChange={(e) => photos.pickFiles(e, (f) => photos.placeHero(f[0]))} className="hidden" />
              </label>
            </div>
          </>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer gap-1 absolute inset-0 text-center">
            <span className="text-[#777] text-sm">Drop a header photo here</span>
            <span className="text-[#999] text-xs underline underline-offset-2">or browse</span>
            <input type="file" accept={ACCEPT} onChange={(e) => photos.pickFiles(e, (f) => photos.placeHero(f[0]))} className="hidden" />
          </label>
        )}
        {uploadingHere && (
          <UploadOverlay
            previewUrl={uploadingHere.previewUrl}
            error={uploadingHere.error}
            onRetry={() => photos.retryUpload(uploadingHere.key)}
            onDismiss={() => photos.settle(uploadingHere.key)}
          />
        )}
      </PhotoSlotFrame>
      {heroImage && (
        <div className="mt-2">
          <ArtworkMediumSelect
            value={heroImage.medium}
            options={mediumOptions}
            onChange={(next) => photos.updateMedium(heroImage.id, next)}
            onOptionsChange={onMediumOptionsChange}
          />
        </div>
      )}
    </>
  );
}

/** The three gallery slots, and the pieces kept back beneath them. */
export function GalleryPhotoSlots({
  ctx,
  title = "My Gallery",
  renderBadge,
}: {
  ctx: PhotoSlotsContext;
  title?: string;
  /** Optional corner label for each piece (the admin view shows who added it). */
  renderBadge?: (img: PhotoImage) => React.ReactNode;
}) {
  const { photos, styleFor, rememberFocal, framingEndpoint, mediumOptions, onMediumOptionsChange } = ctx;
  const { galleryImages, hiddenImages, pending, uploading } = photos;

  const medium = (img: PhotoImage) => (
    <div className="mt-1.5">
      <ArtworkMediumSelect
        value={img.medium}
        options={mediumOptions}
        onChange={(next) => photos.updateMedium(img.id, next)}
        onOptionsChange={onMediumOptionsChange}
      />
    </div>
  );

  return (
    <div className="mb-8">
      <div className="flex items-baseline gap-2 mb-3">
        <h2 className="text-[0.7rem] font-semibold text-[#aaa] uppercase tracking-widest">{title}</h2>
        <span className="text-[0.7rem] text-[#bbb]">Three images of your artwork</span>
      </div>
      <p className="text-[0.75rem] text-[#999] mb-3">
        Tag each image with its medium, so visitors can find it when they filter. Drag images, or hold one on a phone until it lifts, to change the order.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: GALLERY_SLOTS }, (_, i) => i).map((slot) => {
          const img = galleryImages[slot];
          if (img) {
            const replacing = pending.filter((p) => p.target === img.id).slice(-1)[0];
            return (
              <div key={img.id}>
                <PhotoSlotFrame
                  imageId={img.id}
                  onFiles={(files) => photos.replacePiece(img.id, files[0])}
                  onMove={(from) => photos.swapPieces(from, img.id)}
                  className="rounded-lg overflow-hidden bg-[#f0ede9] aspect-square relative cursor-grab active:cursor-grabbing"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" draggable={false} className="w-full h-full object-cover" style={styleFor(img.url)} />
                  <div className="absolute top-1.5 left-1.5 z-10 flex gap-1">
                    <button type="button" onClick={() => photos.stepPiece(img.id, -1)} className={ROUND_BTN} title="Move earlier" aria-label="Move earlier">←</button>
                    {slot < galleryImages.length - 1 && (
                      <button type="button" onClick={() => photos.stepPiece(img.id, 1)} className={ROUND_BTN} title="Move later" aria-label="Move later">→</button>
                    )}
                  </div>
                  {/* Without this the only way out of an over-full profile was
                      to write and ask, and the form quietly hid the extras. */}
                  <button
                    type="button"
                    onClick={() => photos.removeImage(img.id)}
                    className={`absolute top-1.5 right-1.5 z-10 text-sm ${ROUND_BTN}`}
                    title="Remove this piece"
                    aria-label="Remove this piece"
                  >×</button>
                  {renderBadge && <div className="absolute top-9 left-1.5 z-10">{renderBadge(img)}</div>}
                  <div className="absolute left-1.5 right-1.5 bottom-1.5 z-10 flex gap-1.5">
                    <FramingButton
                      imageUrl={img.url}
                      endpoint={framingEndpoint}
                      aspect="1 / 1"
                      label="Adjust"
                      className={ACTION_BTN}
                      onSaved={(v) => rememberFocal(img.url, v)}
                    />
                    <label className={`${ACTION_BTN} cursor-pointer`}>
                      Replace
                      <input type="file" accept={ACCEPT} onChange={(e) => photos.pickFiles(e, (f) => photos.replacePiece(img.id, f[0]))} className="hidden" />
                    </label>
                  </div>
                  {replacing && (
                    <UploadOverlay
                      previewUrl={replacing.previewUrl}
                      error={replacing.error}
                      onRetry={() => photos.retryUpload(replacing.key)}
                      onDismiss={() => photos.settle(replacing.key)}
                    />
                  )}
                </PhotoSlotFrame>
                {medium(img)}
              </div>
            );
          }
          // Empty slots take, in order, the photos still on their way up.
          const incoming = pending.filter((p) => p.target === "add")[slot - galleryImages.length];
          return (
            <PhotoSlotFrame
              key={slot}
              onFiles={photos.addPieces}
              onMove={photos.moveToGalleryEnd}
              className="rounded-lg border-2 border-dashed border-[#e5e5e5] aspect-square relative overflow-hidden hover:border-[#bbb] transition-colors"
            >
              <label className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center px-2 cursor-pointer">
                <span className="text-[#777] text-sm">Drop a photo here</span>
                <span className="text-[#999] text-xs underline underline-offset-2">or browse</span>
                <input type="file" accept={ACCEPT} multiple onChange={(e) => photos.pickFiles(e, photos.addPieces)} className="hidden" />
              </label>
              {incoming && (
                <UploadOverlay
                  previewUrl={incoming.previewUrl}
                  error={incoming.error}
                  onRetry={() => photos.retryUpload(incoming.key)}
                  onDismiss={() => photos.settle(incoming.key)}
                />
              )}
            </PhotoSlotFrame>
          );
        })}
      </div>

      {/* Pieces beyond the header and three slots. Uploads are never
          refused, so these are kept rather than lost — but they are not
          on the profile or the city grid until one is swapped in, and
          saying so plainly beats a form that quietly shows three of the
          eight pieces an artist uploaded. */}
      {(hiddenImages.length > 0 || galleryImages.length >= GALLERY_SLOTS) && (
        <div className="mt-6">
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-[0.7rem] font-semibold text-[#aaa] uppercase tracking-widest">Also uploaded</h3>
            <span className="text-[0.7rem] text-[#bbb]">
              {hiddenImages.length > 0
                ? `${hiddenImages.length} ${hiddenImages.length === 1 ? "piece" : "pieces"} not showing`
                : "keep uploading — anything past the four above waits here"}
            </span>
            {/* With the three slots full there was otherwise no way to add
                a piece at all, which is its own kind of blocked. */}
            <label className="ml-auto text-[0.72rem] text-[#777] hover:text-[#1a1a1a] underline underline-offset-2 transition-colors cursor-pointer">
              {uploading ? "Uploading…" : "+ Add another piece"}
              <input type="file" accept={ACCEPT} multiple onChange={(e) => photos.pickFiles(e, photos.addPieces)} className="hidden" />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {pending.filter((p) => p.target === "add").slice(Math.max(0, GALLERY_SLOTS - galleryImages.length)).map((p) => (
              <div key={p.key} className="rounded-lg overflow-hidden aspect-square relative bg-[#f0ede9]">
                <UploadOverlay previewUrl={p.previewUrl} error={p.error} onRetry={() => photos.retryUpload(p.key)} onDismiss={() => photos.settle(p.key)} />
              </div>
            ))}
            {hiddenImages.map((img) => (
              <div key={img.id}>
                <PhotoSlotFrame
                  imageId={img.id}
                  onFiles={photos.addPieces}
                  onMove={(from) => photos.swapPieces(from, img.id)}
                  className="rounded-lg overflow-hidden bg-[#f0ede9] aspect-square relative group cursor-grab active:cursor-grabbing"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt=""
                    draggable={false}
                    className="w-full h-full object-cover opacity-55 group-hover:opacity-80 transition-opacity"
                    style={styleFor(img.url)}
                  />
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/55 text-white text-[0.62rem] tracking-wide">
                    Not visible in profile
                  </span>
                  <button
                    type="button"
                    onClick={() => photos.removeImage(img.id)}
                    className={`absolute top-1.5 right-1.5 z-10 text-sm ${ROUND_BTN}`}
                    title="Delete this piece"
                    aria-label="Delete this piece"
                  >×</button>
                </PhotoSlotFrame>
                <div className="mt-1.5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => photos.showInGallery(img.id)}
                    className="text-[0.72rem] text-[#777] hover:text-[#1a1a1a] underline underline-offset-2 transition-colors"
                  >
                    Show in gallery
                  </button>
                  <button
                    type="button"
                    onClick={() => photos.makeHeader(img.id)}
                    className="text-[0.72rem] text-[#777] hover:text-[#1a1a1a] underline underline-offset-2 transition-colors"
                  >
                    Use as header
                  </button>
                </div>
                {medium(img)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
