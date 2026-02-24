"use client";

import { useState, useMemo } from "react";
import { Search, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { KitCard } from "./kit-card";
import type { GunplaKitUI, KitStatus } from "@/lib/types";

interface KitCatalogProps {
  kits: GunplaKitUI[];
  grades: string[];
  seriesList: string[];
  userStatuses: Record<string, KitStatus>;
}

const ITEMS_PER_PAGE = 24;

type SortOption = "name" | "rating" | "owners" | "newest";

export function KitCatalog({ kits, grades, seriesList, userStatuses }: KitCatalogProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [seriesFilter, setSeriesFilter] = useState("");
  const [sort, setSort] = useState<SortOption>("name");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = [...kits];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (kit) =>
          kit.name.toLowerCase().includes(q) ||
          kit.seriesName.toLowerCase().includes(q)
      );
    }

    // Grade filter
    if (gradeFilter) {
      result = result.filter((kit) => kit.grade === gradeFilter);
    }

    // Series filter
    if (seriesFilter) {
      result = result.filter((kit) => kit.seriesName === seriesFilter);
    }

    // Sort
    switch (sort) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "rating":
        result.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
        break;
      case "owners":
        result.sort((a, b) => b.totalOwners - a.totalOwners);
        break;
      case "newest":
        // Keep original order (already sorted by createdAt desc from server)
        break;
    }

    return result;
  }, [kits, search, gradeFilter, seriesFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedKits = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  const handleFilterChange = (setter: (val: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-gx-red" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
              収集伝承 &middot; Kit Database
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight font-rajdhani">
            {t("collector.title")}
          </h1>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            {t("collector.subtitle")}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t("collector.searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border/50 bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gx-red/50"
            />
          </div>

          {/* Grade filter */}
          <select
            value={gradeFilter}
            onChange={(e) => handleFilterChange(setGradeFilter, e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-border/50 bg-muted/30 text-sm text-foreground focus:outline-none focus:border-gx-red/50 min-w-[140px]"
          >
            <option value="">{t("collector.allGrades")}</option>
            {grades.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>

          {/* Series filter */}
          <select
            value={seriesFilter}
            onChange={(e) => handleFilterChange(setSeriesFilter, e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-border/50 bg-muted/30 text-sm text-foreground focus:outline-none focus:border-gx-red/50 min-w-[180px]"
          >
            <option value="">{t("collector.allSeries")}</option>
            {seriesList.map((series) => (
              <option key={series} value={series}>
                {series}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as SortOption); setPage(1); }}
            className="px-4 py-2.5 rounded-lg border border-border/50 bg-muted/30 text-sm text-foreground focus:outline-none focus:border-gx-red/50 min-w-[160px]"
          >
            <option value="name">{t("collector.sortName")}</option>
            <option value="rating">{t("collector.sortRating")}</option>
            <option value="owners">{t("collector.sortOwners")}</option>
            <option value="newest">{t("collector.sortNewest")}</option>
          </select>
        </div>

        {/* Grid */}
        {paginatedKits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <BookOpen className="h-16 w-16 mb-6 opacity-20" />
            <p className="text-sm">{t("collector.emptyCollection")}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {paginatedKits.map((kit) => (
                <KitCard
                  key={kit.id}
                  kit={kit}
                  userStatus={userStatuses[kit.id] ?? null}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className={cn(
                    "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    currentPage <= 1
                      ? "text-muted-foreground/40 cursor-not-allowed"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("collector.pagination.prev")}
                </button>

                <span className="text-sm text-muted-foreground">
                  {t("collector.pagination.page")} {currentPage} {t("collector.pagination.of")} {totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className={cn(
                    "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    currentPage >= totalPages
                      ? "text-muted-foreground/40 cursor-not-allowed"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {t("collector.pagination.next")}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
