const CDN_URL = process.env.R2_PUBLIC_URL; // https://cdn.gundamaxing.com

/**
 * Rewrites /api/files/... URLs stored in the database to CDN URLs.
 * Pass-through for everything else (UploadThing URLs, OAuth avatars, CDN URLs already rewritten).
 */
export function toCdnUrl(url: string): string {
  if (CDN_URL && url.startsWith("/api/files/")) {
    return `${CDN_URL}/${url.slice("/api/files/".length)}`;
  }
  return url;
}
