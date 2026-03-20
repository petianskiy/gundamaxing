import { cache } from "react";
import { db } from "@/lib/db";
import { buildSearchConditions, scoreMatch, scoreToConfidence, type MatchConfidence } from "@/lib/supply/search";

export interface SupplyResult {
  id: string;
  brand: string;
  productLine: string | null;
  name: string;
  code: string | null;
  category: string;
  subcategory: string | null;
  finish: string | null;
  solventType: string | null;
  colorHex: string | null;
  imageUrl: string | null;
  slug: string;
}

export interface SupplySearchResult extends SupplyResult {
  confidence: MatchConfidence;
  buildCount: number;
}

/**
 * Search supplies by query string. Returns ranked results with confidence.
 */
export async function searchSupplies(
  query: string,
  limit = 10,
): Promise<SupplySearchResult[]> {
  const conditions = buildSearchConditions(query);
  if (!conditions) return [];

  const supplies = await db.supply.findMany({
    where: {
      isActive: true,
      ...conditions,
    },
    select: {
      id: true,
      brand: true,
      productLine: true,
      name: true,
      code: true,
      category: true,
      subcategory: true,
      finish: true,
      solventType: true,
      colorHex: true,
      imageUrl: true,
      slug: true,
      aliases: { select: { alias: true } },
      _count: { select: { buildSupplies: true } },
    },
    take: limit * 2, // fetch extra for scoring/re-ranking
  });

  // Score and rank
  const scored = supplies.map((s) => {
    const candidates = [
      `${s.brand} ${s.name}`,
      s.code ? `${s.brand} ${s.code}` : "",
      s.code || "",
      s.name,
      s.productLine ? `${s.brand} ${s.productLine} ${s.name}` : "",
      ...s.aliases.map((a) => a.alias),
    ].filter(Boolean);

    const bestScore = Math.max(...candidates.map((c) => scoreMatch(query, c)));

    return { supply: s, score: bestScore };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ supply: { aliases, _count, ...s }, score }) => ({
      ...s,
      confidence: scoreToConfidence(score),
      buildCount: _count.buildSupplies,
    }));
}

/**
 * Get a single supply by ID with full details.
 */
export const getSupplyById = cache(async (id: string): Promise<SupplyResult | null> => {
  const supply = await db.supply.findUnique({
    where: { id, isActive: true },
    select: {
      id: true,
      brand: true,
      productLine: true,
      name: true,
      code: true,
      category: true,
      subcategory: true,
      finish: true,
      solventType: true,
      colorHex: true,
      imageUrl: true,
      slug: true,
    },
  });
  return supply;
});

/**
 * Get a single supply by slug.
 */
export const getSupplyBySlug = cache(async (slug: string): Promise<SupplyResult | null> => {
  const supply = await db.supply.findUnique({
    where: { slug, isActive: true },
    select: {
      id: true,
      brand: true,
      productLine: true,
      name: true,
      code: true,
      category: true,
      subcategory: true,
      finish: true,
      solventType: true,
      colorHex: true,
      imageUrl: true,
      slug: true,
    },
  });
  return supply;
});

/**
 * Get supplies linked to a build.
 */
export async function getBuildSupplies(buildId: string): Promise<(SupplyResult & { rawText: string | null })[]> {
  const links = await db.buildSupply.findMany({
    where: { buildId },
    select: {
      rawText: true,
      supply: {
        select: {
          id: true,
          brand: true,
          productLine: true,
          name: true,
          code: true,
          category: true,
          subcategory: true,
          finish: true,
          solventType: true,
          colorHex: true,
          imageUrl: true,
          slug: true,
        },
      },
    },
  });
  return links.map((l) => ({ ...l.supply, rawText: l.rawText }));
}

/**
 * Count how many builds use a given supply.
 */
export async function getSupplyBuildCount(supplyId: string): Promise<number> {
  return db.buildSupply.count({ where: { supplyId } });
}
