const CDN_URL = process.env.R2_PUBLIC_URL || "https://cdn.gundamaxing.com";

/**
 * Rewrites /api/files/... URLs (stored in DB) to CDN URLs.
 * Pass-through for external URLs, null, or empty strings.
 */
export function toCdnUrl(url: string): string {
  if (url.startsWith("/api/files/")) {
    return `${CDN_URL}/${url.slice("/api/files/".length)}`;
  }
  return url;
}
