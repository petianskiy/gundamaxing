"use client";

import { useState, useMemo } from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import {
  Search, Package, Paintbrush, Droplets, Layers, Wrench, Scissors,
  ExternalLink, FlaskConical,
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

const REGION_FLAGS: Record<StoreRegion, string> = {
  JP: "JP", CN: "CN", SEA: "SEA", EU: "EU", NA: "US", GLOBAL: "",
};

const BRAND_LOGOS: Record<string, string> = {
  "Mr. Hobby": "/brands/mr-hobby.jpg",
  "Tamiya": "/brands/tamiya.jpg",
  "Gaia Notes": "/brands/gaia-notes.jpg",
  "GodHand": "/brands/godhand.jpg",
  "DSPIAE": "/brands/dspiae.jpg",
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS);

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

        {/* ─── Brand Logos Row ─── */}
        <div className="animate-page-content flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8">
          <button
            onClick={() => setSelectedBrand(null)}
            className={cn(
              "h-12 px-5 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all",
              !selectedBrand
                ? "border-gx-red/50 bg-gx-red/15 text-gx-red"
                : "border-border/30 bg-black/30 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:border-border/60"
            )}
          >
            All
          </button>
          {brands.map((brand) => {
            const logo = BRAND_LOGOS[brand];
            const active = selectedBrand === brand;
            return (
              <button
                key={brand}
                onClick={() => setSelectedBrand(active ? null : brand)}
                className={cn(
                  "h-12 px-3 rounded-xl border transition-all flex items-center gap-2",
                  active
                    ? "border-gx-red/50 bg-gx-red/15 ring-1 ring-gx-red/20"
                    : "border-border/30 bg-black/30 backdrop-blur-sm hover:border-border/60 hover:bg-black/50"
                )}
              >
                {logo && (
                  <Image src={logo} alt={brand} width={36} height={36} className="rounded-md object-contain" />
                )}
                <span className={cn(
                  "text-xs font-medium hidden sm:inline",
                  active ? "text-gx-red" : "text-muted-foreground"
                )}>
                  {brand}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── Search + Category ─── */}
        <div className="animate-page-content flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("supply.catalogSearchPlaceholder")}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/40 bg-black/30 backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gx-red/50 focus:ring-1 focus:ring-gx-red/20"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="px-3 py-2.5 rounded-xl border border-border/40 bg-black/30 backdrop-blur-sm text-sm text-foreground focus:outline-none focus:border-gx-red/50 appearance-none"
            >
              <option value="">{t("supply.allCategories")}</option>
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ─── Count ─── */}
        <div className="animate-page-content flex items-center justify-between mb-8">
          <p className="text-xs text-muted-foreground/60">
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
        <div className="animate-page-grid space-y-14">
          {[...grouped.entries()].map(([brand, items]) => {
            const logo = BRAND_LOGOS[brand];
            return (
              <section key={brand}>
                {/* Brand header — large logo */}
                <div className="flex items-center gap-4 mb-5">
                  {logo && (
                    <div className="h-14 w-14 rounded-xl bg-black/40 border border-border/30 flex items-center justify-center overflow-hidden shrink-0 backdrop-blur-sm">
                      <Image src={logo} alt={brand} width={48} height={48} className="object-contain" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight">{brand}</h2>
                    <p className="text-[11px] text-muted-foreground/60">{items.length} products in catalog</p>
                  </div>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
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
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <FlaskConical className="h-12 w-12 mb-4 opacity-20" />
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
        "group rounded-xl border backdrop-blur-sm transition-all overflow-hidden",
        isExpanded
          ? "border-gx-red/30 bg-black/60 shadow-lg shadow-gx-red/5 col-span-1 sm:col-span-1"
          : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12]"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-3 flex gap-3 touch-manipulation"
      >
        {/* Thumbnail — 48x48, holds color, brand logo, or icon */}
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden",
          supply.colorHex ? "" : "bg-white/[0.04] border border-white/[0.08]"
        )}>
          {supply.colorHex ? (
            <span
              className="w-full h-full block rounded-lg border border-white/[0.1]"
              style={{ backgroundColor: supply.colorHex }}
            />
          ) : brandLogo ? (
            <Image src={brandLogo} alt={supply.brand} width={36} height={36} className="object-contain opacity-60 group-hover:opacity-80 transition-opacity" />
          ) : (
            <Icon className="h-5 w-5 text-muted-foreground/50" />
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
            <span className="text-[10px] text-muted-foreground/50">
              {CATEGORY_LABELS[supply.category]}
            </span>
          </div>
          {(supply.finish || supply.solventType) && (
            <p className="text-[10px] text-muted-foreground/30 mt-0.5 truncate">
              {[supply.solventType, supply.finish].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </button>

      {/* Expanded — store links */}
      {isExpanded && storeLinks.length > 0 && (
        <div className="px-3 pb-3">
          <div className="border-t border-white/[0.06] pt-2.5">
            <p className="text-[9px] text-muted-foreground/50 font-semibold uppercase tracking-widest mb-2">
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
                    {REGION_FLAGS[link.region]}
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
