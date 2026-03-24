"use client";

import { useState, useMemo } from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import Link from "next/link";
import { Heart, MessageCircle, GitFork, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { GradeBadge } from "@/components/ui/grade-badge";
import type { Grade } from "@/lib/types";

interface BuildImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  objectPosition: string | null;
  order: number;
}

interface BuildUser {
  username: string;
  avatar: string | null;
}

interface Build {
  id: string;
  slug: string;
  title: string;
  kitName: string;
  grade: string;
  scale: string;
  status: string;
  techniques: string[];
  likeCount: number;
  commentCount: number;
  forkCount: number;
  createdAt: Date;
  images: BuildImage[];
  user: BuildUser;
}

type SortOption = "newest" | "popular" | "most-liked";

export function BuildGallery({
  builds,
  userHandle,
}: {
  builds: Build[];
  userHandle: string;
}) {
  const { t } = useTranslation();
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);
  const [techniqueFilter, setTechniqueFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("newest");

  const allGrades = useMemo(
    () => [...new Set(builds.map((b) => b.grade))].sort(),
    [builds]
  );
  const allTechniques = useMemo(
    () => [...new Set(builds.flatMap((b) => b.techniques))].sort(),
    [builds]
  );

  const filtered = useMemo(() => {
    let result = builds;
    if (gradeFilter) {
      result = result.filter((b) => b.grade === gradeFilter);
    }
    if (techniqueFilter) {
      result = result.filter((b) => b.techniques.includes(techniqueFilter));
    }
    switch (sort) {
      case "popular":
        result = [...result].sort(
          (a, b) => b.likeCount + b.commentCount - (a.likeCount + a.commentCount)
        );
        break;
      case "most-liked":
        result = [...result].sort((a, b) => b.likeCount - a.likeCount);
        break;
      case "newest":
      default:
        result = [...result].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
    return result;
  }, [builds, gradeFilter, techniqueFilter, sort]);

  if (builds.length === 0) {
    return (
      <section className="rounded-xl border border-border/50 bg-card p-8 text-center">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
          {t("builds.gallery.title")}
        </h2>
        <div className="py-8">
          <p className="text-muted-foreground">
            {t("builds.gallery.empty")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          {t("builds.gallery.title")}
        </h2>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-2 py-1 rounded-lg border border-border/50 bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-gx-red/50"
          >
            <option value="newest">{t("builds.sort.newest")}</option>
            <option value="popular">{t("builds.sort.popular")}</option>
            <option value="most-liked">{t("builds.sort.mostLiked")}</option>
          </select>
        </div>
      </div>

      {/* Filter chips */}
      {(allGrades.length > 1 || allTechniques.length > 1) && (
        <div className="flex flex-wrap gap-2 mb-4">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground mt-1" />
          {allGrades.map((grade) => (
            <button
              key={grade}
              onClick={() =>
                setGradeFilter(gradeFilter === grade ? null : grade)
              }
              className={cn(
                "px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wider border transition-colors",
                gradeFilter === grade
                  ? "bg-gx-red/15 text-red-400 border-red-500/30"
                  : "bg-muted/30 text-muted-foreground border-border/50 hover:text-foreground"
              )}
            >
              {grade}
            </button>
          ))}
          {allTechniques.slice(0, 8).map((tech) => (
            <button
              key={tech}
              onClick={() =>
                setTechniqueFilter(techniqueFilter === tech ? null : tech)
              }
              className={cn(
                "px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors",
                techniqueFilter === tech
                  ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                  : "bg-muted/30 text-muted-foreground border-border/50 hover:text-foreground"
              )}
            >
              {tech}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {filtered.map((build) => {
          const primaryImage = build.images.find((img) => img.isPrimary) || build.images[0];
          return (
            <div key={build.id} className="relative group" style={{ aspectRatio: "3/4" }}>
              <Link href={`/builds/${build.slug}`} className="absolute inset-0 rounded-[14px] overflow-hidden block">
                <div className="relative w-full h-full rounded-[14px] overflow-hidden border border-white/[0.08] bg-[#0d1420] transition-transform duration-300 group-hover:scale-[1.02]" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.6)" }}>
                  {primaryImage && (
                    <Image
                      src={primaryImage.url}
                      alt={primaryImage.alt}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                      style={primaryImage.objectPosition ? { objectPosition: primaryImage.objectPosition } : undefined}
                    />
                  )}

                  {/* Grade badge */}
                  <div className="absolute top-2.5 left-2.5 z-[5]">
                    <GradeBadge grade={build.grade as Grade} />
                  </div>

                  {/* WIP */}
                  {build.status === "WIP" && (
                    <div className="absolute top-9 right-2.5 z-[6]">
                      <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest bg-amber-400/15 border border-amber-400/40 text-amber-400">WIP</span>
                    </div>
                  )}

                  {/* Corner decorations */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/20 rounded-tl-[14px] z-[6]" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/20 rounded-tr-[14px] z-[6]" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/20 rounded-bl-[14px] z-[6]" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/20 rounded-br-[14px] z-[6]" />

                  {/* Bottom gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none" />

                  {/* Info panel */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 z-[5]">
                    {build.techniques.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {build.techniques.slice(0, 2).map((tech) => (
                          <span key={tech} className="text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/55 border border-white/10">{tech}</span>
                        ))}
                        {build.techniques.length > 2 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/40">+{build.techniques.length - 2}</span>
                        )}
                      </div>
                    )}
                    <h3 className="text-[13px] font-bold text-white leading-tight truncate mb-0.5">{build.title}</h3>
                    <p className="text-[10px] text-white/45 truncate mb-2">{build.kitName}</p>
                    <div className="flex items-center gap-2.5 text-[11px] text-white/50">
                      <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" />{build.likeCount}</span>
                      <span className="flex items-center gap-0.5"><MessageCircle className="h-3 w-3" />{build.commentCount}</span>
                      <span className="flex items-center gap-0.5"><GitFork className="h-3 w-3" />{build.forkCount}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && builds.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card p-8 text-center mt-4">
          <p className="text-sm text-muted-foreground">
            {t("builds.gallery.noMatch")}
          </p>
          <button
            onClick={() => {
              setGradeFilter(null);
              setTechniqueFilter(null);
            }}
            className="mt-2 text-xs text-gx-red hover:text-red-400 transition-colors"
          >
            {t("builds.gallery.clearFilters")}
          </button>
        </div>
      )}
    </section>
  );
}
