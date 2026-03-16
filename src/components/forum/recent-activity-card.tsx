"use client";

import Link from "next/link";
import { MessageSquare, FileText } from "lucide-react";
import { SidebarCard } from "./sidebar-card";
import { useTranslation } from "@/lib/i18n/context";
import type { ForumRecentActivity } from "@/lib/types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function RecentActivityCard({ activities }: { activities: ForumRecentActivity[] }) {
  const { t } = useTranslation();
  if (activities.length === 0) return null;

  return (
    <SidebarCard title={t("forum.sidebar.recentActivity")} accentColor="#8b5cf6">
      <div className="space-y-2.5">
        {activities.map((activity) => (
          <Link
            key={`${activity.type}-${activity.id}`}
            href={activity.type === "thread" ? `/thread/${activity.id}` : "#"}
            className="flex items-start gap-2 group"
          >
            {activity.type === "thread" ? (
              <FileText className="h-3 w-3 text-gx-red mt-0.5 flex-shrink-0" />
            ) : (
              <MessageSquare className="h-3 w-3 text-purple-400 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400 group-hover:text-gx-red transition-colors line-clamp-1">
                {activity.title}
              </p>
              <p className="text-[10px] text-gray-600">
                <span className="text-gray-500">{activity.username}</span>
                {" "}· {timeAgo(activity.createdAt)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </SidebarCard>
  );
}
