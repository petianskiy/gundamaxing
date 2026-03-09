import Image from "next/image";
import Link from "next/link";
import { SidebarCard } from "./sidebar-card";
import type { ForumLeaderboardEntry } from "@/lib/types";

const RANK_STYLES: Record<number, { color: string; label: string }> = {
  0: { color: "text-yellow-400", label: "🥇" },
  1: { color: "text-gray-300", label: "🥈" },
  2: { color: "text-amber-600", label: "🥉" },
};

function getInitials(displayName: string | null, username: string): string {
  if (displayName) {
    const words = displayName.trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return displayName.slice(0, 2).toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

export function BuildersBoardCard({ entries }: { entries: ForumLeaderboardEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <SidebarCard title="Top Builders" accentColor="#d4a017">
      <div className="space-y-2">
        {entries.map((entry, i) => {
          const rank = RANK_STYLES[i];
          return (
            <Link
              key={entry.id}
              href={`/hangar/${entry.username}`}
              className="flex items-center gap-2.5 group"
            >
              <span className="w-5 text-center text-xs font-bold">
                {rank ? (
                  <span className={rank.color}>{rank.label}</span>
                ) : (
                  <span className="text-gray-600 font-share-tech-mono">{i + 1}</span>
                )}
              </span>
              {entry.avatar ? (
                <div className="relative w-6 h-6 rounded-full overflow-hidden">
                  <Image
                    src={entry.avatar}
                    alt={entry.displayName ?? entry.username}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-forum-border flex items-center justify-center text-[9px] font-bold text-gray-400 font-share-tech-mono">
                  {getInitials(entry.displayName, entry.username)}
                </div>
              )}
              <span className="flex-1 text-xs text-gray-400 group-hover:text-gx-red transition-colors truncate">
                {entry.displayName ?? entry.username}
              </span>
              <span className="text-[10px] text-gray-600 font-share-tech-mono">
                {entry.totalLikes.toLocaleString()} likes
              </span>
            </Link>
          );
        })}
      </div>
    </SidebarCard>
  );
}
