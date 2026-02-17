import type { User } from "@prisma/client";

// Placeholder list of suspicious IP patterns (CIDR-like prefixes).
// In production this would be backed by a real threat-intelligence feed.
const SUSPICIOUS_IP_PREFIXES = [
  "192.0.2.",    // TEST-NET-1 (documentation range, sometimes abused)
  "198.51.100.", // TEST-NET-2
  "203.0.113.",  // TEST-NET-3
];

type RiskUser = Pick<
  User,
  "createdAt" | "reputation" | "emailVerified" | "riskScore"
>;

/**
 * Calculate a risk score (0-100) for a user action.
 *
 * Factors considered:
 *  - Account age: newer accounts are riskier.
 *  - Email verification status.
 *  - Reputation level.
 *  - Known suspicious IP patterns.
 *  - Existing persisted riskScore (momentum).
 */
export function calculateRiskScore(
  user: RiskUser,
  ip: string | null
): number {
  let score = 0;

  // --- Account age ---
  const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
  const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);

  if (accountAgeDays < 1) {
    score += 25;
  } else if (accountAgeDays < 7) {
    score += 15;
  } else if (accountAgeDays < 30) {
    score += 5;
  }

  // --- Email verification ---
  if (!user.emailVerified) {
    score += 30;
  }

  // --- Low reputation ---
  if ((user.reputation ?? 0) <= 0) {
    score += 20;
  } else if ((user.reputation ?? 0) < 10) {
    score += 10;
  }

  // --- Suspicious IP (placeholder) ---
  if (ip) {
    const isSuspicious = SUSPICIOUS_IP_PREFIXES.some((prefix) =>
      ip.startsWith(prefix)
    );
    if (isSuspicious) {
      score += 15;
    }
  }

  // --- Existing risk momentum ---
  // Blend in the previously persisted riskScore so that repeated risky
  // behaviour accumulates over time.
  if (user.riskScore != null && user.riskScore > 0) {
    score += Math.round(user.riskScore * 0.3);
  }

  return Math.min(100, Math.max(0, score));
}
