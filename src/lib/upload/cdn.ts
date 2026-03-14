const CDN_URL = process.env.R2_PUBLIC_URL; // only set when CDN is actually working

/**
 * Rewrites /api/files/... URLs to CDN URLs when CDN is configured.
 * Pass-through for everything else (UploadThing URLs, OAuth avatars, etc.).
 */
export function toCdnUrl(url: string): string {
  if (CDN_URL && url.startsWith("/api/files/")) {
    return `${CDN_URL}/${url.slice("/api/files/".length)}`;
  }
  return url;
}
