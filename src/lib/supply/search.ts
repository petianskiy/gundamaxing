/**
 * Supply fuzzy search utilities.
 * Uses Prisma queries with ILIKE for DB-level search,
 * plus a lightweight client-side scoring function for ranking.
 */

export type MatchConfidence = "exact" | "strong" | "possible";

/**
 * Normalize a search query for matching:
 * lowercase, collapse whitespace, strip common noise.
 */
export function normalizeQuery(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s\-#./]/g, "") // keep alphanumeric, spaces, hyphens, #, ., /
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Break a query into search tokens.
 */
export function tokenize(query: string): string[] {
  return normalizeQuery(query).split(" ").filter(Boolean);
}

/**
 * Score how well a candidate string matches a query.
 * Higher = better match. Returns 0 for no match.
 *
 * Score bands:
 *   80-100  → "exact"    (exact or full-query-contained match)
 *   50-79   → "strong"   (all tokens match, or code/name match)
 *   1-49    → "possible" (partial token match)
 */
export function scoreMatch(query: string, candidate: string): number {
  const q = normalizeQuery(query);
  const c = candidate.toLowerCase();

  // Exact match (full string equality)
  if (c === q) return 100;

  // Candidate is a close match: full query contained, and lengths are similar
  // "tamiya panel line black" vs "Tamiya Panel Line Accent Color Black" → strong, not exact
  if (c.includes(q)) {
    const lengthRatio = q.length / c.length;
    if (lengthRatio > 0.7) return 90; // very close substring → exact
    return 70; // contained but candidate is much longer → strong
  }

  // Full query contains candidate (user typed more context than the product name)
  if (q.includes(c) && c.length > 3) {
    const lengthRatio = c.length / q.length;
    if (lengthRatio > 0.7) return 85;
    return 65;
  }

  // Token matching
  const tokens = tokenize(query);
  if (tokens.length === 0) return 0;

  let matched = 0;
  for (const token of tokens) {
    if (c.includes(token)) matched++;
  }

  const ratio = matched / tokens.length;
  if (ratio === 0) return 0;

  // All tokens matched
  if (ratio === 1) {
    // How much of the candidate is covered by query tokens?
    const queryLen = tokens.join("").length;
    const candLen = c.replace(/\s/g, "").length;
    const coverage = queryLen / candLen;
    if (coverage > 0.6) return 60; // good coverage → strong
    return 45; // all tokens hit but query is vague → possible
  }

  // Partial token match → always possible
  return Math.round(ratio * 40);
}

/**
 * Derive confidence tier from a numeric score.
 */
export function scoreToConfidence(score: number): MatchConfidence {
  if (score >= 80) return "exact";
  if (score >= 50) return "strong";
  return "possible";
}

/**
 * Build Prisma-compatible ILIKE conditions for searching supplies.
 * Returns an array of OR conditions for use in a Prisma where clause.
 */
export function buildSearchConditions(query: string) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return null;

  // Each token must match at least one of: name, brand, code, productLine, or alias
  const tokenConditions = tokens.map((token) => ({
    OR: [
      { name: { contains: token, mode: "insensitive" as const } },
      { brand: { contains: token, mode: "insensitive" as const } },
      { code: { contains: token, mode: "insensitive" as const } },
      { productLine: { contains: token, mode: "insensitive" as const } },
      { aliases: { some: { alias: { contains: token, mode: "insensitive" as const } } } },
    ],
  }));

  return { AND: tokenConditions };
}
