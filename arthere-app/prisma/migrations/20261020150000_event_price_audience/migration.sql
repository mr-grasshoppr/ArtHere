-- AlterTable
ALTER TABLE "Event" DROP COLUMN "tags",
ADD COLUMN "price" TEXT,
ADD COLUMN "audience" TEXT;

-- AlterTable
ALTER TABLE "EventSubmission" DROP COLUMN "tags",
ADD COLUMN "price" TEXT,
ADD COLUMN "audience" TEXT;
