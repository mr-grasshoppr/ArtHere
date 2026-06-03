import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
