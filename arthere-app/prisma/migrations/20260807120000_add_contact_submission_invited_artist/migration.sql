-- AlterTable
ALTER TABLE "ContactSubmission" ADD COLUMN     "invitedArtistId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ContactSubmission_invitedArtistId_key" ON "ContactSubmission"("invitedArtistId");

-- AddForeignKey
ALTER TABLE "ContactSubmission" ADD CONSTRAINT "ContactSubmission_invitedArtistId_fkey" FOREIGN KEY ("invitedArtistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
