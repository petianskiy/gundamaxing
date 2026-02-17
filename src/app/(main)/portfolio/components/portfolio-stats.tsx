"use client";

import { Hammer, Heart, MessageSquare, GitFork, Bookmark } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

interface StatsProps {
  stats: {
    builds: number;
    likes: number;
    comments: number;
    forks: number;
    bookmarks: number;
  };
}

const statConfig = [
  { key: "builds", icon: Hammer, color: "text-gx-red" },
  { key: "likes", icon: Heart, color: "text-pink-400" },
  { key: "comments", icon: MessageSquare, color: "text-blue-400" },
  { key: "forks", icon: GitFork, color: "text-purple-400" },
  { key: "bookmarks", icon: Bookmark, color: "text-amber-400" },
] as const;

export function PortfolioStats({ stats }: StatsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {statConfig.map(({ key, icon: Icon, color }) => (
        <div
          key={key}
          className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-3"
        >
          <div className={`p-2 rounded-lg bg-muted/50 ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{stats[key]}</p>
            <p className="text-xs text-muted-foreground">{t(`portfolio.stats.${key}`)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
