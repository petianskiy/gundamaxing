import crypto from "crypto";

/**
 * Generate a 6-digit verification code (100000–999999).
 * The raw code is sent to the user via email; only the hash is stored in DB.
 */
export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * SHA-256 hash a token for safe storage in the database.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
