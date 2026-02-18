"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, GitFork, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { GradeBadge } from "@/components/ui/grade-badge";
import { TechniqueChip } from "@/components/ui/technique-chip";
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
          Build Gallery
        </h2>
        <div className="py-8">
          <p className="text-muted-foreground">
            No builds yet. The hangar is empty.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Build Gallery
        </h2>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-2 py-1 rounded-lg border border-border/50 bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-gx-red/50"
          >
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
            <option value="most-liked">Most Liked</option>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((build) => {
          const primaryImage =
            build.images.find((img) => img.isPrimary) || build.images[0];
          return (
            <Link
              key={build.id}
              href={`/builds/${build.id}`}
              className="group relative rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm hover:shadow-lg hover:border-border transition-[border-color,box-shadow] duration-300"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                {primaryImage && (
                  <Image
                    src={primaryImage.url}
                    alt={primaryImage.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    style={
                      primaryImage.objectPosition
                        ? { objectPosition: primaryImage.objectPosition }
                        : undefined
                    }
                    unoptimized
                  />
                )}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <GradeBadge grade={build.grade as Grade} />
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-black/60 text-zinc-300 backdrop-blur-sm">
                    {build.scale}
                  </span>
                </div>
                {build.status === "WIP" && (
                  <div className="absolute bottom-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/90 text-black backdrop-blur-sm">
                      WIP
                    </span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-gx-red transition-colors">
                  {build.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {build.kitName}
                </p>
                {build.techniques.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {build.techniques.slice(0, 3).map((tech) => (
                      <TechniqueChip key={tech} technique={tech} size="sm" />
                    ))}
                    {build.techniques.length > 3 && (
                      <span className="text-[10px] text-muted-foreground px-1">
                        +{build.techniques.length - 3}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {build.likeCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {build.commentCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="h-3 w-3" />
                    {build.forkCount}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && builds.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card p-8 text-center mt-4">
          <p className="text-sm text-muted-foreground">
            No builds match the current filters.
          </p>
          <button
            onClick={() => {
              setGradeFilter(null);
              setTechniqueFilter(null);
            }}
            className="mt-2 text-xs text-gx-red hover:text-red-400 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
