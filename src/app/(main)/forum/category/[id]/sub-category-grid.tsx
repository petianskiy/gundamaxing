"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import type { ForumCategory } from "@/lib/types";

export function SubCategoryGrid({
  category,
}: {
  category: ForumCategory & { children?: ForumCategory[] };
}) {
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

          {/* Hero banner for parent category */}
          {category.image && (
            <div className="relative h-48 sm:h-56 overflow-hidden mb-10">
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

              {/* Top accent bar */}
              <div
                className="absolute top-0 left-0 w-20 h-[3px]"
                style={{ background: category.color }}
              />

              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
                <h1 className="font-orbitron text-2xl sm:text-3xl font-bold text-white uppercase tracking-wide mb-2">
                  {category.name}
                </h1>
                <p className="text-sm text-white/60 max-w-lg">
                  {category.description}
                </p>
              </div>
            </div>
          )}

          {!category.image && (
            <div className="mb-10">
              <h1 className="font-orbitron text-2xl font-bold text-white uppercase tracking-wide mb-2">
                {category.name}
              </h1>
              <p className="text-sm text-white/50">{category.description}</p>
            </div>
          )}

          {/* Section label */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className="h-px flex-1"
              style={{ background: `linear-gradient(to right, ${category.color}80, transparent)` }}
            />
            <span className="font-orbitron text-[9px] font-bold uppercase tracking-[0.3em] text-white/40">
              {category.children?.length} Workshops
            </span>
            <div
              className="h-px flex-1"
              style={{ background: `linear-gradient(to left, ${category.color}80, transparent)` }}
            />
          </div>

          {/* Workshop cards — 3x2 grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[2px] bg-white/[0.03] overflow-hidden">
            {category.children?.map((child) => (
              <Link
                key={child.id}
                href={`/forum/category/${child.id}`}
                className="group relative block"
              >
                <div className="relative h-[160px] overflow-hidden">
                  {/* Background */}
                  {child.image ? (
                    <Image
                      src={child.image}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                      unoptimized
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{ background: `linear-gradient(135deg, ${child.color}30, ${child.color}08)` }}
                    />
                  )}

                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(to top, ${child.color}CC 0%, rgba(0,0,0,0.65) 50%, rgba(0,0,0,0.2) 100%)`,
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/5 transition-colors duration-300" />

                  {/* Top accent */}
                  <div
                    className="absolute top-0 left-0 w-10 h-[3px]"
                    style={{ background: child.color }}
                  />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <h3 className="font-orbitron text-[12px] font-bold text-white uppercase tracking-wide mb-0.5">
                      {child.name}
                    </h3>
                    <p className="text-[10px] text-white/50 leading-relaxed mb-2 line-clamp-1">
                      {child.description}
                    </p>
                    <div className="flex items-center gap-2 font-share-tech-mono text-[9px] text-white/40">
                      <span className="text-white/60">{child.threadCount}</span>
                      <span className="uppercase tracking-wider">Threads</span>
                      <span className="text-white/15 mx-0.5">|</span>
                      <span className="text-white/60">{child.postCount}</span>
                      <span className="uppercase tracking-wider">Posts</span>
                    </div>
                  </div>

                  {/* Hover border */}
                  <div className="absolute inset-0 border border-transparent group-hover:border-white/20 transition-colors duration-300 pointer-events-none" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
