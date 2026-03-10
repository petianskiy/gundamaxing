"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus, ChevronRight } from "lucide-react";
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
    <div className="relative min-h-screen">
      {/* Shared forum background */}
      <div className="fixed inset-0 -z-20">
        <Image
          src="/images/forum-bg.jpg"
          alt=""
          fill
          className="object-cover object-center"
          priority
          unoptimized
        />
      </div>
      <div className="fixed inset-0 -z-10 bg-black/60" />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] font-share-tech-mono text-white/40 mb-8">
            <Link href="/forum" className="hover:text-white/70 transition-colors uppercase tracking-wider">
              Forum
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/70 uppercase tracking-wider">{category.name}</span>
          </div>

          {/* Category hero banner */}
          {category.image ? (
            <div className="relative h-36 sm:h-44 overflow-hidden mb-8">
              <Image
                src={category.image}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to right, ${category.color}DD 0%, rgba(0,0,0,0.6) 50%, transparent 100%)`,
                }}
              />
              <div className="absolute inset-0 bg-black/30" />
              <div
                className="absolute top-0 left-0 w-16 h-[3px]"
                style={{ background: category.color }}
              />

              <div className="absolute inset-0 flex items-end justify-between p-4 sm:p-6">
                <div>
                  <h1 className="font-orbitron text-xl sm:text-2xl font-bold text-white uppercase tracking-wide mb-1">
                    {category.name}
                  </h1>
                  <p className="text-[12px] text-white/50">{category.description}</p>
                </div>
                {session?.user && (
                  <Link
                    href={`/forum/new?category=${category.id}`}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 backdrop-blur-sm border border-white/10 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-white/20 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    {t("forum.newThread")}
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1
                  className="font-orbitron text-xl font-bold uppercase tracking-wide mb-1"
                  style={{ color: category.color }}
                >
                  {category.name}
                </h1>
                <p className="text-sm text-white/50">{category.description}</p>
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
          )}

          {/* Sort */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-share-tech-mono text-white/40 uppercase tracking-wider">
              {category.threadCount.toLocaleString()} {t("shared.threads")}
            </p>
            <SortSelect current={sort} />
          </div>

          {/* Threads */}
          {threads.length === 0 ? (
            <p className="text-sm text-white/40 py-8 text-center">
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
    </div>
  );
}
