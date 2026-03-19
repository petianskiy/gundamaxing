"use client";

import Image, { type ImageProps } from "next/image";

/**
 * Drop-in next/image wrapper. All R2 images are served from
 * cdn.gundamaxing.com (in remotePatterns), so they go through
 * Next.js optimization (/_next/image) for automatic resizing + WebP.
 */
export function SmartImage(props: ImageProps) {
  return <Image {...props} />;
}
