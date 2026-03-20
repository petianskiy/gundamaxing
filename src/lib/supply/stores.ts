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

function enc(q: string): string {
  return encodeURIComponent(q);
}

/** Get a clean product search name, stripping brand duplication. */
function getSearchName(s: SupplyData): string {
  if (s.searchName) return s.searchName;
  let n = s.name;
  if (n.toLowerCase().startsWith(s.brand.toLowerCase())) {
    n = n.slice(s.brand.length).trim();
  }
  return n;
}

/** Strip parenthetical suffixes for tighter searches. */
function stripParenthetical(s: string): string {
  return s.replace(/\s*\([^)]*\)\s*/g, "").trim();
}

function amazonQuery(s: SupplyData): string {
  const name = stripParenthetical(getSearchName(s));
  if (s.code) return `${s.brand} ${name} ${s.code}`;
  return `${s.brand} ${name}`;
}

function newtypeQuery(s: SupplyData): string {
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

const STORES: StoreAdapter[] = [
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
      links.push({
        slug: store.slug,
        name: store.name,
        region: store.region,
        url: store.buildUrl(store.buildQuery(supply)),
      });
    }
  }

  for (const store of STORES) {
    if (seen.has(store.slug)) continue;
    seen.add(store.slug);
    links.push({
      slug: store.slug,
      name: store.name,
      region: store.region,
      url: store.buildUrl(store.buildQuery(supply)),
    });
  }

  return links;
}
