-- CreateIndex
CREATE INDEX "Artist_cityId_idx" ON "Artist"("cityId");

-- CreateIndex
CREATE INDEX "ArtworkImage_artistId_idx" ON "ArtworkImage"("artistId");

-- CreateIndex
CREATE INDEX "ArtistPlace_placeId_idx" ON "ArtistPlace"("placeId");

-- CreateIndex
CREATE INDEX "SurveyResponse_createdAt_idx" ON "SurveyResponse"("createdAt");

-- CreateIndex
CREATE INDEX "MagicLinkToken_artistId_idx" ON "MagicLinkToken"("artistId");

-- CreateIndex
CREATE INDEX "MagicLinkToken_placeId_idx" ON "MagicLinkToken"("placeId");

-- CreateIndex
CREATE INDEX "AdminNote_artistId_idx" ON "AdminNote"("artistId");

