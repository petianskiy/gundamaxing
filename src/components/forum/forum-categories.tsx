"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import type { ForumCategory } from "@/lib/types";

export function ForumCategories({ categories }: { categories: ForumCategory[] }) {
  const { t } = useTranslation();

  return (
    <section className="mb-10">
      <h2 className="font-orbitron text-xs font-bold uppercase tracking-[0.2em] text-forum-accent mb-4">
        {t("forum.categories")}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/forum/category/${cat.id}`}
            className="group relative flex items-start gap-3 p-4 rounded-lg border border-forum-border bg-forum-panel/80 hover:border-forum-accent/40 transition-all"
          >
            {/* Color accent top edge */}
            <div
              className="absolute top-0 left-0 right-0 h-0.5 rounded-t-lg"
              style={{ background: cat.color }}
            />
            <span className="text-2xl flex-shrink-0 mt-0.5">{cat.icon}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-rajdhani text-sm font-bold text-white group-hover:text-forum-accent transition-colors">
                {cat.name}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{cat.description}</p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-600 font-share-tech-mono">
                <span>{cat.threadCount} threads</span>
                <span className="text-forum-border">|</span>
                <span>{cat.postCount} posts</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
