import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Grade } from "@/lib/types";

const gradeEmblem: Record<Grade, string> = {
  HG: "/images/grades/hg.jpg",
  RG: "/images/grades/rg.jpg",
  MG: "/images/grades/mg.jpg",
  PG: "/images/grades/pg.jpg",
  SD: "/images/grades/sd.jpg",
  EG: "/images/grades/eg.jpg",
  FM: "/images/grades/fm.jpg",
  MGEX: "/images/grades/mgex.jpg",
  HiRM: "/images/grades/hirm.jpg",
  "RE/100": "/images/grades/re100.jpg",
};

const sizeClasses = {
  sm: "h-5",
  md: "h-6",
  lg: "h-8",
} as const;

export function GradeBadge({
  grade,
  size = "md",
  className,
}: {
  grade: Grade;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const src = gradeEmblem[grade];

  if (!src) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wider border bg-zinc-500/15 text-zinc-400 border-zinc-500/30">
        {grade}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={grade}
      width={120}
      height={48}
      className={cn("w-auto object-contain", sizeClasses[size], className)}
    />
  );
}
