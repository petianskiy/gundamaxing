"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n/context";
import { ThreadList } from "@/components/forum/thread-list";
import { ForumPagination } from "@/components/forum/forum-pagination";
import { SortSelect } from "@/components/forum/sort-select";
import type { ForumCategory, Thread } from "@/lib/types";

interface CategoryViewProps {
  category: ForumCategory;
  threads: Thread[];
  currentPage: number;
  totalPages: number;
  sort: string;
}

export function CategoryView({ category, threads, currentPage, totalPages, sort }: CategoryViewProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link href="/forum" className="hover:text-foreground transition-colors">{t("forum.title")}</Link>
          <span>/</span>
          <span>{category.name}</span>
        </div>

        {/* Category header */}
        <div className="flex items-center gap-4 mb-8">
          <span className="text-3xl">{category.icon}</span>
          <div className="flex-1">
            <h1
              className="text-2xl font-bold text-foreground tracking-tight"
              style={{ color: category.color }}
            >
              {category.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{category.description}</p>
          </div>
          {session?.user && (
            <Link
              href={`/forum/new?category=${category.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gx-red text-white text-xs font-medium hover:bg-red-600 transition-colors"
            >
              <Plus className="h-3 w-3" />
              {t("forum.newThread")}
            </Link>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-muted-foreground">
            {category.threadCount.toLocaleString()} {t("shared.threads")}
          </p>
          <SortSelect current={sort} />
        </div>

        {/* Threads */}
        {threads.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {t("forum.noThreadsInCategory")}
          </p>
        ) : (
          <ThreadList threads={threads} />
        )}

        <ForumPagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath={`/forum/category/${category.id}`}
          searchParams={{ sort }}
        />
      </div>
    </div>
  );
}
