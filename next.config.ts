import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // CDN images (cdn.gundamaxing.com) are served unoptimized via SmartImage
    // to avoid Vercel image transformation costs. Only OAuth avatars and
    // UploadThing URLs still use Vercel optimization.
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "*.ufs.sh" },
      { protocol: "https", hostname: "*.uploadthing.com" },
      { protocol: "https", hostname: "utfs.io" },
    ],
    // Reduce device sizes to limit transformation variants
    deviceSizes: [640, 1080, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // Cache static assets (images, fonts, videos) in /public
        source: "/:path((?:.*\\.(?:jpg|jpeg|png|webp|avif|gif|svg|ico|woff2|woff|mp4))$)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
