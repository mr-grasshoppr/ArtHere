import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Friendly short links for outbound email/social — nicer than pasting the
  // full /contact?type=featured URL into a message. Add more here as other
  // intents need one.
  async redirects() {
    return [
      { source: "/featured", destination: "/contact?type=featured", permanent: false },
      { source: "/getfeatured", destination: "/contact?type=featured", permanent: false },
    ];
  },
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
