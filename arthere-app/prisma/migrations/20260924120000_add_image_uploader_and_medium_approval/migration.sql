ALTER TABLE "ArtworkImage" ADD COLUMN "uploadedBy" TEXT;
ALTER TABLE "MediumOption" ADD COLUMN "approved" BOOLEAN NOT NULL DEFAULT true;
