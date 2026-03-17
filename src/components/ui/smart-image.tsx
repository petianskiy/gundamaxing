"use client";

import Image, { type ImageProps } from "next/image";

const CDN_HOST = "cdn.gundamaxing.com";

/**
 * Drop-in next/image wrapper that bypasses Vercel image optimization for
 * CDN-hosted images. Images from cdn.gundamaxing.com are served directly
 * from Cloudflare R2 edge cache — no need for Vercel to download, resize,
 * and re-serve them (which doubles bandwidth and burns transformations).
 *
 * Local images (/public) and OAuth avatars still use Next.js optimization.
 */
export function SmartImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  const isCdnImage = src.includes(CDN_HOST);

  if (isCdnImage) {
    return <Image {...props} unoptimized />;
  }

  return <Image {...props} />;
}
