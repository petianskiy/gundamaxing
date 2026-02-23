"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n/context";
import { ForumSearch } from "@/components/forum/forum-search";
import { SortSelect } from "@/components/forum/sort-select";
import { ThreadList } from "@/components/forum/thread-list";
import { ForumPagination } from "@/components/forum/forum-pagination";
import type { ForumCategory, Thread } from "@/lib/types";

export function ForumFeed({
  categories,
  threads,
  currentPage,
  totalPages,
  sort,
}: {
  categories: ForumCategory[];
  threads: Thread[];
  currentPage: number;
  totalPages: number;
  sort: string;
}) {
  const { t } = useTranslation();
  const { data: session } = useSession();

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("forum.title")}</h1>
            <p className="mt-1 text-muted-foreground">
              {t("forum.subtitle")}
            </p>
          </div>
          {session?.user && (
            <Link
              href="/forum/new"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gx-red text-white text-xs font-medium hover:bg-red-600 transition-colors flex-shrink-0"
            >
              <Plus className="h-3 w-3" />
              {t("forum.newThread")}
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="mb-8 max-w-md">
          <ForumSearch />
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
                href={`/forum/category/${cat.id}`}
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
                <div className="flex items-center gap-3 sm:gap-6 text-xs text-muted-foreground flex-shrink-0">
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{cat.threadCount.toLocaleString()}</p>
                    <p className="hidden sm:block">{t("shared.threads")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{cat.postCount.toLocaleString()}</p>
                    <p className="hidden sm:block">{t("shared.posts")}</p>
                  </div>
                  {cat.lastActivity && (
                    <div className="hidden sm:block text-right w-20">
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("forum.recentThreads")}
            </h2>
            <SortSelect current={sort} />
          </div>

          <ThreadList threads={threads} />

          <ForumPagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/forum"
            searchParams={{ sort }}
          />
        </section>
      </div>
    </div>
  );
}
