"use client";

import Link from "next/link";
import Image from "next/image";
import { Pin, Lock, MessageSquare, Eye } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import type { Thread } from "@/lib/types";

export function ThreadList({ threads }: { threads: Thread[] }) {
  const { t } = useTranslation();

  if (threads.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        {t("forum.noThreads")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {threads.map((thread) => (
        <Link
          key={thread.id}
          href={`/thread/${thread.id}`}
          className="group flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-card hover:border-border transition-colors"
        >
          <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
            <Image
              src={thread.userAvatar}
              alt={thread.username}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {thread.isPinned && <Pin className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
              {thread.isLocked && <Lock className="h-3 w-3 text-orange-400 flex-shrink-0" />}
              <h3 className="text-sm font-semibold text-foreground group-hover:text-foreground line-clamp-1">
                {thread.title}
              </h3>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium">
                {thread.categoryName}
              </span>
              <span>{t("shared.by")} {thread.username}</span>
              <span>&middot;</span>
              <span>{thread.createdAt}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground flex-shrink-0">
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
      ))}
    </div>
  );
}
