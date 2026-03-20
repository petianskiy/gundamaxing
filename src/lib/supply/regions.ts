export type StoreRegion = "JP" | "CN" | "SEA" | "EU" | "NA" | "GLOBAL";

const COUNTRY_TO_REGION: Record<string, StoreRegion> = {
  // Japan
  Japan: "JP", "日本": "JP", JP: "JP",
  // China
  China: "CN", "中国": "CN", "中國": "CN", CN: "CN",
  // Southeast Asia
  Taiwan: "SEA", "台灣": "SEA", "台湾": "SEA", TW: "SEA",
  Malaysia: "SEA", MY: "SEA",
  Singapore: "SEA", SG: "SEA",
  Thailand: "SEA", TH: "SEA",
  Philippines: "SEA", PH: "SEA",
  Indonesia: "SEA", ID: "SEA",
  Vietnam: "SEA", VN: "SEA",
  "Hong Kong": "SEA", HK: "SEA",
  "South Korea": "SEA", Korea: "SEA", KR: "SEA",
  // Europe
  Germany: "EU", DE: "EU",
  France: "EU", FR: "EU",
  UK: "EU", "United Kingdom": "EU", GB: "EU",
  Italy: "EU", IT: "EU",
  Spain: "EU", ES: "EU",
  Netherlands: "EU", NL: "EU",
  Poland: "EU", PL: "EU",
  Sweden: "EU", SE: "EU",
  Austria: "EU", AT: "EU",
  Belgium: "EU", BE: "EU",
  Switzerland: "EU", CH: "EU",
  // North America
  USA: "NA", "United States": "NA", US: "NA",
  Canada: "NA", CA: "NA",
  Mexico: "NA", MX: "NA",
  // Australia / Oceania → treat as NA for store priority (similar English-language stores)
  Australia: "NA", AU: "NA",
  "New Zealand": "NA", NZ: "NA",
};

export function resolveRegion(country?: string | null): StoreRegion {
  if (!country) return "GLOBAL";
  return COUNTRY_TO_REGION[country] ?? "GLOBAL";
}

export function getRegionPriority(primary: StoreRegion): StoreRegion[] {
  // Primary region first, then GLOBAL fallback, then everything else
  const all: StoreRegion[] = ["JP", "CN", "SEA", "EU", "NA", "GLOBAL"];
  return [primary, "GLOBAL", ...all.filter((r) => r !== primary && r !== "GLOBAL")];
}

export function resolveLocaleRegion(locale?: string | null): StoreRegion {
  if (!locale) return "GLOBAL";
  const map: Record<string, StoreRegion> = {
    ja: "JP",
    "zh-TW": "SEA",
  };
  return map[locale] ?? "GLOBAL";
}
