"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import {
  Search, Layers, ArrowLeft, ExternalLink, Star, Calendar, Tag,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────

interface CardProduct {
  id: string;
  code: string;
  name: string;
  type: string;
  description: string | null;
  seriesTheme: string | null;
  releaseDate: string | null;
  price: number | null;
  currency: string;
  imageUrl: string | null;
  officialUrl: string | null;
  isFeatured: boolean;
}

// ─── Constants ───────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  STARTER_DECK: "Starter Deck",
  BOOSTER_PACK: "Booster Pack",
  PREMIUM_COLLECTION: "Premium",
  ACCESSORIES: "Accessories",
  LIMITED: "Limited",
};

const TYPE_COLORS: Record<string, string> = {
  STARTER_DECK: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  BOOSTER_PACK: "bg-green-500/15 text-green-400 border-green-500/30",
  PREMIUM_COLLECTION: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  ACCESSORIES: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  LIMITED: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

const ALL_TYPES = Object.keys(TYPE_LABELS);

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);
}

// ─── Main Component ──────────────────────────────────────────────

export function CardsCatalog({ products }: { products: CardProduct[] }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const featured = useMemo(() => products.filter((p) => p.isFeatured), [products]);

  const filtered = useMemo(() => {
    let result = products;
    if (selectedType) result = result.filter((p) => p.type === selectedType);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.seriesTheme && p.seriesTheme.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return result;
  }, [products, selectedType, search]);

  return (
    <div>
        {/* Featured */}
        {featured.length > 0 && !search.trim() && !selectedType && (
          <div className="animate-page-content mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Star className="h-3.5 w-3.5 text-amber-400" />
              Featured Releases
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} featured />
              ))}
            </div>
          </div>
        )}

        {/* Type filter pills */}
        <div className="animate-page-content flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedType(null)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-medium transition-all border",
              !selectedType
                ? "border-gx-red/50 bg-gx-red/15 text-gx-red"
                : "border-border/30 bg-black/30 text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          {ALL_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(selectedType === type ? null : type)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-medium transition-all border",
                selectedType === type
                  ? "border-gx-red/50 bg-gx-red/15 text-gx-red"
                  : "border-border/30 bg-black/30 text-muted-foreground hover:text-foreground"
              )}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="animate-page-content mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code, or series..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/40 bg-black/30 backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gx-red/50 focus:ring-1 focus:ring-gx-red/20"
            />
          </div>
        </div>

        {/* Count */}
        <p className="animate-page-content text-xs text-muted-foreground/50 mb-6">
          {filtered.length} {filtered.length === 1 ? "product" : "products"}
          {(selectedType || search.trim()) && (
            <button
              onClick={() => { setSelectedType(null); setSearch(""); }}
              className="ml-2 text-gx-red hover:underline"
            >
              Clear
            </button>
          )}
        </p>

        {/* Product Grid */}
        <div className="animate-page-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">No products match your search.</p>
          </div>
        )}

    </div>
  );
}

// ─── Product Card ────────────────────────────────────────────────

function ProductCard({ product, featured = false }: { product: CardProduct; featured?: boolean }) {
  const typeColor = TYPE_COLORS[product.type] || TYPE_COLORS.ACCESSORIES;

  return (
    <div
      className={cn(
        "group rounded-xl border overflow-hidden transition-all",
        featured
          ? "border-amber-500/20 bg-amber-500/[0.03] hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5"
          : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12]"
      )}
    >
      {/* Image area / placeholder */}
      <div className="relative aspect-[16/10] bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-2xl font-bold font-mono text-white/10">{product.code}</span>
            </div>
          </div>
        )}
        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md border backdrop-blur-sm", typeColor)}>
            {TYPE_LABELS[product.type]}
          </span>
        </div>
        {featured && (
          <div className="absolute top-2 right-2">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xs font-mono text-gx-red/70">{product.code}</span>
        </div>
        <h3 className="text-sm font-semibold text-foreground leading-tight group-hover:text-white transition-colors">
          {product.name}
        </h3>
        {product.seriesTheme && (
          <p className="text-[11px] text-muted-foreground/60 mt-1 truncate">{product.seriesTheme}</p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-2.5 text-[10px] text-muted-foreground/40">
          {product.price && (
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {formatPrice(product.price, product.currency)}
            </span>
          )}
          {product.releaseDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(product.releaseDate)}
            </span>
          )}
        </div>

        {/* Official link */}
        {product.officialUrl && (
          <a
            href={product.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-[10px] text-muted-foreground/50 hover:text-gx-red transition-colors"
          >
            View on official site
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}
