import type { StoreRegion } from "./regions";

export interface StoreAdapter {
  slug: string;
  name: string;
  region: StoreRegion;
  searchUrl: (query: string) => string;
}

function enc(q: string): string {
  return encodeURIComponent(q);
}

// ─── Store Adapters ──────────────────────────────────────────────
// Each adapter generates a deterministic search URL. No fetching.

const hlj: StoreAdapter = {
  slug: "hlj",
  name: "HobbyLink Japan",
  region: "JP",
  // HLJ uses /search/QUERY format with + for spaces
  searchUrl: (q) => `https://www.hlj.com/search/${q.replace(/\s+/g, "+")}`,
};

const amazonJp: StoreAdapter = {
  slug: "amazon-jp",
  name: "Amazon Japan",
  region: "JP",
  searchUrl: (q) => `https://www.amazon.co.jp/s?k=${enc(q)}`,
};

const amazonUs: StoreAdapter = {
  slug: "amazon-us",
  name: "Amazon",
  region: "NA",
  searchUrl: (q) => `https://www.amazon.com/s?k=${enc(q)}`,
};

const newtypeHq: StoreAdapter = {
  slug: "newtype",
  name: "Newtype HQ",
  region: "NA",
  searchUrl: (q) => `https://newtype.us/search?q=${enc(q)}`,
};

const amazonUk: StoreAdapter = {
  slug: "amazon-uk",
  name: "Amazon UK",
  region: "EU",
  searchUrl: (q) => `https://www.amazon.co.uk/s?k=${enc(q)}`,
};

// ─── Registry ────────────────────────────────────────────────────

const ALL_STORES: StoreAdapter[] = [hlj, amazonJp, amazonUs, newtypeHq, amazonUk];

const STORES_BY_REGION = new Map<StoreRegion, StoreAdapter[]>();
for (const store of ALL_STORES) {
  const list = STORES_BY_REGION.get(store.region) || [];
  list.push(store);
  STORES_BY_REGION.set(store.region, list);
}

export interface StoreLink {
  slug: string;
  name: string;
  region: StoreRegion;
  url: string;
}

/**
 * Build a search query string for a supply.
 * Uses brand + name (+ code if present) for best search relevance.
 */
function buildSearchQuery(supply: {
  brand: string;
  name: string;
  code?: string | null;
}): string {
  const parts = [supply.brand, supply.name];
  if (supply.code) parts.push(supply.code);
  return parts.join(" ");
}

/**
 * Generate store links for a supply, ordered by region priority.
 * Pure function — no external fetching, returns instantly.
 */
export function getStoreLinks(
  supply: { brand: string; name: string; code?: string | null },
  regionPriority: StoreRegion[],
): StoreLink[] {
  const query = buildSearchQuery(supply);
  const seen = new Set<string>();
  const links: StoreLink[] = [];

  for (const region of regionPriority) {
    const stores = STORES_BY_REGION.get(region) || [];
    for (const store of stores) {
      if (seen.has(store.slug)) continue;
      seen.add(store.slug);
      links.push({
        slug: store.slug,
        name: store.name,
        region: store.region,
        url: store.searchUrl(query),
      });
    }
  }

  // Include remaining stores not yet in the list
  for (const store of ALL_STORES) {
    if (seen.has(store.slug)) continue;
    seen.add(store.slug);
    links.push({
      slug: store.slug,
      name: store.name,
      region: store.region,
      url: store.searchUrl(query),
    });
  }

  return links;
}
