"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  Grid3X3,
  LayoutList,
  Film,
  Flame,
  Heart,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { filterConfig } from "@/lib/config/filters";
import { BuildCard } from "@/components/build/build-card";
import { GradeBadge } from "@/components/ui/grade-badge";
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "cinematic">("grid");
  const [timeRange, setTimeRange] = useState<"all" | "week" | "month" | "year">("all");

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
    let filtered = builds.filter((build) => {
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

    // Time-based filtering
    if (timeRange !== "all") {
      const now = new Date();
      let cutoff: Date;
      switch (timeRange) {
        case "week": cutoff = new Date(now.getTime() - 7 * 86400000); break;
        case "month": cutoff = new Date(now.getTime() - 30 * 86400000); break;
        case "year": cutoff = new Date(now.getTime() - 365 * 86400000); break;
      }
      filtered = filtered.filter(b => new Date(b.createdAt) >= cutoff);
    }
    // Sort by likes when trending
    if (timeRange !== "all") {
      filtered.sort((a, b) => b.likes - a.likes);
    }

    return filtered;
  }, [filters, builds, timeRange]);

  function toggleFilter<K extends keyof Omit<Filters, "search">>(key: K, value: Filters[K][number]) {
    setFilters((prev) => {
      const arr = prev[key] as Filters[K][number][];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [key]: next };
    });
  }

  const timeRangeOptions: { value: "all" | "week" | "month" | "year"; label: string }[] = [
    { value: "all", label: "All Time" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
  ];

  const viewOptions: { value: "grid" | "list" | "cinematic"; icon: typeof Grid3X3; label: string }[] = [
    { value: "grid", icon: Grid3X3, label: "Grid" },
    { value: "list", icon: LayoutList, label: "List" },
    { value: "cinematic", icon: Film, label: "Cinematic" },
  ];

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Grid3X3 className="h-5 w-5 text-gx-red" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
              展示 · Build Showcase
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            {t("builds.title")}
          </h1>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            {t("builds.subtitle")}
          </p>
        </div>

        {/* Trending time range filter */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Flame className="h-4 w-4 text-gx-red shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">Trending</span>
          {timeRangeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTimeRange(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                timeRange === opt.value
                  ? "bg-gx-red/10 text-red-400 border border-gx-red/40"
                  : "bg-card text-muted-foreground border border-border/50 hover:border-border hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search + Filter toggle */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
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

        {/* View Switcher */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-card border border-border/50">
            {viewOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setViewMode(opt.value)}
                  title={opt.label}
                  className={cn(
                    "inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors",
                    viewMode === opt.value
                      ? "bg-gx-red/10 text-red-400 border border-gx-red/40"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground">
            {t("builds.showing")} <span className="text-foreground font-medium">{filteredBuilds.length}</span> {t("shared.builds")}
          </p>
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

        {/* Build listings */}
        {filteredBuilds.length > 0 ? (
          <>
            {/* Grid View */}
            {viewMode === "grid" && (
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
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="space-y-3">
                {filteredBuilds.map((build, i) => {
                  const primaryImage = build.images.find(img => img.isPrimary) || build.images[0];
                  return (
                    <motion.div
                      key={build.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.05 }}
                    >
                      <div className="flex gap-4 p-3 rounded-xl border border-border/50 bg-card hover:border-border transition-colors">
                        <Link href={`/builds/${build.slug}`} className="shrink-0">
                          <div className="relative w-32 h-24 sm:w-40 sm:h-28 rounded-lg overflow-hidden">
                            <Image src={primaryImage.url} alt={primaryImage.alt} fill className="object-cover" unoptimized />
                            <div className="absolute top-1.5 left-1.5"><GradeBadge grade={build.grade} /></div>
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0 py-1">
                          <Link href={`/builds/${build.slug}`}>
                            <h3 className="font-semibold text-sm text-foreground line-clamp-1 hover:text-gx-red transition-colors">{build.title}</h3>
                          </Link>
                          <p className="text-xs text-muted-foreground mt-0.5">{build.kitName} · {build.scale}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {build.techniques.slice(0, 4).map(t => <span key={t} className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-400">{t}</span>)}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{build.likes}</span>
                            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{build.comments}</span>
                            <Link href={`/u/${build.userHandle}`} className="flex items-center gap-1 ml-auto hover:text-foreground">
                              <div className="w-4 h-4 rounded-full overflow-hidden relative"><Image src={build.userAvatar} alt="" fill className="object-cover" unoptimized /></div>
                              {build.username}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Cinematic View */}
            {viewMode === "cinematic" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filteredBuilds.map((build, i) => {
                  const primaryImage = build.images.find(img => img.isPrimary) || build.images[0];
                  return (
                    <motion.div key={build.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.05 }}>
                      <Link href={`/builds/${build.slug}`} className="group block rounded-xl border border-border/50 bg-card overflow-hidden hover:border-border transition-colors">
                        <div className="relative aspect-[16/9] overflow-hidden">
                          <Image src={primaryImage.url} alt={primaryImage.alt} fill className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-0 inset-x-0 p-5">
                            <div className="flex items-center gap-2 mb-2">
                              <GradeBadge grade={build.grade} />
                              <span className="text-[10px] font-mono text-zinc-300 bg-black/40 px-1.5 py-0.5 rounded">{build.scale}</span>
                              {build.status === "WIP" && <span className="text-[10px] font-bold uppercase bg-amber-500/90 text-black px-2 py-0.5 rounded">WIP</span>}
                            </div>
                            <h3 className="text-lg font-bold text-white line-clamp-2">{build.title}</h3>
                            <p className="text-sm text-zinc-300 mt-1">{build.kitName}</p>
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full overflow-hidden relative"><Image src={build.userAvatar} alt="" fill className="object-cover" unoptimized /></div>
                                <span className="text-xs text-zinc-400">{build.username}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-zinc-400">
                                <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{build.likes}</span>
                                <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{build.comments}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
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
