-- AlterTable
ALTER TABLE "Event" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "EventSubmission" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
