import type { StoreRegion } from "./regions";

export interface StoreAdapter {
  slug: string;
  name: string;
  region: StoreRegion;
  /** Generate a search URL for a given product query */
  searchUrl: (query: string) => string;
  /** Generate a direct product URL if we have a code/identifier */
  productUrl?: (code: string) => string;
}

function encodeSearch(q: string): string {
  return encodeURIComponent(q);
}

// ─── Store Adapters ──────────────────────────────────────────────

const hlj: StoreAdapter = {
  slug: "hlj",
  name: "HobbyLink Japan",
  region: "JP",
  searchUrl: (q) => `https://www.hlj.com/search/?q=${encodeSearch(q)}`,
};

const amazonJp: StoreAdapter = {
  slug: "amazon-jp",
  name: "Amazon Japan",
  region: "JP",
  searchUrl: (q) => `https://www.amazon.co.jp/s?k=${encodeSearch(q)}`,
};

const amazonUs: StoreAdapter = {
  slug: "amazon-us",
  name: "Amazon",
  region: "NA",
  searchUrl: (q) => `https://www.amazon.com/s?k=${encodeSearch(q)}`,
};

const hobbyFrontline: StoreAdapter = {
  slug: "hobby-frontline",
  name: "Hobby Frontline",
  region: "EU",
  searchUrl: (q) => `https://www.hobbyfrontline.com/default/catalogsearch/result/?q=${encodeSearch(q)}`,
};

// ─── Registry ────────────────────────────────────────────────────

const ALL_STORES: StoreAdapter[] = [hlj, amazonJp, amazonUs, hobbyFrontline];

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
 * Combines brand + name + code for best search relevance.
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

  // Ensure all stores appear (even outside the priority list)
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

export function getAllStores(): StoreAdapter[] {
  return ALL_STORES;
}
