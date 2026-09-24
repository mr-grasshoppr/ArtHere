-- Add GALLERY to LinkType, for artists who show at a gallery with its own site.
ALTER TYPE "LinkType" ADD VALUE IF NOT EXISTS 'GALLERY' AFTER 'PORTFOLIO';
