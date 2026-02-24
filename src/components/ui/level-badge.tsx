import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const levelStyles: Record<number, string> = {
  1: "bg-zinc-800 text-zinc-400 border-zinc-700",
  2: "bg-emerald-900/50 text-emerald-400 border-emerald-700",
  3: "bg-blue-900/50 text-blue-400 border-blue-700",
  4: "bg-purple-900/50 text-purple-400 border-purple-700",
  5: "bg-amber-900/50 text-amber-400 border-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.2)]",
};

const sizeClasses = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-xs",
  lg: "px-2.5 py-1 text-sm",
};

export function LevelBadge({ level, size = "sm", showLabel = false }: LevelBadgeProps) {
  const clampedLevel = Math.max(1, Math.min(5, level));
  const style = levelStyles[clampedLevel] ?? levelStyles[1];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border font-bold tracking-wider",
        style,
        sizeClasses[size]
      )}
    >
      Lv.{level}
      {showLabel && <span className="font-medium opacity-75">Pilot</span>}
    </span>
  );
}
