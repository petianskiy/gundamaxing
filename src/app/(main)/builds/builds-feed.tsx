"use client";

import { useState, useMemo, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  Grid3X3,
  LayoutList,
  Flame,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
} from "lucide-react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { filterConfig } from "@/lib/config/filters";
import { GradeBadge } from "@/components/ui/grade-badge";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { TechniqueChip } from "@/components/ui/technique-chip";
import { toggleLike, toggleBookmark } from "@/lib/actions/like";
import { toast } from "sonner";
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

interface BuildsFeedProps {
  builds: Build[];
  currentUserId?: string;
  likedBuildIds?: string[];
  bookmarkedBuildIds?: string[];
}

export function BuildsFeed({ builds, currentUserId, likedBuildIds = [], bookmarkedBuildIds = [] }: BuildsFeedProps) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "wall">("grid");
  const [timeRange, setTimeRange] = useState<"all" | "week" | "month" | "year">("all");
  const [likedSet, setLikedSet] = useState<Set<string>>(() => new Set(likedBuildIds));
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<string>>(() => new Set(bookmarkedBuildIds));
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const b of builds) counts[b.id] = b.likes;
    return counts;
  });
  const [, startTransition] = useTransition();

  const handleLike = (buildId: string) => {
    if (!currentUserId) {
      toast.error(t("builds.toast.signInToLike"));
      return;
    }
    const wasLiked = likedSet.has(buildId);
    setLikedSet((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(buildId);
      else next.add(buildId);
      return next;
    });
    setLikeCounts((prev) => ({ ...prev, [buildId]: (prev[buildId] ?? 0) + (wasLiked ? -1 : 1) }));
    startTransition(async () => {
      const result = await toggleLike(buildId);
      if ("error" in result) {
        setLikedSet((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(buildId);
          else next.delete(buildId);
          return next;
        });
        setLikeCounts((prev) => ({ ...prev, [buildId]: (prev[buildId] ?? 0) + (wasLiked ? 1 : -1) }));
        toast.error(result.error);
      }
    });
  };

  const handleBookmark = (buildId: string) => {
    if (!currentUserId) {
      toast.error(t("builds.toast.signInToBookmark"));
      return;
    }
    const wasBookmarked = bookmarkedSet.has(buildId);
    setBookmarkedSet((prev) => {
      const next = new Set(prev);
      if (wasBookmarked) next.delete(buildId);
      else next.add(buildId);
      return next;
    });
    startTransition(async () => {
      const result = await toggleBookmark(buildId);
      if ("error" in result) {
        setBookmarkedSet((prev) => {
          const next = new Set(prev);
          if (wasBookmarked) next.add(buildId);
          else next.delete(buildId);
          return next;
        });
        toast.error(result.error);
      }
    });
  };

  const handleShare = async (build: Build) => {
    const url = `${window.location.origin}/builds/${build.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: build.title, url });
      } catch {
        await navigator.clipboard.writeText(url);
        toast.success(t("builds.toast.linkCopied"));
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(t("builds.toast.linkCopied"));
    }
  };

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

  const viewOptions: { value: "grid" | "wall"; icon: typeof Grid3X3; label: string }[] = [
    { value: "grid", icon: Grid3X3, label: "Grid" },
    { value: "wall", icon: LayoutList, label: "Wall" },
  ];

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="animate-page-header text-center mb-10">
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
        <div className="animate-page-content flex items-center gap-2 mb-4 flex-wrap">
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
        <div className="animate-page-grid flex flex-col sm:flex-row gap-3 mb-4">
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
        <div className="animate-page-grid flex items-center justify-between mb-5">
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
                {filteredBuilds.map((build) => (
                  <GridBuildCard
                    key={build.id}
                    build={build}
                    isLiked={likedSet.has(build.id)}
                    isBookmarked={bookmarkedSet.has(build.id)}
                    likeCount={likeCounts[build.id] ?? build.likes}
                    onLike={() => handleLike(build.id)}
                    onBookmark={() => handleBookmark(build.id)}
                  />
                ))}
              </div>
            )}

            {/* Instagram-style Wall View */}
            {viewMode === "wall" && (
              <WallView
                builds={filteredBuilds}
                likedSet={likedSet}
                bookmarkedSet={bookmarkedSet}
                likeCounts={likeCounts}
                onLike={handleLike}
                onBookmark={handleBookmark}
                onShare={handleShare}
                t={t}
              />
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

// ─── Grid Build Card (interactive) ────────────────────────────

interface GridBuildCardProps {
  build: Build;
  isLiked: boolean;
  isBookmarked: boolean;
  likeCount: number;
  onLike: () => void;
  onBookmark: () => void;
}

function GridBuildCard({ build, isLiked, isBookmarked, likeCount, onLike, onBookmark }: GridBuildCardProps) {
  const primaryImage = build.images.find((img) => img.isPrimary) || build.images[0];
  const shownTechniques = build.techniques.slice(0, 2);
  const remainingCount = build.techniques.length - 2;

  return (
    <Link href={`/builds/${build.slug}`} className="h-full">
      <motion.article
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "group relative rounded-xl border border-border/50 bg-card overflow-hidden h-full flex flex-col",
          "shadow-sm hover:shadow-lg hover:border-border transition-[border-color,box-shadow] duration-300"
        )}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted shrink-0">
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
            style={primaryImage.objectPosition ? { objectPosition: primaryImage.objectPosition } : undefined}
          />

          {/* Top-left: Grade + Scale */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 max-w-[calc(100%-20px)] flex-wrap">
            <GradeBadge grade={build.grade} />
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-black/60 text-zinc-300 backdrop-blur-sm">
              {build.scale}
            </span>
          </div>

          {/* Top-right: Verification */}
          {build.verification !== "unverified" && (
            <div className="absolute top-2.5 right-2.5 p-1 rounded-full bg-black/50 backdrop-blur-sm">
              <VerificationBadge tier={build.verification} size="md" />
            </div>
          )}

          {/* Bottom-left: WIP badge */}
          {build.status === "WIP" && (
            <div className="absolute bottom-2.5 left-2.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/90 text-black backdrop-blur-sm">
                WIP
              </span>
            </div>
          )}

          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 gap-3">
          {/* Title & kit name */}
          <div>
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-card-foreground group-hover:text-foreground transition-colors">
              {build.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {build.kitName}
            </p>
          </div>

          {/* Techniques — max 2 full tags + overflow count */}
          <div className="overflow-hidden max-w-full min-h-[22px]">
            <div className="flex gap-1 items-center flex-nowrap">
              {shownTechniques.map((tech) => (
                <TechniqueChip key={tech} technique={tech} size="sm" />
              ))}
              {remainingCount > 0 && (
                <span className="inline-flex items-center px-2 py-[2px] rounded text-[11px] leading-[1.4] font-medium bg-zinc-800 text-zinc-400 shrink-0 whitespace-nowrap">
                  +{remainingCount}
                </span>
              )}
            </div>
          </div>

          {/* Footer — pinned to bottom */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-auto">
            {/* User */}
            <Link
              href={`/u/${build.userHandle}`}
              className="flex items-center gap-1.5 min-w-0 hover:opacity-80 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-[18px] h-[18px] rounded-full overflow-hidden shrink-0">
                <Image
                  src={build.userAvatar}
                  alt={build.username}
                  fill
                  sizes="18px"
                  className="object-cover"
                />
              </div>
              <span className="text-xs text-muted-foreground truncate">
                {build.username}
              </span>
            </Link>

            {/* Interactive Stats */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLike(); }}
                className="group/action inline-flex items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center -m-2 p-2"
              >
                <Heart
                  className={cn(
                    "h-3.5 w-3.5 transition-colors",
                    isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground group-hover/action:text-red-400"
                  )}
                />
                <span className={cn(
                  "text-xs transition-colors",
                  isLiked ? "text-red-500 font-semibold" : "text-muted-foreground"
                )}>
                  {likeCount >= 1000 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}
                </span>
              </button>
              <Link
                href={`/builds/${build.slug}#comments`}
                onClick={(e) => e.stopPropagation()}
                className="group/action inline-flex items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center -m-2 p-2"
              >
                <MessageCircle className="h-3.5 w-3.5 text-muted-foreground group-hover/action:text-blue-400 transition-colors" />
                <span className="text-xs text-muted-foreground">{build.comments}</span>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBookmark(); }}
                className="group/action inline-flex items-center min-w-[44px] min-h-[44px] justify-center -m-2 p-2"
              >
                <Bookmark
                  className={cn(
                    "h-3.5 w-3.5 transition-colors",
                    isBookmarked ? "fill-foreground text-foreground" : "text-muted-foreground group-hover/action:text-yellow-400"
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

// ─── Wall View (Instagram-style) ──────────────────────────────

interface WallViewProps {
  builds: Build[];
  likedSet: Set<string>;
  bookmarkedSet: Set<string>;
  likeCounts: Record<string, number>;
  onLike: (buildId: string) => void;
  onBookmark: (buildId: string) => void;
  onShare: (build: Build) => void;
  t: (key: string) => string;
}

function WallView({ builds, likedSet, bookmarkedSet, likeCounts, onLike, onBookmark, onShare, t }: WallViewProps) {
  return (
    <div className="max-w-[470px] mx-auto space-y-5">
      {builds.map((build, i) => {
        const primaryImage = build.images.find((img) => img.isPrimary) || build.images[0];
        const isLiked = likedSet.has(build.id);
        const isBookmarked = bookmarkedSet.has(build.id);

        return (
          <article
            key={build.id}
            className="rounded-xl border border-border/50 bg-card overflow-hidden"
          >
            {/* Header — user row */}
            <div className="flex items-center gap-3 px-4 py-3">
              <Link href={`/u/${build.userHandle}`} className="shrink-0">
                <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-gx-red/30">
                  <Image src={build.userAvatar} alt={build.username} fill sizes="32px" className="object-cover" />
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/u/${build.userHandle}`} className="text-sm font-semibold text-foreground hover:text-gx-red transition-colors">
                  {build.username}
                </Link>
                <p className="text-[11px] text-muted-foreground leading-tight">{build.kitName}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <GradeBadge grade={build.grade} />
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{build.scale}</span>
              </div>
            </div>

            {/* Image */}
            <Link href={`/builds/${build.slug}`} className="block">
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.alt}
                  fill
                  sizes="(max-width: 510px) 100vw, 470px"
                  className="object-cover"
                  style={primaryImage.objectPosition ? { objectPosition: primaryImage.objectPosition } : undefined}
                  priority={i < 2}
                  loading={i < 2 ? "eager" : "lazy"}
                />
                {build.status === "WIP" && (
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/90 text-black">
                      WIP
                    </span>
                  </div>
                )}
              </div>
            </Link>

            {/* Actions row */}
            <div className="px-4 pt-3 pb-1">
              <div className="flex items-center">
                <div className="flex items-center gap-3">
                  <button onClick={() => onLike(build.id)} className="group flex items-center gap-1.5">
                    <Heart
                      className={cn(
                        "h-6 w-6 transition-colors",
                        isLiked ? "fill-red-500 text-red-500" : "text-foreground group-hover:text-red-400"
                      )}
                    />
                    <span className="text-sm font-semibold text-foreground">{likeCounts[build.id] ?? build.likes}</span>
                  </button>
                  <Link href={`/builds/${build.slug}#comments`} className="group flex items-center gap-1.5">
                    <MessageCircle className="h-6 w-6 text-foreground group-hover:text-blue-400 transition-colors" />
                    <span className="text-sm font-semibold text-foreground">{build.comments}</span>
                  </Link>
                  <button onClick={() => onShare(build)} className="group">
                    <Share2 className="h-5 w-5 text-foreground group-hover:text-green-400 transition-colors" />
                  </button>
                </div>
                <button onClick={() => onBookmark(build.id)} className="ml-auto group">
                  <Bookmark
                    className={cn(
                      "h-6 w-6 transition-colors",
                      isBookmarked ? "fill-foreground text-foreground" : "text-foreground group-hover:text-yellow-400"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Username + caption */}
            <div className="px-4 pb-4 pt-1">
              <p className="text-sm">
                <Link href={`/u/${build.userHandle}`} className="font-semibold text-foreground hover:text-gx-red transition-colors">
                  {build.username}
                </Link>
                {" "}
                <Link href={`/builds/${build.slug}`} className="text-muted-foreground hover:text-foreground transition-colors">
                  {build.title}
                </Link>
              </p>
              {build.techniques.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {build.techniques.slice(0, 4).map((tech) => (
                    <span key={tech} className="px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground">{tech}</span>
                  ))}
                  {build.techniques.length > 4 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground">+{build.techniques.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
