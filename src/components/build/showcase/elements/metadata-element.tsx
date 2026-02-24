"use client";

import { cn } from "@/lib/utils";
import { GradeBadge } from "@/components/ui/grade-badge";
import { TechniqueChip } from "@/components/ui/technique-chip";
import type { Build, ShowcaseMetadataElement } from "@/lib/types";

interface MetadataElementProps {
  element: ShowcaseMetadataElement;
  build: Build;
}

// Helper: convert px design value to cqi (reference: 1000px canvas = 100cqi)
function cqi(px: number): string {
  return `${px / 10}cqi`;
}

export function MetadataElement({ element, build }: MetadataElementProps) {
  const isCompact = element.variant === "compact";

  return (
    <div
      className={cn(
        "w-full h-full overflow-hidden",
        "bg-black/60 backdrop-blur-md border border-white/10",
        "text-white"
      )}
      style={{
        padding: cqi(16),
        borderRadius: cqi(12),
        fontSize: cqi(12),
      }}
    >
      {/* Title row */}
      <div className="flex items-center" style={{ gap: cqi(8), marginBottom: cqi(12) }}>
        <GradeBadge grade={build.grade} />
        <span className="font-mono text-zinc-400" style={{ fontSize: cqi(12) }}>{build.scale}</span>
        {build.status === "WIP" && (
          <span
            className="font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30"
            style={{ padding: `${cqi(2)} ${cqi(8)}`, borderRadius: cqi(4), fontSize: cqi(10) }}
          >
            WIP
          </span>
        )}
      </div>

      <h3
        className="font-bold text-white leading-tight"
        style={{ fontSize: isCompact ? cqi(14) : cqi(18) }}
      >
        {build.title}
      </h3>
      <p className="text-zinc-400" style={{ fontSize: cqi(12), marginTop: cqi(2) }}>{build.kitName}</p>

      {/* Metadata grid */}
      {!isCompact && (
        <div className="grid grid-cols-2" style={{ marginTop: cqi(12), gap: cqi(8), fontSize: cqi(12) }}>
          {build.paintSystem && (
            <div>
              <span className="text-zinc-500 uppercase tracking-wider" style={{ fontSize: cqi(10) }}>Paint</span>
              <p className="text-zinc-300">{build.paintSystem}</p>
            </div>
          )}
          {build.topcoat && (
            <div>
              <span className="text-zinc-500 uppercase tracking-wider" style={{ fontSize: cqi(10) }}>Topcoat</span>
              <p className="text-zinc-300">{build.topcoat}</p>
            </div>
          )}
          {build.timeInvested && (
            <div>
              <span className="text-zinc-500 uppercase tracking-wider" style={{ fontSize: cqi(10) }}>Time</span>
              <p className="text-zinc-300">{build.timeInvested}</p>
            </div>
          )}
        </div>
      )}

      {/* Techniques */}
      {build.techniques.length > 0 && (
        <div className="flex flex-wrap" style={{ marginTop: cqi(12), gap: cqi(4) }}>
          {build.techniques.slice(0, isCompact ? 3 : 8).map((tech) => (
            <TechniqueChip key={tech} technique={tech} size="sm" />
          ))}
          {build.techniques.length > (isCompact ? 3 : 8) && (
            <span className="text-zinc-500 self-center" style={{ fontSize: cqi(10) }}>
              +{build.techniques.length - (isCompact ? 3 : 8)}
            </span>
          )}
        </div>
      )}

      {/* Intent */}
      {!isCompact && build.intentStatement && (
        <p
          className="text-zinc-400 italic line-clamp-3 border-l-2 border-red-600/50"
          style={{ marginTop: cqi(12), fontSize: cqi(12), paddingLeft: cqi(8) }}
        >
          {build.intentStatement}
        </p>
      )}
    </div>
  );
}
