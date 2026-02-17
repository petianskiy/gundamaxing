import { cn } from "@/lib/utils";
import type { Grade } from "@/lib/types";

const gradeStyles: Record<Grade, string> = {
  PG: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  MG: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  MGEX: "bg-blue-600/15 text-blue-300 border-blue-600/30",
  RG: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  HG: "bg-green-500/15 text-green-400 border-green-500/30",
  SD: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  "RE/100": "bg-orange-500/15 text-orange-400 border-orange-500/30",
  FM: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  EG: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  HiRM: "bg-red-500/15 text-red-400 border-red-500/30",
};

export function GradeBadge({ grade }: { grade: Grade }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wider border",
        gradeStyles[grade]
      )}
    >
      {grade}
    </span>
  );
}
