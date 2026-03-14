"use client";

import { SmartImage as Image } from "@/components/ui/smart-image";
import Link from "next/link";
import { Pin, Lock, MessageSquare, Eye, Flame } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import type { Thread } from "@/lib/types";

const HOT_THRESHOLD = 20;

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function stripMarkdown(str: string): string {
  return str
    .replace(/[#*_~`>\[\]()!-]/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

export function ThreadList({ threads }: { threads: Thread[] }) {
  const { t } = useTranslation();

  if (threads.length === 0) {
    return (
      <div className="rounded-lg border border-forum-border bg-forum-panel/60 p-8 text-center">
        <p className="text-sm text-gray-500 font-rajdhani">
          {t("forum.noThreads")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {threads.map((thread) => {
        const isHot = thread.replies >= HOT_THRESHOLD;
        const preview = stripMarkdown(thread.content).slice(0, 120);

        return (
          <Link
            key={thread.id}
            href={`/thread/${thread.id}`}
            className={`group flex items-start gap-3 p-3.5 rounded-lg border transition-all ${
              thread.isPinned
                ? "border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50"
                : "border-forum-border bg-forum-panel/60 hover:border-gx-red/30"
            }`}
          >
            {/* Avatar */}
            {thread.userAvatar ? (
              <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                <Image
                  src={thread.userAvatar}
                  alt={thread.username}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-bold font-share-tech-mono ${
                  thread.isPinned
                    ? "bg-yellow-500/15 text-yellow-400"
                    : "bg-forum-border text-gx-red"
                }`}
              >
                {getInitials(thread.username)}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {thread.isPinned && (
                  <Pin className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                )}
                {thread.isLocked && (
                  <Lock className="h-3 w-3 text-orange-400 flex-shrink-0" />
                )}
                <h3
                  className={`text-sm font-semibold line-clamp-1 transition-colors ${
                    thread.isPinned
                      ? "text-yellow-200 group-hover:text-yellow-100"
                      : "text-gray-200 group-hover:text-gx-red"
                  }`}
                >
                  {thread.title}
                </h3>
                {isHot && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-500/15 text-[9px] font-bold text-red-400 uppercase tracking-wider">
                    <Flame className="h-2.5 w-2.5" />
                    {t("forum.hot")}
                  </span>
                )}
              </div>

              {/* Preview text */}
              {preview && (
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
                  {preview}
                </p>
              )}

              {/* Meta row */}
              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-600">
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider"
                  style={{
                    backgroundColor: "rgba(220, 38, 38, 0.1)",
                    color: "rgba(220, 38, 38, 0.7)",
                  }}
                >
                  {thread.categoryName}
                </span>
                <span className="text-gray-500">{thread.username}</span>
                <span className="text-forum-border">·</span>
                <span>{thread.createdAt}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-gray-500 flex-shrink-0 mt-1 font-share-tech-mono">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {thread.replies}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {thread.views.toLocaleString()}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
