"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/context";
import type { ForumCategory } from "@/lib/types";

function CategoryCard({ cat, featured = false }: { cat: ForumCategory; featured?: boolean }) {
  return (
    <Link
      href={`/forum/category/${cat.id}`}
      className={`group relative block overflow-hidden ${
        featured ? "col-span-2 row-span-2" : ""
      }`}
    >
      {/* Card shell — sharp angles, military precision */}
      <div
        className={`relative w-full overflow-hidden ${
          featured ? "h-[280px]" : "h-[140px]"
        }`}
      >
        {/* Background image */}
        {cat.image ? (
          <Image
            src={cat.image}
            alt=""
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-900" />
        )}

        {/* Cinematic gradient — heavier bottom, subtle color tint */}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            background: `linear-gradient(to top, ${cat.color}CC 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.25) 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />

        {/* Top edge accent — color bar */}
        <div
          className="absolute top-0 left-0 w-12 h-[3px]"
          style={{ background: cat.color }}
        />

        {/* Content positioned at bottom */}
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          {/* Title */}
          <h3
            className={`font-orbitron font-bold text-white uppercase tracking-wide leading-tight ${
              featured ? "text-lg mb-1.5" : "text-[11px] mb-1"
            }`}
          >
            {cat.name}
          </h3>

          {/* Description — only on featured */}
          {featured && (
            <p className="text-[12px] text-white/60 leading-relaxed mb-3 max-w-md">
              {cat.description}
            </p>
          )}

          {/* Stats bar */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 font-share-tech-mono text-white/50 ${
                featured ? "text-[11px]" : "text-[9px]"
              }`}
            >
              {cat.childCount > 0 ? (
                <>
                  <span className="text-white/70">{cat.childCount}</span>
                  <span className="uppercase tracking-wider">Workshops</span>
                  <span className="text-white/20 mx-1">|</span>
                  <span className="text-white/70">{cat.postCount}</span>
                  <span className="uppercase tracking-wider">Posts</span>
                </>
              ) : (
                <>
                  <span className="text-white/70">{cat.threadCount}</span>
                  <span className="uppercase tracking-wider">Threads</span>
                  <span className="text-white/20 mx-1">|</span>
                  <span className="text-white/70">{cat.postCount}</span>
                  <span className="uppercase tracking-wider">Posts</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Hover border glow */}
        <div
          className="absolute inset-0 border border-transparent group-hover:border-white/20 transition-colors duration-300 pointer-events-none"
        />
      </div>
    </Link>
  );
}

export function ForumCategories({ categories }: { categories: ForumCategory[] }) {
  const { t } = useTranslation();

  // First category with children (e.g. Techniques & Tutorials) gets featured treatment
  const featured = categories.find((c) => c.childCount > 0);
  const rest = categories.filter((c) => c.id !== featured?.id);

  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-px flex-1 bg-gradient-to-r from-gx-red/60 to-transparent" />
        <h2 className="font-orbitron text-[10px] font-bold uppercase tracking-[0.25em] text-gx-red">
          {t("forum.categories")}
        </h2>
        <div className="h-px flex-1 bg-gradient-to-l from-gx-red/60 to-transparent" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[2px] bg-white/[0.03] rounded-sm overflow-hidden">
        {/* Featured card — 2x2 on large, full-width on small */}
        {featured && <CategoryCard cat={featured} featured />}

        {/* Remaining cards — fill 2-column right side on large */}
        {rest.map((cat) => (
          <CategoryCard key={cat.id} cat={cat} />
        ))}
      </div>
    </section>
  );
}
