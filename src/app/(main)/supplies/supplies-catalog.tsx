"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import {
  Search, Package, Paintbrush, Droplets, Layers, Wrench, Scissors,
  ExternalLink,
} from "lucide-react";
import { getStoreLinks } from "@/lib/supply/stores";
import { resolveLocaleRegion, getRegionPriority, type StoreRegion } from "@/lib/supply/regions";

interface Supply {
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
  slug: string;
  buildCount: number;
}

const CATEGORY_ICONS: Record<string, typeof Package> = {
  PAINT: Paintbrush, PRIMER: Layers, TOPCOAT: Layers, THINNER: Droplets,
  CEMENT: Droplets, PANEL_LINER: Paintbrush, MARKER: Paintbrush,
  TOOL: Wrench, ABRASIVE: Scissors, MASKING: Scissors,
  PUTTY: Package, DECAL: Package, OTHER: Package,
};

const CATEGORY_LABELS: Record<string, string> = {
  PAINT: "Paint", PRIMER: "Primer", TOPCOAT: "Topcoat", THINNER: "Thinner",
  CEMENT: "Cement", PANEL_LINER: "Panel Liner", MARKER: "Marker",
  TOOL: "Tool", ABRASIVE: "Abrasive", MASKING: "Masking",
  PUTTY: "Putty", DECAL: "Decal", OTHER: "Other",
};

const REGION_FLAGS: Record<StoreRegion, string> = {
  JP: "JP", CN: "CN", SEA: "SEA", EU: "EU", NA: "US", GLOBAL: "Global",
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS);

function getUniqueBrands(supplies: Supply[]): string[] {
  return [...new Set(supplies.map((s) => s.brand))].sort();
}

export function SupplyCatalogView({ supplies }: { supplies: Supply[] }) {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const brands = useMemo(() => getUniqueBrands(supplies), [supplies]);

  const filtered = useMemo(() => {
    let result = supplies;
    if (selectedBrand) result = result.filter((s) => s.brand === selectedBrand);
    if (selectedCategory) result = result.filter((s) => s.category === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.brand.toLowerCase().includes(q) ||
          (s.code && s.code.toLowerCase().includes(q)) ||
          (s.productLine && s.productLine.toLowerCase().includes(q))
      );
    }
    return result;
  }, [supplies, selectedBrand, selectedCategory, search]);

  // Group by brand
  const grouped = useMemo(() => {
    const map = new Map<string, Supply[]>();
    for (const s of filtered) {
      const list = map.get(s.brand) || [];
      list.push(s);
      map.set(s.brand, list);
    }
    return map;
  }, [filtered]);

  const region = resolveLocaleRegion(locale);
  const priority = getRegionPriority(region);

  return (
    <div className="relative min-h-screen">
      <div className="mx-auto max-w-5xl px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("supply.pageTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("supply.pageSubtitle")}</p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("supply.catalogSearchPlaceholder")}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border/50 bg-card text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-gx-red/50 focus:ring-1 focus:ring-gx-red/20 transition-colors"
            />
          </div>

          {/* Brand filter */}
          <select
            value={selectedBrand || ""}
            onChange={(e) => setSelectedBrand(e.target.value || null)}
            className="px-3 py-2.5 rounded-lg border border-border/50 bg-card text-foreground text-sm focus:outline-none focus:border-gx-red/50 focus:ring-1 focus:ring-gx-red/20 transition-colors appearance-none"
          >
            <option value="">{t("supply.allBrands")}</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="px-3 py-2.5 rounded-lg border border-border/50 bg-card text-foreground text-sm focus:outline-none focus:border-gx-red/50 focus:ring-1 focus:ring-gx-red/20 transition-colors appearance-none"
          >
            <option value="">{t("supply.allCategories")}</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>

        {/* Count */}
        <p className="text-xs text-muted-foreground mb-4">
          {filtered.length} {filtered.length === 1 ? "supply" : "supplies"}
          {(selectedBrand || selectedCategory || search.trim()) && (
            <button
              onClick={() => { setSelectedBrand(null); setSelectedCategory(null); setSearch(""); }}
              className="ml-2 text-gx-red hover:underline"
            >
              {t("supply.clearFilters")}
            </button>
          )}
        </p>

        {/* Results grouped by brand */}
        <div className="space-y-8">
          {[...grouped.entries()].map(([brand, items]) => (
            <div key={brand}>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 border-b border-border/30 pb-2">
                {brand}
                <span className="text-muted-foreground font-normal ml-2">({items.length})</span>
              </h2>
              <div className="grid gap-2">
                {items.map((supply) => {
                  const Icon = CATEGORY_ICONS[supply.category] || Package;
                  const isExpanded = expandedId === supply.id;
                  const storeLinks = isExpanded ? getStoreLinks(supply, priority) : [];

                  return (
                    <div key={supply.id}>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : supply.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-start gap-3 touch-manipulation",
                          isExpanded
                            ? "border-gx-red/30 bg-gx-red/5"
                            : "border-border/30 bg-card hover:border-border/60"
                        )}
                      >
                        {/* Color swatch or icon */}
                        <div className="mt-0.5 shrink-0">
                          {supply.colorHex ? (
                            <span
                              className="block h-5 w-5 rounded-full border border-border/50"
                              style={{ backgroundColor: supply.colorHex }}
                            />
                          ) : (
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">{supply.name}</span>
                            {supply.code && (
                              <span className="text-xs font-mono text-muted-foreground">{supply.code}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {supply.productLine && (
                              <span className="text-[10px] text-muted-foreground">{supply.productLine}</span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {CATEGORY_LABELS[supply.category] || supply.category}
                            </span>
                            {supply.solventType && (
                              <span className="text-[10px] text-muted-foreground/70">{supply.solventType}</span>
                            )}
                            {supply.finish && (
                              <span className="text-[10px] text-muted-foreground/70">{supply.finish}</span>
                            )}
                            {supply.buildCount > 0 && (
                              <span className="text-[10px] text-muted-foreground/50">
                                {supply.buildCount === 1
                                  ? t("supply.usedInBuild")
                                  : t("supply.usedInBuilds").replace("{count}", String(supply.buildCount))}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Expanded: store links */}
                      {isExpanded && (
                        <div className="ml-8 mt-2 mb-2 space-y-1.5">
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
                            {t("supply.whereToBuy")}
                          </p>
                          {storeLinks.map((link) => (
                            <a
                              key={link.slug}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between px-3 py-2 rounded-md border border-border/40 bg-muted/30 hover:bg-muted/60 hover:border-border transition-colors group touch-manipulation"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] font-mono text-muted-foreground/70 w-7 shrink-0">
                                  {REGION_FLAGS[link.region]}
                                </span>
                                <span className="text-sm text-foreground truncate">{link.name}</span>
                              </div>
                              <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-gx-red transition-colors shrink-0" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">{t("supply.noResults")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
