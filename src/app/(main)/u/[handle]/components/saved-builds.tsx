"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { GradeBadge } from "@/components/ui/grade-badge";
import type { Build } from "@/lib/types";

interface SavedBuildsProps {
  builds: Build[];
}

export function SavedBuilds({ builds }: SavedBuildsProps) {
  if (builds.length === 0) {
    return (
      <section className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Bookmark className="h-4 w-4" />
          Saved Builds
        </h2>
        <p className="text-sm text-muted-foreground text-center py-8">
          No saved builds yet. Bookmark builds to see them here.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border/50 bg-card p-5">
      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
        <Bookmark className="h-4 w-4" />
        Saved Builds ({builds.length})
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {builds.map((build) => {
          const primaryImage = build.images.find((img) => img.isPrimary) || build.images[0];
          return (
            <Link
              key={build.id}
              href={`/builds/${build.id}`}
              className="group rounded-lg border border-border/50 overflow-hidden hover:border-border transition-colors"
            >
              <div className="relative aspect-[4/3] bg-muted">
                {primaryImage ? (
                  <Image
                    src={primaryImage.url}
                    alt={primaryImage.alt || build.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                    No Image
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <GradeBadge grade={build.grade} />
                </div>
              </div>
              <div className="p-2.5">
                <h3 className="text-xs font-medium text-foreground line-clamp-1">
                  {build.title}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                  by {build.username}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
