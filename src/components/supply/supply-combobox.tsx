"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import {
  X, Search, Package, Paintbrush, Droplets, Layers, Wrench, Scissors,
  CheckCircle2, CircleDot, HelpCircle, Plus,
} from "lucide-react";
import { searchSupplyCatalog } from "@/lib/actions/supply";

export interface SelectedSupply {
  id: string;
  brand: string;
  name: string;
  code: string | null;
  category: string;
}

interface SupplyComboboxProps {
  selected: SelectedSupply[];
  freeText: string;
  onSelectedChange: (supplies: SelectedSupply[]) => void;
  onFreeTextChange: (text: string) => void;
  className?: string;
}

type MatchConfidence = "exact" | "strong" | "possible";

interface SearchResult {
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
  confidence: MatchConfidence;
  buildCount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────

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

function getConfidenceConfig(confidence: MatchConfidence, t: (key: string) => string) {
  return {
    exact: {
      icon: CheckCircle2,
      label: t("supply.exactMatch"),
      dotClass: "bg-green-400",
    },
    strong: {
      icon: CircleDot,
      label: t("supply.strongMatch"),
      dotClass: "bg-blue-400",
    },
    possible: {
      icon: HelpCircle,
      label: t("supply.possibleMatch"),
      dotClass: "bg-amber-400",
    },
  }[confidence];
}

function getCategoryIcon(category: string) {
  return CATEGORY_ICONS[category] || Package;
}

function formatSupplyLabel(s: { brand: string; name: string; code: string | null }): string {
  const codePart = s.code ? ` (${s.code})` : "";
  return `${s.brand} ${s.name}${codePart}`;
}

// ─── Component ───────────────────────────────────────────────────

export function SupplyCombobox({
  selected,
  freeText,
  onSelectedChange,
  onFreeTextChange,
  className,
}: SupplyComboboxProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [searchedEmpty, setSearchedEmpty] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const hasCustomOption = query.trim().length >= 2;
  const totalOptions = results.length + (hasCustomOption ? 1 : 0);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      setSearchedEmpty(false);
      return;
    }
    setIsSearching(true);
    try {
      const data = await searchSupplyCatalog(q);
      const filtered = (data as SearchResult[]).filter(
        (r) => !selected.some((s) => s.id === r.id)
      );
      setResults(filtered);
      setSearchedEmpty(filtered.length === 0);
      setIsOpen(true);
      setHighlightIndex(-1);
    } catch {
      setResults([]);
      setSearchedEmpty(true);
    } finally {
      setIsSearching(false);
    }
  }, [selected]);

  function handleInputChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 250);
  }

  function selectResult(result: SearchResult) {
    onSelectedChange([
      ...selected,
      { id: result.id, brand: result.brand, name: result.name, code: result.code, category: result.category },
    ]);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSearchedEmpty(false);
    inputRef.current?.focus();
  }

  function removeSelected(id: string) {
    onSelectedChange(selected.filter((s) => s.id !== id));
  }

  function addAsFreeText() {
    const trimmed = query.trim();
    if (!trimmed) return;
    const existing = freeText.split(",").map((s) => s.trim()).filter(Boolean);
    if (!existing.includes(trimmed)) existing.push(trimmed);
    onFreeTextChange(existing.join(", "));
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSearchedEmpty(false);
  }

  function removeFreeTextItem(item: string) {
    const items = freeText.split(",").map((s) => s.trim()).filter((s) => s && s !== item);
    onFreeTextChange(items.join(", "));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen && e.key !== "Escape") return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, totalOptions - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < results.length) {
        selectResult(results[highlightIndex]);
      } else {
        addAsFreeText();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const freeTextItems = freeText.split(",").map((s) => s.trim()).filter(Boolean);
  const topMatch = results.length > 0 ? results[0] : null;
  const isRecognized = topMatch && (topMatch.confidence === "exact" || topMatch.confidence === "strong");

  return (
    <div className={cn("relative", className)}>
      {/* Selected chips */}
      {(selected.length > 0 || freeTextItems.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((s) => {
            const Icon = getCategoryIcon(s.category);
            return (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gx-red/10 border border-gx-red/20 text-xs text-foreground"
              >
                <Icon className="h-3 w-3 text-gx-red/70 shrink-0" />
                <span className="max-w-[180px] sm:max-w-[220px] truncate">{formatSupplyLabel(s)}</span>
                <button
                  type="button"
                  onClick={() => removeSelected(s.id)}
                  className="ml-0.5 p-0.5 text-muted-foreground hover:text-foreground touch-manipulation"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          {freeTextItems.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted border border-border/50 text-xs text-muted-foreground"
            >
              <span className="max-w-[180px] sm:max-w-[220px] truncate">{item}</span>
              <button
                type="button"
                onClick={() => removeFreeTextItem(item)}
                className="ml-0.5 p-0.5 text-muted-foreground hover:text-foreground touch-manipulation"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => (results.length > 0 || searchedEmpty) && query.trim().length >= 2 && setIsOpen(true)}
          placeholder={t("supply.searchPlaceholder")}
          autoComplete="off"
          className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-border/50 bg-gx-surface text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-gx-red/50 focus:ring-1 focus:ring-gx-red/20 transition-colors"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-3.5 w-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full max-h-72 sm:max-h-80 overflow-y-auto rounded-lg border border-border bg-card shadow-lg overscroll-contain"
        >
          {/* Recognition banner for top match */}
          {isRecognized && topMatch && (
            <div className="px-3 py-2.5 border-b border-border/50 bg-muted/30">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />
                {t("supply.recognizedAs")}
              </div>
              <button
                type="button"
                onClick={() => selectResult(topMatch)}
                className={cn(
                  "w-full text-left mt-1.5 flex items-center gap-2 group py-0.5 touch-manipulation"
                )}
              >
                {topMatch.colorHex ? (
                  <span
                    className="h-5 w-5 rounded-full border border-border/50 shrink-0"
                    style={{ backgroundColor: topMatch.colorHex }}
                  />
                ) : (
                  (() => { const Icon = getCategoryIcon(topMatch.category); return <Icon className="h-4 w-4 text-muted-foreground shrink-0" />; })()
                )}
                <div className="min-w-0">
                  <span className="text-sm font-medium text-foreground group-hover:text-gx-red transition-colors">
                    {topMatch.brand} {topMatch.name}
                  </span>
                  {topMatch.code && (
                    <span className="text-sm text-muted-foreground ml-1">({topMatch.code})</span>
                  )}
                </div>
              </button>
            </div>
          )}

          {/* Result list */}
          {results.map((result, i) => {
            if (i === 0 && isRecognized) return null;

            const Icon = getCategoryIcon(result.category);
            const conf = getConfidenceConfig(result.confidence, t);

            return (
              <button
                key={result.id}
                type="button"
                onClick={() => selectResult(result)}
                className={cn(
                  "w-full text-left px-3 py-2.5 sm:py-2 flex items-start gap-2.5 transition-colors border-b border-border/20 last:border-0 touch-manipulation",
                  i === highlightIndex ? "bg-gx-red/10" : "hover:bg-muted/50"
                )}
              >
                {/* Color swatch or category icon */}
                <div className="mt-0.5 shrink-0">
                  {result.colorHex ? (
                    <span
                      className="block h-5 w-5 rounded-full border border-border/50"
                      style={{ backgroundColor: result.colorHex }}
                    />
                  ) : (
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* Product info — brand-first hierarchy */}
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
                    {result.brand}
                    {result.productLine && (
                      <span className="text-muted-foreground/60"> / {result.productLine}</span>
                    )}
                  </div>
                  <div className="text-sm text-foreground">
                    <span className="font-medium">{result.name}</span>
                    {result.code && (
                      <span className="text-muted-foreground ml-1.5 font-mono text-xs">
                        {result.code}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {CATEGORY_LABELS[result.category] || result.category}
                    </span>
                    {result.solventType && (
                      <span className="text-[10px] text-muted-foreground/70">{result.solventType}</span>
                    )}
                    {result.finish && (
                      <span className="text-[10px] text-muted-foreground/70">{result.finish}</span>
                    )}
                    {result.buildCount > 0 && (
                      <span className="text-[10px] text-muted-foreground/50">
                        {result.buildCount === 1 ? t("supply.usedInBuild") : t("supply.usedInBuilds").replace("{count}", String(result.buildCount))}
                      </span>
                    )}
                  </div>
                </div>

                {/* Confidence indicator */}
                <div className="mt-1 shrink-0" title={conf.label}>
                  <span className={cn("block h-1.5 w-1.5 rounded-full", conf.dotClass)} />
                </div>
              </button>
            );
          })}

          {/* Custom fallback option */}
          {hasCustomOption && (
            <button
              type="button"
              onClick={addAsFreeText}
              className={cn(
                "w-full text-left px-3 py-3 sm:py-2.5 flex items-center gap-2.5 transition-colors border-t border-border/50 touch-manipulation",
                highlightIndex === results.length ? "bg-muted/70" : "hover:bg-muted/40"
              )}
            >
              <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-sm text-foreground">
                  {t("supply.useCustom")}:{" "}
                  <span className="font-medium">&ldquo;{query.trim()}&rdquo;</span>
                </span>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {t("supply.notInCatalog")}
                </p>
              </div>
            </button>
          )}

          {/* Empty state */}
          {searchedEmpty && !hasCustomOption && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              {t("supply.noResults")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
