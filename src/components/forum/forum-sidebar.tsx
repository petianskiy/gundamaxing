import { ActivePilotsCard } from "./active-pilots-card";
import { BuildersBoardCard } from "./builders-board-card";
import { MonthlyMissionCard } from "./monthly-mission-card";
import { RecentActivityCard } from "./recent-activity-card";
import type {
  ForumActivePilot,
  ForumLeaderboardEntry,
  ForumRecentActivity,
  MonthlyMissionUI,
} from "@/lib/types";

export function ForumSidebar({
  activePilots,
  topContributors,
  recentActivity,
  mission,
}: {
  activePilots: ForumActivePilot[];
  topContributors: ForumLeaderboardEntry[];
  recentActivity: ForumRecentActivity[];
  mission: MonthlyMissionUI | null;
}) {
  return (
    <aside className="hidden lg:flex flex-col gap-4 w-[296px] flex-shrink-0">
      <ActivePilotsCard pilots={activePilots} />
      <BuildersBoardCard entries={topContributors} />
      {mission && <MonthlyMissionCard mission={mission} />}
      <RecentActivityCard activities={recentActivity} />
    </aside>
  );
}
