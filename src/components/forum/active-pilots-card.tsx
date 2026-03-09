import Link from "next/link";
import { SidebarCard } from "./sidebar-card";
import type { ForumActivePilot } from "@/lib/types";

function getStatusColor(lastActiveAt: string): string {
  const diff = Date.now() - new Date(lastActiveAt).getTime();
  const hours = diff / (1000 * 60 * 60);
  if (hours < 1) return "bg-green-400";
  if (hours < 24) return "bg-yellow-400";
  return "bg-gray-500";
}

function getInitials(displayName: string | null, username: string): string {
  if (displayName) {
    const words = displayName.trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return displayName.slice(0, 2).toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

export function ActivePilotsCard({ pilots }: { pilots: ForumActivePilot[] }) {
  if (pilots.length === 0) return null;

  return (
    <SidebarCard title="Active Pilots">
      <div className="space-y-2.5">
        {pilots.map((pilot) => (
          <Link
            key={pilot.id}
            href={`/hangar/${pilot.username}`}
            className="flex items-center gap-2.5 group"
          >
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-forum-border flex items-center justify-center text-[10px] font-bold text-forum-accent font-share-tech-mono">
                {getInitials(pilot.displayName, pilot.username)}
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-forum-panel ${getStatusColor(pilot.lastActiveAt)}`}
              />
            </div>
            <span className="text-xs text-gray-400 group-hover:text-forum-accent transition-colors truncate">
              {pilot.displayName ?? pilot.username}
            </span>
          </Link>
        ))}
      </div>
    </SidebarCard>
  );
}
