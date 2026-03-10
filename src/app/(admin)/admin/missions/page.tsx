import { getAdminMission, getAdminMissionSubmissions } from "@/lib/data/missions";
import { Target } from "lucide-react";
import Link from "next/link";
import { MissionSubmissionsTable } from "./components/mission-submissions-table";

export default async function AdminMissionsPage() {
  const mission = await getAdminMission();

  if (!mission) {
    return (
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-gx-gold" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Missions</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Manage monthly challenges</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">No active mission.</p>
          <Link
            href="/admin/settings"
            className="px-4 py-2 rounded-lg bg-gx-gold/15 text-gx-gold text-sm font-medium hover:bg-gx-gold/25 transition-colors"
          >
            Create Mission in Settings
          </Link>
        </div>
      </div>
    );
  }

  const submissions = await getAdminMissionSubmissions(mission.id);

  const missionEnded = new Date() > mission.endDate;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6 text-gx-gold" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Missions</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Manage monthly challenges</p>
      </div>

      {/* Active Mission Overview */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-foreground">{mission.title}</h2>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  missionEnded
                    ? "bg-red-500/15 text-red-400 border border-red-500/30"
                    : "bg-green-500/15 text-green-400 border border-green-500/30"
                }`}
              >
                {missionEnded ? "Ended" : "Active"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl line-clamp-2">
              {mission.description}
            </p>
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span>Start: {mission.startDate.toLocaleDateString()}</span>
              <span>End: {mission.endDate.toLocaleDateString()}</span>
              <span className="font-medium text-foreground">
                {mission._count.submissions} submissions
              </span>
            </div>
            {mission.winner && (
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <span className="text-gx-gold font-medium">Winner:</span>
                <span className="text-foreground">
                  {mission.winner.user.username} — &quot;{mission.winner.title}&quot;
                </span>
              </div>
            )}
          </div>
          <Link
            href="/admin/settings"
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-border/50"
          >
            Edit Mission
          </Link>
        </div>
      </div>

      {/* Submissions */}
      <MissionSubmissionsTable
        submissions={submissions}
        missionId={mission.id}
        winnerId={mission.winnerId}
      />
    </div>
  );
}
