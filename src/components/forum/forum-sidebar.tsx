import { ActivePilotsCard } from "./active-pilots-card";
import { BuildersBoardCard } from "./builders-board-card";
import { ForumStatsCard } from "./forum-stats-card";
import { RecentActivityCard } from "./recent-activity-card";
import type {
  ForumActivePilot,
  ForumLeaderboardEntry,
  ForumRecentActivity,
  ForumStats,
} from "@/lib/types";

export function ForumSidebar({
  activePilots,
  topContributors,
  recentActivity,
  stats,
}: {
  activePilots: ForumActivePilot[];
  topContributors: ForumLeaderboardEntry[];
  recentActivity: ForumRecentActivity[];
  stats: ForumStats;
}) {
  return (
    <aside className="hidden lg:flex flex-col gap-4 w-[296px] flex-shrink-0">
      <ActivePilotsCard pilots={activePilots} />
      <BuildersBoardCard entries={topContributors} />
      <ForumStatsCard stats={stats} />
      <RecentActivityCard activities={recentActivity} />
    </aside>
  );
}
