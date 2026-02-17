"use client";

import Link from "next/link";
import Image from "next/image";
import { Pin, MessageSquare, Eye } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import type { ForumCategory, Thread } from "@/lib/types";

export function ForumFeed({
  categories,
  threads,
}: {
  categories: ForumCategory[];
  threads: Thread[];
}) {
  const { t } = useTranslation();
  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("forum.title")}</h1>
          <p className="mt-1 text-muted-foreground">
            {t("forum.subtitle")}
          </p>
        </div>

        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            {t("forum.categories")}
          </h2>
          <div className="grid gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href="#"
                className="group flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card hover:border-border transition-colors"
                style={{ borderLeftColor: cat.color, borderLeftWidth: "3px" }}
              >
                <span className="text-2xl flex-shrink-0">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-foreground transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-xs text-muted-foreground flex-shrink-0">
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{cat.threadCount.toLocaleString()}</p>
                    <p>{t("shared.threads")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{cat.postCount.toLocaleString()}</p>
                    <p>{t("shared.posts")}</p>
                  </div>
                  {cat.lastActivity && (
                    <div className="text-right w-20">
                      <p className="text-muted-foreground">{cat.lastActivity}</p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Threads */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            {t("forum.recentThreads")}
          </h2>
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
                <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
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
        </section>
      </div>
    </div>
  );
}
