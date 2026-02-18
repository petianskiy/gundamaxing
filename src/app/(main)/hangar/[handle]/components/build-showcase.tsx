"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Wrench,
  Plus,
  Camera,
  Package,
  Award,
  Star,
  Clock,
} from "lucide-react";
import { GradeBadge } from "@/components/ui/grade-badge";
import type { Build, HangarUser } from "@/lib/types";

interface BuildShowcaseProps {
  builds: Build[];
  allBuilds: Build[];
  user: HangarUser;
  isOwner: boolean;
  onInspect: (build: Build) => void;
}

function calculateYearsBuilding(createdAt: string): number {
  const joined = new Date(createdAt);
  const now = new Date();
  return Math.max(0, Math.floor(((now.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24 * 365.25)) * 10) / 10);
}

export function BuildShowcase({
  builds,
  allBuilds,
  user,
  isOwner,
  onInspect,
}: BuildShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const count = builds.length;
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < count - 1;

  const goTo = useCallback(
    (idx: number) => {
      setDirection(idx > activeIndex ? 1 : -1);
      setActiveIndex(idx);
    },
    [activeIndex]
  );
  const goNext = useCallback(() => {
    if (hasNext) goTo(activeIndex + 1);
  }, [hasNext, activeIndex, goTo]);
  const goPrev = useCallback(() => {
    if (hasPrev) goTo(activeIndex - 1);
  }, [hasPrev, activeIndex, goTo]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [goNext, goPrev]);

  const years = calculateYearsBuilding(user.createdAt);
  const favGrade =
    user.preferredGrades.length > 0 ? user.preferredGrades[0] : null;

  // ── Empty state ──
  if (count === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex items-center justify-center"
      >
        <div className="rounded-xl bg-zinc-900 border border-zinc-700/50 shadow-lg px-8 py-8 text-center w-64">
          <Camera className="h-6 w-6 text-red-500/60 mx-auto mb-3" />
          <h2 className="text-base font-bold text-white mb-1">
            {isOwner ? "Start Building" : "Empty Hangar"}
          </h2>
          <p className="text-xs text-zinc-500 mb-5">
            {isOwner
              ? "Upload your first build."
              : "No builds yet."}
          </p>
          {isOwner && (
            <Link
              href="/upload"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Upload
            </Link>
          )}
        </div>
      </motion.div>
    );
  }

  // ── With builds ──
  const active = builds[activeIndex];
  const img = active.images.find((i) => i.isPrimary) || active.images[0];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="max-w-6xl mx-auto w-full"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* ── LEFT: Main image showcase ── */}
        <div className="relative">
          {/* Nav arrows */}
          {hasPrev && (
            <button
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-[#222] flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {hasNext && (
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-[#222] flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-all"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* Image card */}
          <div className="relative rounded-2xl overflow-hidden border border-[#222] bg-[#111113]">
            <AnimatePresence mode="popLayout" custom={direction}>
              <motion.div
                key={active.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative aspect-[4/3] sm:aspect-[16/10] cursor-pointer group"
                onClick={() => onInspect(active)}
              >
                {img ? (
                  <Image
                    src={img.url}
                    alt={img.alt || active.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    style={img.objectPosition ? { objectPosition: img.objectPosition } : undefined}
                    unoptimized
                    priority
                    sizes="(max-width: 1024px) 100vw, 700px"
                  />
                ) : (
                  <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                    <Wrench className="h-16 w-16 text-zinc-800" />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-sm font-semibold">
                    <Search className="h-4 w-4" />
                    Inspect
                  </div>
                </div>

                {/* Grade — top left */}
                <div className="absolute top-3 left-3 z-10">
                  <GradeBadge grade={active.grade} />
                </div>

                {/* WIP — top right */}
                {active.status === "WIP" && (
                  <span className="absolute top-3 right-3 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-sm">
                    WIP
                  </span>
                )}

                {/* Bottom gradient + title */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-4 px-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                    {active.title}
                  </h2>
                  <p className="text-xs text-white/50 mt-0.5 truncate">
                    {active.kitName}
                    {active.scale && <span> &middot; {active.scale}</span>}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Thumbnail strip */}
          {(count > 1 || isOwner) && (
            <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
              {builds.map((b, i) => {
                const th = b.images[0]?.url;
                return (
                  <button
                    key={b.id}
                    onClick={() => goTo(i)}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
                      i === activeIndex
                        ? "border-[#dc2626] scale-105"
                        : "border-white/5 opacity-40 hover:opacity-70 hover:border-white/20"
                    }`}
                  >
                    {th ? (
                      <Image
                        src={th}
                        alt={b.title}
                        fill
                        className="object-cover"
                        unoptimized
                        sizes="48px"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-zinc-900" />
                    )}
                  </button>
                );
              })}
              {isOwner && (
                <Link
                  href="/upload"
                  className="w-12 h-12 rounded-lg border-2 border-dashed border-white/10 hover:border-[#dc2626]/40 flex items-center justify-center transition-all hover:bg-[#dc2626]/5 flex-shrink-0"
                >
                  <Plus className="h-4 w-4 text-white/15 hover:text-[#dc2626]" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: Info panel ── */}
        <div className="flex flex-col gap-3">
          {/* Build info card */}
          <div className="rounded-2xl border border-[#1a1a1d] bg-[#111113] p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/30">
                Build Details
              </h3>
              <button
                onClick={() => onInspect(active)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#dc2626] hover:bg-red-600 text-white text-xs font-semibold transition-all"
              >
                <Search className="h-3 w-3" />
                Full View
              </button>
            </div>

            <div className="space-y-3">
              <InfoRow label="Kit" value={active.kitName} />
              <InfoRow label="Grade" value={active.grade} />
              <InfoRow label="Scale" value={active.scale} />
              <InfoRow label="Timeline" value={active.timeline} />
              <InfoRow label="Status" value={active.status} />
              {active.techniques.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-white/20 font-medium">
                    Techniques
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {active.techniques.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-white/40 border border-[#1a1a1d]"
                      >
                        {t}
                      </span>
                    ))}
                    {active.techniques.length > 4 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] text-white/20">
                        +{active.techniques.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Reactions */}
            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-[#1a1a1d]">
              <ReactionPill emoji="&#x1F91D;" count={active.respectCount} label="Respect" />
              <ReactionPill emoji="&#x1F527;" count={active.techniqueCount} label="Technique" />
              <ReactionPill emoji="&#x2728;" count={active.creativityCount} label="Creativity" />
            </div>
          </div>

          {/* Builder stats card */}
          <div className="rounded-2xl border border-[#1a1a1d] bg-[#111113] p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">
              Builder Stats
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Stat icon={Package} label="Builds" value={String(user.buildCount)} />
              <Stat icon={Clock} label="Years" value={years < 1 ? "<1" : String(years)} />
              <Stat icon={Award} label="Level" value={String(user.level)} />
              {favGrade && <Stat icon={Star} label="Grade" value={favGrade} />}
            </div>
          </div>

          {/* Owner: Add build CTA */}
          {isOwner && (
            <Link
              href="/upload"
              className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-white/10 hover:border-[#dc2626]/40 text-white/30 hover:text-[#dc2626] transition-all hover:bg-[#dc2626]/5 group"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Add New Build</span>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Sub-components ──

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-wider text-white/20 font-medium">
        {label}
      </span>
      <span className="text-sm text-white/70 font-medium">{value}</span>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-white/15" />
      <div>
        <p className="text-sm font-bold text-white tabular-nums">{value}</p>
        <p className="text-[9px] uppercase tracking-wider text-white/20">
          {label}
        </p>
      </div>
    </div>
  );
}

function ReactionPill({
  emoji,
  count,
  label,
}: {
  emoji: string;
  count: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-white/40" title={label}>
      <span
        className="text-sm"
        dangerouslySetInnerHTML={{ __html: emoji }}
      />
      <span className="text-xs font-medium tabular-nums">{count}</span>
    </div>
  );
}
