-- CreateTable
CREATE TABLE "PlaceListedArtist" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" "PlaceRelationship" NOT NULL,
    "relationshipLabel" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaceListedArtist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlaceListedArtist_placeId_idx" ON "PlaceListedArtist"("placeId");

-- AddForeignKey
ALTER TABLE "PlaceListedArtist" ADD CONSTRAINT "PlaceListedArtist_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
