"use client";

import Image, { type ImageProps } from "next/image";

/**
 * Drop-in replacement for next/image that automatically skips
 * Next.js image optimization for /api/files/ proxy URLs (Vercel
 * serverless can't fetch from itself). External URLs (UploadThing,
 * OAuth avatars) still go through /_next/image for optimization.
 */
export function SmartImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  const isProxy = src.startsWith("/api/files/");

  return <Image {...props} unoptimized={isProxy || props.unoptimized} />;
}
