-- New artists and places appear on the city map unless they opt out.
-- Existing rows are left as they are.
ALTER TABLE "Artist" ALTER COLUMN "showOnMap" SET DEFAULT true;
ALTER TABLE "Place" ALTER COLUMN "showOnMap" SET DEFAULT true;
