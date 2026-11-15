-- CreateEnum
CREATE TYPE "AffiliationAction" AS ENUM ('ADDED', 'REMOVED', 'TITLE_CHANGED', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "AffiliationSource" AS ENUM ('ARTIST', 'PLACE', 'ADMIN', 'DECLINE');

-- CreateTable
CREATE TABLE "AffiliationHistory" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "placeId" TEXT,
    "placeName" TEXT NOT NULL,
    "relationship" "PlaceRelationship" NOT NULL,
    "title" TEXT,
    "action" "AffiliationAction" NOT NULL,
    "source" "AffiliationSource" NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AffiliationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AffiliationHistory_artistId_at_idx" ON "AffiliationHistory"("artistId", "at");

-- CreateIndex
CREATE INDEX "AffiliationHistory_placeId_at_idx" ON "AffiliationHistory"("placeId", "at");
