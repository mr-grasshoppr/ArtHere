-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "cityId" TEXT;

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT,
    "displayName" TEXT,
    "logoOverlayImageUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
