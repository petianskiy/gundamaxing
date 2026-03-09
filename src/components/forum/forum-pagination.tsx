"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

interface ForumPaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
}

export function ForumPagination({ currentPage, totalPages, basePath, searchParams = {} }: ForumPaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  }

  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-8" aria-label="Pagination">
      {currentPage > 1 ? (
        <Link
          href={buildHref(currentPage - 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded text-xs text-gray-500 hover:text-gx-red hover:bg-forum-panel transition-colors"
        >
          <ChevronLeft className="h-3 w-3" />
          {t("forum.previous")}
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-1.5 rounded text-xs text-gray-700 cursor-not-allowed">
          <ChevronLeft className="h-3 w-3" />
          {t("forum.previous")}
        </span>
      )}

      {pages.map((page) => (
        <Link
          key={page}
          href={buildHref(page)}
          className={`px-3 py-1.5 text-xs font-bold transition-all ${
            page === currentPage
              ? "clip-angle bg-gx-red text-white"
              : "rounded text-gray-500 hover:text-gx-red hover:bg-forum-panel"
          }`}
        >
          {page}
        </Link>
      ))}

      {currentPage < totalPages ? (
        <Link
          href={buildHref(currentPage + 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded text-xs text-gray-500 hover:text-gx-red hover:bg-forum-panel transition-colors"
        >
          {t("forum.next")}
          <ChevronRight className="h-3 w-3" />
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-1.5 rounded text-xs text-gray-700 cursor-not-allowed">
          {t("forum.next")}
          <ChevronRight className="h-3 w-3" />
        </span>
      )}
    </nav>
  );
}
