-- AlterTable
ALTER TABLE "Place" ADD COLUMN "cityId" TEXT;

-- CreateIndex
CREATE INDEX "Place_cityId_idx" ON "Place"("cityId");

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
