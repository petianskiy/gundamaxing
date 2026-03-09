"use client";

import { ForumHero } from "@/components/forum/forum-hero";
import { ForumCategories } from "@/components/forum/forum-categories";
import { ForumThreadControls } from "@/components/forum/forum-thread-controls";
import { ThreadList } from "@/components/forum/thread-list";
import { ForumPagination } from "@/components/forum/forum-pagination";
import { ForumSidebar } from "@/components/forum/forum-sidebar";
import type { ForumCategory, Thread } from "@/lib/types";
import type {
  ForumActivePilot,
  ForumLeaderboardEntry,
  ForumRecentActivity,
  ForumStats,
} from "@/lib/types";

export function ForumFeed({
  categories,
  threads,
  currentPage,
  totalPages,
  sort,
  activePilots,
  topContributors,
  recentActivity,
  stats,
}: {
  categories: ForumCategory[];
  threads: Thread[];
  currentPage: number;
  totalPages: number;
  sort: string;
  activePilots: ForumActivePilot[];
  topContributors: ForumLeaderboardEntry[];
  recentActivity: ForumRecentActivity[];
  stats: ForumStats;
}) {
  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <ForumHero />

        <div className="flex gap-6 items-start">
          {/* Main column */}
          <div className="flex-1 min-w-0">
            <ForumCategories categories={categories} />

            <section>
              <ForumThreadControls sort={sort} />
              <ThreadList threads={threads} />
              <ForumPagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath="/forum"
                searchParams={{ sort }}
              />
            </section>
          </div>

          {/* Sidebar */}
          <ForumSidebar
            activePilots={activePilots}
            topContributors={topContributors}
            recentActivity={recentActivity}
            stats={stats}
          />
        </div>
      </div>
    </div>
  );
}
