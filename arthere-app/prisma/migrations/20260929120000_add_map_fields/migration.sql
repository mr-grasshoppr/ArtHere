-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "showOnMap" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Place" ADD COLUMN     "showOnMap" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PlaceLocation" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "label" TEXT,
    "streetAddress" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaceLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlaceLocation_placeId_idx" ON "PlaceLocation"("placeId");

-- AddForeignKey
ALTER TABLE "PlaceLocation" ADD CONSTRAINT "PlaceLocation_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
