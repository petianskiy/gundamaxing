const DISPOSABLE_EMAIL_DOMAINS: readonly string[] = [
  "mailinator.com",
  "guerrillamail.com",
  "tempmail.com",
  "throwaway.email",
  "yopmail.com",
  "sharklasers.com",
  "guerrillamailblock.com",
  "grr.la",
  "dispostable.com",
  "trashmail.com",
  "maildrop.cc",
  "fakeinbox.com",
  "mailnesia.com",
  "tempail.com",
  "temp-mail.org",
  "10minutemail.com",
  "getnada.com",
  "mohmal.com",
  "emailondeck.com",
  "mintemail.com",
  "tempr.email",
  "disposableemailaddresses.emailmiser.com",
  "burner.kiwi",
  "harakirimail.com",
  "mailsac.com",
  "spamgourmet.com",
  "safetymail.info",
  "filzmail.com",
  "inboxalias.com",
  "jetable.org",
] as const;

/**
 * Returns `true` if the email address belongs to a known disposable email provider.
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.toLowerCase().split("@").pop();
  if (!domain) return false;
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}

/**
 * Normalizes an IP address by stripping the IPv6 prefix from IPv4-mapped
 * addresses (e.g. "::ffff:127.0.0.1" becomes "127.0.0.1").
 */
export function normalizeIp(ip: string): string {
  const ipv4MappedPrefix = "::ffff:";
  if (ip.toLowerCase().startsWith(ipv4MappedPrefix)) {
    return ip.slice(ipv4MappedPrefix.length);
  }
  return ip;
}

/**
 * Extracts the client IP address from common proxy headers.
 *
 * Checks (in order):
 *  1. `cf-connecting-ip` (Cloudflare)
 *  2. `x-real-ip`
 *  3. `x-forwarded-for` (first entry)
 *
 * Returns `null` if no IP can be determined.
 */
export function getClientIp(headers: Headers): string | null {
  // Cloudflare
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return normalizeIp(cfIp.trim());

  // Reverse proxy (nginx, etc.)
  const realIp = headers.get("x-real-ip");
  if (realIp) return normalizeIp(realIp.trim());

  // Standard forwarded header - take the first (leftmost) IP
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return normalizeIp(first);
  }

  return null;
}
