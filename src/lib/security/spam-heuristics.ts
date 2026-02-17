"use server";

import { db } from "@/lib/db";

interface SpamCheckResult {
  score: number;
  reasons: string[];
}

// ---------------------------------------------------------------------------
// Helper: Jaccard similarity of two sets
// ---------------------------------------------------------------------------

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;

  let intersectionSize = 0;
  for (const item of a) {
    if (b.has(item)) intersectionSize++;
  }

  const unionSize = a.size + b.size - intersectionSize;
  if (unionSize === 0) return 0;

  return intersectionSize / unionSize;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 0)
  );
}

// ---------------------------------------------------------------------------
// Individual heuristic checks
// ---------------------------------------------------------------------------

function checkLinkDensity(
  content: string
): { score: number; reason: string | null } {
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const links = content.match(urlPattern) ?? [];
  const words = content.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  if (wordCount === 0) return { score: 0, reason: null };

  const linkRatio = links.length / wordCount;

  // Very short content that is mostly links
  if (wordCount < 20 && links.length >= 2) {
    return { score: 0.4, reason: "Very short content with multiple links" };
  }

  if (linkRatio > 0.3) {
    return { score: 0.35, reason: "High link density" };
  }

  if (links.length > 5) {
    return { score: 0.25, reason: "Excessive number of links" };
  }

  return { score: 0, reason: null };
}

function checkRepeatedPatterns(
  content: string
): { score: number; reason: string | null } {
  // Look for any phrase (3+ words) repeated more than twice
  const words = content.toLowerCase().split(/\s+/);
  const phrases = new Map<string, number>();

  for (let i = 0; i < words.length - 2; i++) {
    const phrase = words.slice(i, i + 3).join(" ");
    phrases.set(phrase, (phrases.get(phrase) ?? 0) + 1);
  }

  let maxRepeat = 0;
  for (const count of phrases.values()) {
    if (count > maxRepeat) maxRepeat = count;
  }

  if (maxRepeat >= 4) {
    return { score: 0.3, reason: "Heavily repeated text patterns" };
  }
  if (maxRepeat >= 3) {
    return { score: 0.15, reason: "Repeated text patterns detected" };
  }

  return { score: 0, reason: null };
}

function checkAllCapsRatio(
  content: string
): { score: number; reason: string | null } {
  const letters = content.replace(/[^a-zA-Z]/g, "");
  if (letters.length === 0) return { score: 0, reason: null };

  const upperCase = letters.replace(/[^A-Z]/g, "");
  const ratio = upperCase.length / letters.length;

  if (ratio > 0.5) {
    return { score: 0.2, reason: "Excessive use of capital letters (>50%)" };
  }

  return { score: 0, reason: null };
}

// ---------------------------------------------------------------------------
// Duplicate detection against recent user comments
// ---------------------------------------------------------------------------

async function checkDuplicateContent(
  content: string,
  userId: string
): Promise<{ score: number; reason: string | null }> {
  try {
    const recentComments = await db.comment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { content: true },
    });

    const currentTokens = tokenize(content);

    for (const comment of recentComments) {
      const existingTokens = tokenize(comment.content);
      const similarity = jaccardSimilarity(currentTokens, existingTokens);

      if (similarity > 0.85) {
        return {
          score: 0.4,
          reason: "Content is near-duplicate of a recent comment",
        };
      }

      if (similarity > 0.6) {
        return {
          score: 0.2,
          reason: "Content is suspiciously similar to a recent comment",
        };
      }
    }
  } catch {
    // If DB lookup fails, skip this check rather than blocking the user.
  }

  return { score: 0, reason: null };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyse content for spam signals.
 *
 * @returns An object with a `score` (0-1, where 1 is almost certainly spam)
 *          and an array of human-readable `reasons`.
 */
export async function checkSpamContent(
  content: string,
  userId: string
): Promise<SpamCheckResult> {
  const reasons: string[] = [];
  let totalScore = 0;

  const checks = [
    checkLinkDensity(content),
    checkRepeatedPatterns(content),
    checkAllCapsRatio(content),
  ];

  for (const check of checks) {
    totalScore += check.score;
    if (check.reason) reasons.push(check.reason);
  }

  const duplicateCheck = await checkDuplicateContent(content, userId);
  totalScore += duplicateCheck.score;
  if (duplicateCheck.reason) reasons.push(duplicateCheck.reason);

  return {
    score: Math.min(1, Math.max(0, totalScore)),
    reasons,
  };
}
