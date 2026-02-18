"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { filterConfig } from "@/lib/config/filters";
import { BuildCard } from "@/components/build/build-card";
import type { Build, Grade, Timeline, Scale, Technique, VerificationTier, BuildStatus } from "@/lib/types";

type Filters = {
  grades: Grade[];
  timelines: Timeline[];
  scales: Scale[];
  techniques: Technique[];
  verificationTiers: VerificationTier[];
  statuses: BuildStatus[];
  search: string;
};

const emptyFilters: Filters = {
  grades: [],
  timelines: [],
  scales: [],
  techniques: [],
  verificationTiers: [],
  statuses: [],
  search: "",
};

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap",
        active
          ? "bg-gx-red/10 text-red-400 border-gx-red/40"
          : "bg-card text-muted-foreground border-border/50 hover:border-border hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

export function BuildsFeed({ builds }: { builds: Build[] }) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.grades.length > 0 ||
      filters.timelines.length > 0 ||
      filters.scales.length > 0 ||
      filters.techniques.length > 0 ||
      filters.verificationTiers.length > 0 ||
      filters.statuses.length > 0 ||
      filters.search.length > 0
    );
  }, [filters]);

  const filteredBuilds = useMemo(() => {
    return builds.filter((build) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !build.title.toLowerCase().includes(q) &&
          !build.kitName.toLowerCase().includes(q) &&
          !build.username.toLowerCase().includes(q)
        )
          return false;
      }
      if (filters.grades.length > 0 && !filters.grades.includes(build.grade)) return false;
      if (filters.timelines.length > 0 && !filters.timelines.includes(build.timeline)) return false;
      if (filters.scales.length > 0 && !filters.scales.includes(build.scale)) return false;
      if (filters.techniques.length > 0 && !filters.techniques.some((tech) => build.techniques.includes(tech))) return false;
      if (filters.verificationTiers.length > 0 && !filters.verificationTiers.includes(build.verification)) return false;
      if (filters.statuses.length > 0 && !filters.statuses.includes(build.status)) return false;
      return true;
    });
  }, [filters, builds]);

  function toggleFilter<K extends keyof Omit<Filters, "search">>(key: K, value: Filters[K][number]) {
    setFilters((prev) => {
      const arr = prev[key] as Filters[K][number][];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [key]: next };
    });
  }

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("builds.title")}</h1>
          <p className="mt-1 text-muted-foreground">
            {t("builds.subtitle")}
          </p>
        </div>

        {/* Search + Filter toggle */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("builds.searchPlaceholder")}
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border/50 bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gx-red/50 focus:ring-1 focus:ring-gx-red/20 transition-colors"
            />
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors",
              filtersOpen
                ? "border-gx-red/40 text-red-400 bg-gx-red/5"
                : "border-border/50 text-muted-foreground bg-card hover:text-foreground"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t("builds.filters")}
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gx-red text-white">
                {filters.grades.length +
                  filters.timelines.length +
                  filters.scales.length +
                  filters.techniques.length +
                  filters.verificationTiers.length +
                  filters.statuses.length}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
                {/* Grade */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                    {t("builds.filterGrade")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {filterConfig.grades.map((g) => (
                      <FilterChip key={g} label={g} active={filters.grades.includes(g)} onClick={() => toggleFilter("grades", g)} />
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                    {t("builds.filterTimeline")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {filterConfig.timelines.map((tl) => (
                      <FilterChip key={tl} label={tl} active={filters.timelines.includes(tl)} onClick={() => toggleFilter("timelines", tl)} />
                    ))}
                  </div>
                </div>

                {/* Scale */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                    {t("builds.filterScale")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {filterConfig.scales.map((s) => (
                      <FilterChip key={s} label={s} active={filters.scales.includes(s)} onClick={() => toggleFilter("scales", s)} />
                    ))}
                  </div>
                </div>

                {/* Techniques */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                    {t("builds.filterTechniques")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {filterConfig.techniques.map((tech) => (
                      <FilterChip key={tech} label={tech} active={filters.techniques.includes(tech)} onClick={() => toggleFilter("techniques", tech)} />
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                    {t("builds.filterStatus")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {filterConfig.statuses.map((s) => (
                      <FilterChip key={s} label={s} active={filters.statuses.includes(s)} onClick={() => toggleFilter("statuses", s)} />
                    ))}
                  </div>
                </div>

                {/* Clear */}
                {hasActiveFilters && (
                  <button
                    onClick={() => setFilters(emptyFilters)}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />
                    {t("builds.clearAll")}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        <div className="mb-5">
          <p className="text-sm text-muted-foreground">
            {t("builds.showing")} <span className="text-foreground font-medium">{filteredBuilds.length}</span> {t("shared.builds")}
          </p>
        </div>

        {/* Grid */}
        {filteredBuilds.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredBuilds.map((build, i) => (
              <motion.div
                key={build.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
              >
                <BuildCard build={build} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">{t("builds.noResults")}</p>
            <button
              onClick={() => setFilters(emptyFilters)}
              className="mt-3 text-sm text-gx-red hover:text-red-400 transition-colors"
            >
              {t("builds.clearFilters")}
            </button>
          </div>
        )}

        {/* Load more */}
        {filteredBuilds.length > 0 && (
          <div className="mt-10 text-center">
            <button className="px-6 py-2.5 rounded-lg border border-border/50 bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors">
              {t("builds.loadMore")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
