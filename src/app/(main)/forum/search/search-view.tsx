"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import { ForumSearch } from "@/components/forum/forum-search";
import { ThreadList } from "@/components/forum/thread-list";
import { ForumPagination } from "@/components/forum/forum-pagination";
import type { Thread } from "@/lib/types";

interface SearchViewProps {
  query: string;
  threads: Thread[];
  currentPage: number;
  totalPages: number;
}

export function SearchView({ query, threads, currentPage, totalPages }: SearchViewProps) {
  const { t } = useTranslation();

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link href="/forum" className="hover:text-foreground transition-colors">{t("forum.title")}</Link>
          <span>/</span>
          <span>{t("forum.searchResults")}</span>
        </div>

        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-6">
          {query
            ? t("forum.searchResultsFor", { query })
            : t("forum.searchResults")}
        </h1>

        <div className="mb-6 max-w-md">
          <ForumSearch initialQuery={query} />
        </div>

        {query && threads.length > 0 && (
          <p className="text-xs text-muted-foreground mb-4">
            {t("forum.resultCount", { count: String(threads.length + (totalPages > 1 ? "+" : "")) })}
          </p>
        )}

        {query && threads.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {t("forum.noSearchResults")}
          </p>
        ) : (
          <ThreadList threads={threads} />
        )}

        {query && (
          <ForumPagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/forum/search"
            searchParams={{ q: query }}
          />
        )}
      </div>
    </div>
  );
}
