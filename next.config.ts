import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Disabled until R2 images are served via CDN (R2_PUBLIC_URL).
    // The /api/files proxy can't be optimized by Next.js on Vercel.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
      ...(process.env.R2_PUBLIC_URL
        ? [{ protocol: "https" as const, hostname: new URL(process.env.R2_PUBLIC_URL).hostname }]
        : []),
    ],
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
