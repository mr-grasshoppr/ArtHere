import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next 16 rejects any quality not listed here (400). 75 is the default
    // used for content images; 50 is for the city page's ambient artwork
    // background, which is decorative, in motion, and partly masked — it
    // does not need content-grade fidelity, and there are ~150 tiles of it.
    qualities: [50, 75],
    remotePatterns: [
      // Vercel Blob storage
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // Squarespace CDN (for migrated/prototype artist images)
      { protocol: "https", hostname: "images.squarespace-cdn.com" },
      // Instagram CDN (read-only profile images)
      { protocol: "https", hostname: "*.cdninstagram.com" },
      // Adobe Portfolio CDN
      { protocol: "https", hostname: "cdn.myportfolio.com" },
      // Wix CDN
      { protocol: "https", hostname: "static.wixstatic.com" },
    ],
  },
};

export default nextConfig;
