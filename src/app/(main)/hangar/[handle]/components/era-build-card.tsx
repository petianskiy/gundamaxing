"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GradeBadge } from "@/components/ui/grade-badge";
import type { Build } from "@/lib/types";

interface EraBuildCardProps {
  build: Build;
  onClick: () => void;
}

export function EraBuildCard({ build, onClick }: EraBuildCardProps) {
  const primaryImage = build.images[0]?.url;

  return (
    <motion.div
      layoutId={`build-${build.id}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        "relative flex-shrink-0 cursor-pointer rounded-lg overflow-hidden",
        "w-[280px] aspect-[16/10]",
        "border border-[#27272a] bg-[#18181b]",
        "scroll-snap-align-start",
        "[scroll-snap-align:start]",
        "transition-shadow duration-200",
        "hover:border-red-600/50 hover:shadow-[0_0_20px_rgba(220,38,38,0.15)]"
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Image */}
      {primaryImage ? (
        <Image
          src={primaryImage}
          alt={build.title}
          fill
          unoptimized
          className="object-cover"
          sizes="280px"
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
          <span className="text-zinc-600 text-sm">No Image</span>
        </div>
      )}

      {/* WIP badge — top right */}
      {build.status === "WIP" && (
        <span
          className={cn(
            "absolute top-2 right-2 z-10",
            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
            "bg-amber-500/20 text-amber-400 border border-amber-500/30"
          )}
        >
          WIP
        </span>
      )}

      {/* Bottom gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 p-3 z-10">
        {/* Grade badge — bottom left */}
        <div className="mb-1.5">
          <GradeBadge grade={build.grade} />
        </div>

        <h4 className="text-sm font-bold text-white truncate leading-tight">
          {build.title}
        </h4>

        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
          {build.kitName}
        </p>
      </div>
    </motion.div>
  );
}
