-- CreateTable
CREATE TABLE "PlaceMember" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlaceMember_userId_idx" ON "PlaceMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaceMember_placeId_userId_key" ON "PlaceMember"("placeId", "userId");

-- AddForeignKey
ALTER TABLE "PlaceMember" ADD CONSTRAINT "PlaceMember_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceMember" ADD CONSTRAINT "PlaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
