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
 * Strip hyphens, periods, and spaces from a string to create a
 * "collapsed" form for code matching.
 * "C-110" → "c110", "SPN-120" → "spn120", "mr. color" → "mrcolor"
 */
function collapseCode(s: string): string {
  return s.toLowerCase().replace(/[\s\-./]/g, "");
}

/**
 * Break a query into search tokens.
 */
export function tokenize(query: string): string[] {
  return normalizeQuery(query).split(" ").filter(Boolean);
}

/**
 * Expand a token into search variants for the DB query.
 * Handles punctuation-stripped forms so "c-110" matches "c110" and vice versa.
 */
function tokenVariants(token: string): string[] {
  const variants = [token];
  // Stripped form (no hyphens/periods)
  const stripped = token.replace(/[\-./]/g, "");
  if (stripped !== token) variants.push(stripped);
  // If token has no punctuation but looks like a code (letters+digits),
  // try inserting a hyphen at the letter/digit boundary: "spn120" → "spn-120"
  if (/^[a-z]+\d+$/i.test(token)) {
    const withHyphen = token.replace(/([a-z])(\d)/i, "$1-$2");
    if (withHyphen !== token) variants.push(withHyphen);
  }
  return [...new Set(variants)];
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

  // Also check collapsed form for code-style matches
  // "mr. color c-110" vs "mr. color c110" → should be near-exact
  if (collapseCode(c) === collapseCode(q)) return 98;

  // Candidate is a close match: full query contained, and lengths are similar
  if (c.includes(q)) {
    const lengthRatio = q.length / c.length;
    if (lengthRatio > 0.7) return 90;
    return 70;
  }

  // Full query contains candidate (user typed more context than the product name)
  if (q.includes(c) && c.length > 3) {
    const lengthRatio = c.length / q.length;
    if (lengthRatio > 0.7) return 85;
    return 65;
  }

  // Token matching — also match via collapsed code forms
  const tokens = tokenize(query);
  if (tokens.length === 0) return 0;

  let matched = 0;
  const cCollapsed = collapseCode(c);
  for (const token of tokens) {
    const variants = tokenVariants(token);
    if (variants.some((v) => c.includes(v) || cCollapsed.includes(collapseCode(v)))) {
      matched++;
    }
  }

  const ratio = matched / tokens.length;
  if (ratio === 0) return 0;

  // All tokens matched
  if (ratio === 1) {
    const queryLen = tokens.join("").length;
    const candLen = c.replace(/\s/g, "").length;
    const coverage = queryLen / candLen;
    if (coverage > 0.6) return 60;
    return 45;
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
 * Generates variant tokens to handle punctuation differences in codes.
 */
export function buildSearchConditions(query: string) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return null;

  // Each token (with variants) must match at least one field
  const tokenConditions = tokens.map((token) => {
    const variants = tokenVariants(token);
    // Build OR conditions across all variants and all fields
    const fieldConditions = variants.flatMap((v) => [
      { name: { contains: v, mode: "insensitive" as const } },
      { brand: { contains: v, mode: "insensitive" as const } },
      { code: { contains: v, mode: "insensitive" as const } },
      { productLine: { contains: v, mode: "insensitive" as const } },
      { aliases: { some: { alias: { contains: v, mode: "insensitive" as const } } } },
    ]);
    return { OR: fieldConditions };
  });

  return { AND: tokenConditions };
}
