-- CreateTable
CREATE TABLE "EventSubmission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitterName" TEXT NOT NULL,
    "submitterEmail" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "artistNames" TEXT,
    "coverImageUrl" TEXT,
    "placeId" TEXT,
    "venueName" TEXT,
    "pocEmail" TEXT,
    "handledAt" TIMESTAMP(3),

    CONSTRAINT "EventSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventSubmission_createdAt_idx" ON "EventSubmission"("createdAt");

-- AddForeignKey
ALTER TABLE "EventSubmission" ADD CONSTRAINT "EventSubmission_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;
