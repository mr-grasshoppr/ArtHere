CREATE TABLE "BlockedAccessAttempt" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "artistId" TEXT,
    "placeId" TEXT,

    CONSTRAINT "BlockedAccessAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BlockedAccessAttempt_artistId_idx" ON "BlockedAccessAttempt"("artistId");

CREATE INDEX "BlockedAccessAttempt_placeId_idx" ON "BlockedAccessAttempt"("placeId");

ALTER TABLE "BlockedAccessAttempt" ADD CONSTRAINT "BlockedAccessAttempt_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BlockedAccessAttempt" ADD CONSTRAINT "BlockedAccessAttempt_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
