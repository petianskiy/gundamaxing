import { SidebarCard } from "./sidebar-card";
import type { ForumStats } from "@/lib/types";

export function ForumStatsCard({ stats }: { stats: ForumStats }) {
  return (
    <SidebarCard title="Forum Stats" accentColor="#10b981">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="font-orbitron text-lg font-bold text-white">
            {stats.totalThreads.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Threads</p>
        </div>
        <div>
          <p className="font-orbitron text-lg font-bold text-white">
            {stats.totalPosts.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Comments</p>
        </div>
        <div>
          <p className="font-orbitron text-lg font-bold text-white">
            {stats.totalPilots.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Pilots</p>
        </div>
      </div>
    </SidebarCard>
  );
}
