import type { StoreRegion } from "./regions";

// ─── Types ───────────────────────────────────────────────────────

export interface SupplyData {
  brand: string;
  name: string;
  code?: string | null;
  searchName?: string | null;
  productLine?: string | null;
}

export interface StoreLink {
  slug: string;
  name: string;
  region: StoreRegion;
  url: string;
}

// ─── Query Strategies ────────────────────────────────────────────
// Each store gets a tailored query derived from the supply data.
// Strategy: try the most specific query that the store can handle,
// not the most verbose one.

/** Brand name normalization for store compatibility. */
const BRAND_SEARCH_NAMES: Record<string, string> = {
  "Mr. Hobby": "GSI Creos",   // HLJ/hobby stores use manufacturer name
  "GodHand": "GodHand",
  "DSPIAE": "DSPIAE",
  "Tamiya": "Tamiya",
  "Gaia Notes": "Gaianotes",  // Often sold under single-word branding
};

function getStoreBrand(brand: string): string {
  return BRAND_SEARCH_NAMES[brand] ?? brand;
}

/** Get a clean product search name, stripping brand duplication. */
function getSearchName(s: SupplyData): string {
  if (s.searchName) return s.searchName;
  // Fallback: strip brand prefix from name
  let n = s.name;
  if (n.toLowerCase().startsWith(s.brand.toLowerCase())) {
    n = n.slice(s.brand.length).trim();
  }
  return n;
}

/** Strip parenthetical suffixes like "(Square Bottle)" for tighter searches. */
function stripParenthetical(s: string): string {
  return s.replace(/\s*\([^)]*\)\s*/g, "").trim();
}

// ─── Per-Store Query Builders ────────────────────────────────────
// Each returns the best search query string for that store.

function hljQuery(s: SupplyData): string {
  // HLJ uses GSI Creos naming for Mr. Hobby. Code-first works well.
  const brand = getStoreBrand(s.brand);
  if (s.code) return `${brand} ${s.code}`;
  return `${brand} ${stripParenthetical(getSearchName(s))}`;
}

function amazonQuery(s: SupplyData): string {
  // Amazon has broad keyword matching. Short queries work best.
  const name = stripParenthetical(getSearchName(s));
  if (s.code) return `${s.brand} ${name} ${s.code}`;
  return `${s.brand} ${name}`;
}

function newtypeQuery(s: SupplyData): string {
  // Newtype carries many hobby supplies. Brand + short name works.
  const name = stripParenthetical(getSearchName(s));
  if (s.code) return `${s.brand} ${s.code}`;
  return `${s.brand} ${name}`;
}

// ─── Store Adapters ──────────────────────────────────────────────

interface StoreAdapter {
  slug: string;
  name: string;
  region: StoreRegion;
  buildUrl: (query: string) => string;
  buildQuery: (supply: SupplyData) => string;
}

function enc(q: string): string {
  return encodeURIComponent(q);
}

const STORES: StoreAdapter[] = [
  {
    slug: "hlj",
    name: "HobbyLink Japan",
    region: "JP",
    buildQuery: hljQuery,
    buildUrl: (q) => `https://www.hlj.com/search/${q.replace(/\s+/g, "+")}`,
  },
  {
    slug: "amazon-jp",
    name: "Amazon Japan",
    region: "JP",
    buildQuery: amazonQuery,
    buildUrl: (q) => `https://www.amazon.co.jp/s?k=${enc(q)}`,
  },
  {
    slug: "amazon-us",
    name: "Amazon",
    region: "NA",
    buildQuery: amazonQuery,
    buildUrl: (q) => `https://www.amazon.com/s?k=${enc(q)}`,
  },
  {
    slug: "newtype",
    name: "Newtype HQ",
    region: "NA",
    buildQuery: newtypeQuery,
    buildUrl: (q) => `https://newtype.us/search?q=${enc(q)}`,
  },
  {
    slug: "amazon-uk",
    name: "Amazon UK",
    region: "EU",
    buildQuery: amazonQuery,
    buildUrl: (q) => `https://www.amazon.co.uk/s?k=${enc(q)}`,
  },
];

// ─── Region Index ────────────────────────────────────────────────

const STORES_BY_REGION = new Map<StoreRegion, StoreAdapter[]>();
for (const store of STORES) {
  const list = STORES_BY_REGION.get(store.region) || [];
  list.push(store);
  STORES_BY_REGION.set(store.region, list);
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Generate store links for a supply, ordered by region priority.
 * Each store gets a tailored search query. Pure function, instant.
 */
export function getStoreLinks(
  supply: SupplyData,
  regionPriority: StoreRegion[],
): StoreLink[] {
  const seen = new Set<string>();
  const links: StoreLink[] = [];

  for (const region of regionPriority) {
    const stores = STORES_BY_REGION.get(region) || [];
    for (const store of stores) {
      if (seen.has(store.slug)) continue;
      seen.add(store.slug);
      const query = store.buildQuery(supply);
      links.push({
        slug: store.slug,
        name: store.name,
        region: store.region,
        url: store.buildUrl(query),
      });
    }
  }

  for (const store of STORES) {
    if (seen.has(store.slug)) continue;
    seen.add(store.slug);
    const query = store.buildQuery(supply);
    links.push({
      slug: store.slug,
      name: store.name,
      region: store.region,
      url: store.buildUrl(query),
    });
  }

  return links;
}
