"use client";

import { cn } from "@/lib/utils";
import { GradeBadge } from "@/components/ui/grade-badge";
import { TechniqueChip } from "@/components/ui/technique-chip";
import type { Build, ShowcaseMetadataElement } from "@/lib/types";

interface MetadataElementProps {
  element: ShowcaseMetadataElement;
  build: Build;
}

export function MetadataElement({ element, build }: MetadataElementProps) {
  const isCompact = element.variant === "compact";

  return (
    <div
      className={cn(
        "w-full h-full overflow-hidden rounded-xl",
        "bg-black/60 backdrop-blur-md border border-white/10",
        "text-white p-4"
      )}
    >
      {/* Title row */}
      <div className="flex items-center gap-2 mb-3">
        <GradeBadge grade={build.grade} />
        <span className="text-xs font-mono text-zinc-400">{build.scale}</span>
        {build.status === "WIP" && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
            WIP
          </span>
        )}
      </div>

      <h3 className={cn("font-bold text-white leading-tight", isCompact ? "text-sm" : "text-lg")}>
        {build.title}
      </h3>
      <p className="text-xs text-zinc-400 mt-0.5">{build.kitName}</p>

      {/* Metadata grid */}
      {!isCompact && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {build.paintSystem && (
            <div>
              <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Paint</span>
              <p className="text-zinc-300">{build.paintSystem}</p>
            </div>
          )}
          {build.topcoat && (
            <div>
              <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Topcoat</span>
              <p className="text-zinc-300">{build.topcoat}</p>
            </div>
          )}
          {build.timeInvested && (
            <div>
              <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Time</span>
              <p className="text-zinc-300">{build.timeInvested}</p>
            </div>
          )}
        </div>
      )}

      {/* Techniques */}
      {build.techniques.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {build.techniques.slice(0, isCompact ? 3 : 8).map((tech) => (
            <TechniqueChip key={tech} technique={tech} size="sm" />
          ))}
          {build.techniques.length > (isCompact ? 3 : 8) && (
            <span className="text-[10px] text-zinc-500 self-center">
              +{build.techniques.length - (isCompact ? 3 : 8)}
            </span>
          )}
        </div>
      )}

      {/* Intent */}
      {!isCompact && build.intentStatement && (
        <p className="mt-3 text-xs text-zinc-400 italic line-clamp-3 border-l-2 border-red-600/50 pl-2">
          {build.intentStatement}
        </p>
      )}
    </div>
  );
}
