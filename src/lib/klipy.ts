// ─── Types ──────────────────────────────────────────────────────

export interface KlipyGif {
  slug: string;
  title: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
}

interface KlipyFileVariant {
  url: string;
  width: number;
  height: number;
  size?: number;
}

interface KlipyFileSize {
  gif?: KlipyFileVariant;
  webp?: KlipyFileVariant;
  jpg?: KlipyFileVariant;
  mp4?: KlipyFileVariant;
}

interface KlipyRawGif {
  id: number;
  slug: string;
  title: string;
  type: string;
  tags: string[];
  blur_preview?: string;
  file: {
    hd?: KlipyFileSize;
    md?: KlipyFileSize;
    sm?: KlipyFileSize;
    xs?: KlipyFileSize;
  };
}

interface KlipyResponse {
  result: boolean;
  data: {
    data: KlipyRawGif[];
    current_page: number;
    per_page: number;
    has_next: boolean;
  };
}

// ─── Constants ──────────────────────────────────────────────────

const KLIPY_API_KEY = process.env.KLIPY_API_KEY;
const BASE_URL = `https://api.klipy.com/api/v1`;

// Gundam-related keywords for second-layer filtering
const GUNDAM_KEYWORDS = [
  "gundam", "gunpla", "mecha", "zaku", "rx-78", "char", "zeon", "federation",
  "unicorn", "sinanju", "sazabi", "freedom", "exia", "barbatos", "aerial",
  "hg", "mg", "rg", "pg", "seed", "wing", "00", "uc", "model kit",
  "panel line", "weathering", "kitbash", "bandai", "mobile suit",
];

// ─── Helpers ────────────────────────────────────────────────────

function toKlipyGif(raw: KlipyRawGif): KlipyGif | null {
  // Prefer md size, fallback to sm, then hd
  const fileSize = raw.file?.md ?? raw.file?.sm ?? raw.file?.hd;
  if (!fileSize) return null;

  const animated = fileSize.gif ?? fileSize.webp;
  const preview = fileSize.jpg ?? fileSize.gif;
  if (!animated) return null;

  return {
    slug: raw.slug,
    title: raw.title || "",
    url: animated.url,
    previewUrl: preview?.url ?? animated.url,
    width: animated.width,
    height: animated.height,
  };
}

export function isGundamRelated(title: string, tags: string[]): boolean {
  const text = `${title} ${tags.join(" ")}`.toLowerCase();
  return GUNDAM_KEYWORDS.some((kw) => text.includes(kw));
}

// ─── API Functions ──────────────────────────────────────────────

export async function searchGifs(
  query: string,
  page: number = 1,
  perPage: number = 24,
): Promise<{ gifs: KlipyGif[]; hasNext: boolean }> {
  if (!KLIPY_API_KEY) {
    console.error("[klipy] KLIPY_API_KEY not configured");
    return { gifs: [], hasNext: false };
  }

  const params = new URLSearchParams({
    q: query,
    page: String(page),
    per_page: String(perPage),
    rating: "pg-13",
  });

  const res = await fetch(`${BASE_URL}/${KLIPY_API_KEY}/gifs/search?${params}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    console.error(`[klipy] Search failed: ${res.status} ${res.statusText}`);
    return { gifs: [], hasNext: false };
  }

  const json: KlipyResponse = await res.json();
  if (!json.result || !json.data?.data) {
    return { gifs: [], hasNext: false };
  }

  const gifs = json.data.data
    .filter((item) => isGundamRelated(item.title, item.tags))
    .map(toKlipyGif)
    .filter((g): g is KlipyGif => g !== null);

  return { gifs, hasNext: json.data.has_next };
}

export async function getTrendingGifs(
  page: number = 1,
  perPage: number = 24,
): Promise<{ gifs: KlipyGif[]; hasNext: boolean }> {
  if (!KLIPY_API_KEY) {
    console.error("[klipy] KLIPY_API_KEY not configured");
    return { gifs: [], hasNext: false };
  }

  // Use search with "gundam" to get Gundam-related trending content
  const params = new URLSearchParams({
    q: "gundam",
    page: String(page),
    per_page: String(perPage),
    rating: "pg-13",
  });

  const res = await fetch(`${BASE_URL}/${KLIPY_API_KEY}/gifs/search?${params}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    console.error(`[klipy] Trending failed: ${res.status} ${res.statusText}`);
    return { gifs: [], hasNext: false };
  }

  const json: KlipyResponse = await res.json();
  if (!json.result || !json.data?.data) {
    return { gifs: [], hasNext: false };
  }

  const gifs = json.data.data
    .map(toKlipyGif)
    .filter((g): g is KlipyGif => g !== null);

  return { gifs, hasNext: json.data.has_next };
}
