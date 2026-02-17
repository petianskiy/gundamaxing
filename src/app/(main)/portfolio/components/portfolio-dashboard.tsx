"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";
import { PortfolioStats } from "./portfolio-stats";
import { PortfolioBuildGrid } from "./portfolio-build-grid";
import { PortfolioEmptyState } from "./portfolio-empty-state";
import type { Build } from "@/lib/types";

interface PortfolioDashboardProps {
  builds: Build[];
  stats: {
    builds: number;
    likes: number;
    comments: number;
    forks: number;
    bookmarks: number;
  };
  pinnedBuildIds: string[];
  handle: string;
  displayName: string;
}

export function PortfolioDashboard({
  builds,
  stats,
  pinnedBuildIds,
  handle,
  displayName,
}: PortfolioDashboardProps) {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const filteredBuilds = builds
    .filter((b) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "wip") return b.status === "WIP";
      if (statusFilter === "completed") return b.status === "Completed";
      if (statusFilter === "abandoned") return b.status === "Abandoned";
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "mostLiked":
          return b.likes - a.likes;
        case "mostCommented":
          return b.comments - a.comments;
        default: // newest
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("portfolio.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("portfolio.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/u/${handle}`}>
              <Button variant="secondary" size="sm">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Public Profile
              </Button>
            </Link>
            <Link href="/upload">
              <Button variant="primary" size="sm">
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                New Build
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <PortfolioStats stats={stats} />

        {builds.length === 0 ? (
          <PortfolioEmptyState />
        ) : (
          <>
            {/* Filter / Sort bar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  { key: "all", label: t("portfolio.filter.all") },
                  { key: "wip", label: t("portfolio.filter.wip") },
                  { key: "completed", label: t("portfolio.filter.completed") },
                  { key: "abandoned", label: t("portfolio.filter.abandoned") },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                      statusFilter === key
                        ? "bg-gx-red/20 border-gx-red/40 text-gx-red"
                        : "bg-gx-surface border-border/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs bg-gx-surface border border-border/50 text-muted-foreground focus:outline-none focus:border-gx-red/50"
              >
                <option value="newest">{t("portfolio.sort.newest")}</option>
                <option value="oldest">{t("portfolio.sort.oldest")}</option>
                <option value="mostLiked">{t("portfolio.sort.mostLiked")}</option>
                <option value="mostCommented">{t("portfolio.sort.mostCommented")}</option>
              </select>
            </div>

            {/* Build Grid */}
            <PortfolioBuildGrid
              builds={filteredBuilds}
              pinnedBuildIds={pinnedBuildIds}
            />
          </>
        )}
      </div>
    </div>
  );
}
