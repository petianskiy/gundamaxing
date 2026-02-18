"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import type { BuildLogEntry } from "@/lib/types";

interface BuildTimelineProps {
  entries: BuildLogEntry[];
}

const entryVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export function BuildTimeline({ entries }: BuildTimelineProps) {
  const { t } = useTranslation();

  if (entries.length === 0) return null;

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-6">
        {t("hangar.inspect.timeline")}
      </h3>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative pl-8"
      >
        {/* Vertical line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-red-600/20 rounded-full" />

        {sortedEntries.map((entry, index) => (
          <motion.div
            key={entry.id}
            variants={entryVariants}
            className={cn(
              "relative pb-8",
              index === sortedEntries.length - 1 && "pb-0"
            )}
          >
            {/* Dot on timeline */}
            <div
              className={cn(
                "absolute -left-8 top-1.5 w-[15px] h-[15px]",
                "flex items-center justify-center"
              )}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-600/60 ring-2 ring-[#09090b]" />
            </div>

            {/* Date */}
            <time className="block text-[11px] text-zinc-500 font-medium mb-1">
              {formatTimelineDate(entry.date)}
            </time>

            {/* Title */}
            <h4 className="text-sm font-semibold text-zinc-200 mb-1">
              {entry.title}
            </h4>

            {/* Content */}
            {entry.content && (
              <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                {entry.content}
              </p>
            )}

            {/* Image grid */}
            {entry.images.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {entry.images.map((imgUrl, imgIdx) => (
                  <div
                    key={`${entry.id}-img-${imgIdx}`}
                    className="relative w-20 h-20 rounded-md overflow-hidden border border-[#27272a] bg-[#18181b]"
                  >
                    <Image
                      src={imgUrl}
                      alt={`${entry.title} image ${imgIdx + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function formatTimelineDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}
