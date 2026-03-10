"use client";

import { ForumHero } from "@/components/forum/forum-hero";
import { ForumCategories } from "@/components/forum/forum-categories";
import { ForumThreadControls } from "@/components/forum/forum-thread-controls";
import { ThreadList } from "@/components/forum/thread-list";
import { ForumPagination } from "@/components/forum/forum-pagination";
import { ForumSidebar } from "@/components/forum/forum-sidebar";
import type { ForumCategory, Thread, MonthlyMissionUI } from "@/lib/types";
import type {
  ForumActivePilot,
  ForumLeaderboardEntry,
  ForumRecentActivity,
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
  mission,
}: {
  categories: ForumCategory[];
  threads: Thread[];
  currentPage: number;
  totalPages: number;
  sort: string;
  activePilots: ForumActivePilot[];
  topContributors: ForumLeaderboardEntry[];
  recentActivity: ForumRecentActivity[];
  mission: MonthlyMissionUI | null;
}) {
  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="animate-page-header">
          <ForumHero />
        </div>

        {/* Categories — full width above sidebar layout */}
        <div className="animate-page-content">
          <ForumCategories categories={categories} />
        </div>

        {/* Main + Sidebar */}
        <div className="animate-page-grid flex gap-6 items-start">
          <div className="flex-1 min-w-0">
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

          <ForumSidebar
            activePilots={activePilots}
            topContributors={topContributors}
            recentActivity={recentActivity}
            mission={mission}
          />
        </div>
      </div>
    </div>
  );
}
