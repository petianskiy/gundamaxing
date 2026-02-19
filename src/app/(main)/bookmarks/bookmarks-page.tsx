"use client";

import { Bookmark } from "lucide-react";
import { BuildCard } from "@/components/build/build-card";
import { useTranslation } from "@/lib/i18n/context";
import type { Build } from "@/lib/types";

interface BookmarksPageProps {
  builds: Build[];
}

export function BookmarksPage({ builds }: BookmarksPageProps) {
  const { t } = useTranslation();

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Bookmark className="h-6 w-6 text-gx-red" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t("nav.bookmarks")}
            </h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Projects you&apos;ve saved for later. {builds.length > 0 && `${builds.length} saved`}
          </p>
        </div>

        {/* Grid */}
        {builds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {builds.map((build) => (
              <BuildCard key={build.id} build={build} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
            <Bookmark className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No bookmarks yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              When you find builds you love, bookmark them to easily find them here later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
