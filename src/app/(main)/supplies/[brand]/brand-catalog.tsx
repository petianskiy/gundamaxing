"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import {
  Search, Package, Paintbrush, Droplets, Layers, Wrench, Scissors,
  ExternalLink, ArrowLeft,
} from "lucide-react";
import { getStoreLinks } from "@/lib/supply/stores";
import { resolveLocaleRegion, getRegionPriority, type StoreRegion } from "@/lib/supply/regions";

// ─── Types ───────────────────────────────────────────────────────

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
  searchName: string | null;
  buildCount: number;
}

// ─── Constants ───────────────────────────────────────────────────

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

const REGION_LABELS: Record<StoreRegion, string> = {
  JP: "JP", CN: "CN", SEA: "SEA", EU: "EU", NA: "US", GLOBAL: "",
};

// ─── Component ───────────────────────────────────────────────────

export function BrandCatalog({
  brand,
  logo,
  tagline,
  supplies,
}: {
  brand: string;
  logo: string;
  tagline: string;
  supplies: Supply[];
}) {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Set(supplies.map((s) => s.category))].sort(),
    [supplies]
  );

  const filtered = useMemo(() => {
    let result = supplies;
    if (selectedCategory) result = result.filter((s) => s.category === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.code && s.code.toLowerCase().includes(q)) ||
          (s.productLine && s.productLine.toLowerCase().includes(q))
      );
    }
    return result;
  }, [supplies, selectedCategory, search]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, Supply[]>();
    for (const s of filtered) {
      const list = map.get(s.category) || [];
      list.push(s);
      map.set(s.category, list);
    }
    return map;
  }, [filtered]);

  const region = resolveLocaleRegion(locale);
  const priority = getRegionPriority(region);

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Back link */}
        <Link
          href="/supplies"
          className="animate-page-header inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All brands
        </Link>

        {/* Brand header */}
        <div className="animate-page-header flex items-center gap-5 mb-10">
          {logo && (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-black/40 border border-white/[0.1] flex items-center justify-center overflow-hidden shrink-0">
              <Image src={logo} alt={brand} width={80} height={80} className="object-contain" />
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {brand}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{tagline}</p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              {supplies.length} {supplies.length === 1 ? "product" : "products"}
            </p>
          </div>
        </div>

        {/* Search + Category filter */}
        <div className="animate-page-content flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${brand} products...`}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/40 bg-black/30 backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gx-red/50 focus:ring-1 focus:ring-gx-red/20"
            />
          </div>
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium transition-all border",
                  !selectedCategory
                    ? "border-gx-red/50 bg-gx-red/15 text-gx-red"
                    : "border-border/30 bg-black/30 text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-medium transition-all border",
                    selectedCategory === cat
                      ? "border-gx-red/50 bg-gx-red/15 text-gx-red"
                      : "border-border/30 bg-black/30 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {CATEGORY_LABELS[cat] || cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Count */}
        <p className="animate-page-content text-xs text-muted-foreground/50 mb-6">
          {filtered.length} {filtered.length === 1 ? "product" : "products"}
          {(selectedCategory || search.trim()) && (
            <button
              onClick={() => { setSelectedCategory(null); setSearch(""); }}
              className="ml-2 text-gx-red hover:underline"
            >
              Clear
            </button>
          )}
        </p>

        {/* Products grouped by category */}
        <div className="animate-page-grid space-y-10">
          {[...grouped.entries()].map(([category, items]) => {
            const CatIcon = CATEGORY_ICONS[category] || Package;
            return (
              <section key={category}>
                <div className="flex items-center gap-2 mb-4">
                  <CatIcon className="h-4 w-4 text-muted-foreground/50" />
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    {CATEGORY_LABELS[category] || category}
                  </h2>
                  <span className="text-xs text-muted-foreground/40">{items.length}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {items.map((supply) => (
                    <ProductCard
                      key={supply.id}
                      supply={supply}
                      isExpanded={expandedId === supply.id}
                      onToggle={() => setExpandedId(expandedId === supply.id ? null : supply.id)}
                      regionPriority={priority}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-sm">No products match your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Product Card ────────────────────────────────────────────────

function ProductCard({
  supply,
  isExpanded,
  onToggle,
  regionPriority,
}: {
  supply: Supply;
  isExpanded: boolean;
  onToggle: () => void;
  regionPriority: StoreRegion[];
}) {
  const { t } = useTranslation();
  const Icon = CATEGORY_ICONS[supply.category] || Package;
  const storeLinks = isExpanded ? getStoreLinks(supply, regionPriority) : [];

  return (
    <div
      className={cn(
        "group rounded-xl border backdrop-blur-sm transition-all overflow-hidden",
        isExpanded
          ? "border-gx-red/30 bg-black/60 shadow-lg shadow-gx-red/5"
          : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12]"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-3.5 flex gap-3.5 touch-manipulation"
      >
        {/* Thumbnail */}
        <div className={cn(
          "w-11 h-11 rounded-lg flex items-center justify-center shrink-0 overflow-hidden",
          supply.colorHex ? "" : "bg-white/[0.04] border border-white/[0.08]"
        )}>
          {supply.colorHex ? (
            <span
              className="w-full h-full block rounded-lg border border-white/[0.1]"
              style={{ backgroundColor: supply.colorHex }}
            />
          ) : (
            <Icon className="h-5 w-5 text-muted-foreground/40" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-foreground leading-tight truncate">
            {supply.name}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            {supply.code && (
              <span className="text-[10px] font-mono text-gx-red/70 bg-gx-red/10 px-1.5 py-0.5 rounded">
                {supply.code}
              </span>
            )}
            {supply.productLine && (
              <span className="text-[10px] text-muted-foreground/40 truncate">{supply.productLine}</span>
            )}
          </div>
          {(supply.finish || supply.solventType) && (
            <p className="text-[10px] text-muted-foreground/30 mt-0.5 truncate">
              {[supply.solventType, supply.finish].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </button>

      {/* Store links */}
      {isExpanded && storeLinks.length > 0 && (
        <div className="px-3.5 pb-3.5">
          <div className="border-t border-white/[0.06] pt-2.5">
            <p className="text-[9px] text-muted-foreground/40 font-semibold uppercase tracking-widest mb-2">
              {t("supply.whereToBuy")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {storeLinks.map((link) => (
                <a
                  key={link.slug}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] transition-colors group/link text-xs touch-manipulation"
                >
                  <span className="text-[9px] font-mono text-muted-foreground/40">
                    {REGION_LABELS[link.region]}
                  </span>
                  <span className="text-foreground/70 group-hover/link:text-foreground">{link.name}</span>
                  <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/30 group-hover/link:text-gx-red transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
