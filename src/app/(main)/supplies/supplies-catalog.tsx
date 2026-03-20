"use client";

import { useState, useMemo } from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import {
  Search, Package, Paintbrush, Droplets, Layers, Wrench, Scissors,
  ExternalLink, FlaskConical, ChevronRight,
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

const REGION_FLAGS: Record<StoreRegion, string> = {
  JP: "JP", CN: "CN", SEA: "SEA", EU: "EU", NA: "US", GLOBAL: "Global",
};

const BRAND_LOGOS: Record<string, string> = {
  "Mr. Hobby": "/brands/mr-hobby.jpg",
  "Tamiya": "/brands/tamiya.jpg",
  "Gaia Notes": "/brands/gaia-notes.jpg",
  "GodHand": "/brands/godhand.jpg",
  "DSPIAE": "/brands/dspiae.jpg",
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS);

// ─── Helpers ─────────────────────────────────────────────────────

function getUniqueBrands(supplies: Supply[]): string[] {
  return [...new Set(supplies.map((s) => s.brand))].sort();
}

// ─── Main Component ──────────────────────────────────────────────

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
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* ─── Hero ─── */}
        <div className="animate-page-header text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <FlaskConical className="h-5 w-5 text-gx-red" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
              素材目録 &middot; Supply Catalog
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight font-rajdhani">
            {t("supply.pageTitle")}
          </h1>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            {t("supply.pageSubtitle")}
          </p>
        </div>

        {/* ─── Brand Bar ─── */}
        <div className="animate-page-content flex flex-wrap items-center justify-center gap-3 mb-8">
          <button
            onClick={() => setSelectedBrand(null)}
            className={cn(
              "px-4 py-2 rounded-lg border text-xs font-medium transition-all",
              !selectedBrand
                ? "border-gx-red/40 bg-gx-red/10 text-red-400"
                : "border-border/30 bg-card/50 text-muted-foreground hover:text-foreground hover:border-border/60"
            )}
          >
            {t("supply.allBrands")}
          </button>
          {brands.map((brand) => {
            const logo = BRAND_LOGOS[brand];
            return (
              <button
                key={brand}
                onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
                  selectedBrand === brand
                    ? "border-gx-red/40 bg-gx-red/10 ring-1 ring-gx-red/20"
                    : "border-border/30 bg-card/50 hover:border-border/60"
                )}
              >
                {logo ? (
                  <Image
                    src={logo}
                    alt={brand}
                    width={28}
                    height={28}
                    className="rounded object-contain"
                  />
                ) : null}
                <span className={cn(
                  "text-xs font-medium",
                  selectedBrand === brand ? "text-red-400" : "text-muted-foreground"
                )}>
                  {brand}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── Search + Category Filter ─── */}
        <div className="animate-page-content flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("supply.catalogSearchPlaceholder")}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gx-red/50 focus:ring-1 focus:ring-gx-red/20"
            />
          </div>
          <select
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="px-3 py-2.5 rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm text-sm text-foreground focus:outline-none focus:border-gx-red/50 focus:ring-1 focus:ring-gx-red/20 appearance-none"
          >
            <option value="">{t("supply.allCategories")}</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>

        {/* ─── Count + Clear ─── */}
        <div className="animate-page-content flex items-center justify-between mb-6">
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "supply" : "supplies"}
          </p>
          {(selectedBrand || selectedCategory || search.trim()) && (
            <button
              onClick={() => { setSelectedBrand(null); setSelectedCategory(null); setSearch(""); }}
              className="text-xs text-gx-red hover:underline"
            >
              {t("supply.clearFilters")}
            </button>
          )}
        </div>

        {/* ─── Product Grid by Brand ─── */}
        <div className="animate-page-grid space-y-12">
          {[...grouped.entries()].map(([brand, items]) => {
            const logo = BRAND_LOGOS[brand];
            return (
              <section key={brand}>
                {/* Brand header */}
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/30">
                  {logo && (
                    <div className="h-10 w-10 rounded-lg bg-card border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
                      <Image src={logo} alt={brand} width={32} height={32} className="object-contain" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{brand}</h2>
                    <p className="text-[10px] text-muted-foreground">{items.length} products</p>
                  </div>
                </div>

                {/* Product cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((supply) => (
                    <SupplyCard
                      key={supply.id}
                      supply={supply}
                      brandLogo={logo}
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
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <FlaskConical className="h-16 w-16 mb-6 opacity-20" />
              <p className="text-sm">{t("supply.noResults")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Supply Card ─────────────────────────────────────────────────

function SupplyCard({
  supply,
  brandLogo,
  isExpanded,
  onToggle,
  regionPriority,
}: {
  supply: Supply;
  brandLogo?: string;
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
        "rounded-xl border backdrop-blur-sm transition-all overflow-hidden",
        isExpanded
          ? "border-gx-red/30 bg-card/90 shadow-lg shadow-gx-red/5"
          : "border-border/30 bg-card/60 hover:bg-card/80 hover:border-border/50"
      )}
    >
      {/* Card body */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-3 flex items-start gap-3 touch-manipulation"
      >
        {/* Thumbnail area */}
        <div className="w-10 h-10 rounded-lg bg-black/30 border border-border/30 flex items-center justify-center shrink-0 overflow-hidden">
          {supply.colorHex ? (
            <span
              className="w-full h-full block"
              style={{ backgroundColor: supply.colorHex }}
            />
          ) : supply.category === "TOOL" || supply.category === "ABRASIVE" ? (
            brandLogo ? (
              <Image src={brandLogo} alt={supply.brand} width={32} height={32} className="object-contain p-0.5" />
            ) : (
              <Icon className="h-5 w-5 text-muted-foreground" />
            )
          ) : (
            <Icon className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-medium text-foreground truncate">{supply.name}</span>
            {supply.code && (
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">{supply.code}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-border/20 text-muted-foreground">
              {CATEGORY_LABELS[supply.category] || supply.category}
            </span>
            {supply.productLine && (
              <span className="text-[9px] text-muted-foreground/60 truncate">{supply.productLine}</span>
            )}
            {supply.solventType && (
              <span className="text-[9px] text-muted-foreground/50">{supply.solventType}</span>
            )}
            {supply.finish && (
              <span className="text-[9px] text-muted-foreground/50">{supply.finish}</span>
            )}
          </div>
          {supply.buildCount > 0 && (
            <p className="text-[9px] text-muted-foreground/40 mt-1">
              {supply.buildCount === 1
                ? t("supply.usedInBuild")
                : t("supply.usedInBuilds").replace("{count}", String(supply.buildCount))}
            </p>
          )}
        </div>

        {/* Expand indicator */}
        <ChevronRight className={cn(
          "h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-1 transition-transform",
          isExpanded && "rotate-90 text-gx-red/60"
        )} />
      </button>

      {/* Expanded store links */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0">
          <div className="border-t border-border/20 pt-2.5">
            <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider mb-2">
              {t("supply.whereToBuy")}
            </p>
            <div className="grid grid-cols-1 gap-1">
              {storeLinks.map((link) => (
                <a
                  key={link.slug}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.06] border border-border/20 hover:border-border/40 transition-colors group touch-manipulation"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[9px] font-mono text-muted-foreground/50 w-5 shrink-0">
                      {REGION_FLAGS[link.region]}
                    </span>
                    <span className="text-xs text-foreground/80 group-hover:text-foreground truncate">{link.name}</span>
                  </div>
                  <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/30 group-hover:text-gx-red transition-colors shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
