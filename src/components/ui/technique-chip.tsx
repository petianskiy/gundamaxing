import { cn } from "@/lib/utils";

const techniqueColors: Record<string, string> = {
  "Airbrushing": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Hand Painting": "bg-green-500/10 text-green-400 border-green-500/20",
  "Painting": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Weathering": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Scribing": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Panel Lining": "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  "Custom Decals": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "LED/Electronics": "bg-red-500/10 text-red-400 border-red-500/20",
  "Kitbashing": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Scratch Building": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Pla-plating": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "Topcoat": "bg-slate-500/10 text-slate-400 border-slate-500/20",
  "Candy Coat": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Metallic Finish": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "Battle Damage": "bg-red-600/10 text-red-500 border-red-600/20",
  "Straight Build": "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const defaultColor = "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";

export function TechniqueChip({ technique, size = "sm" }: { technique: string; size?: "sm" | "md" }) {
  const colorClass = techniqueColors[technique] || defaultColor;
  return (
    <span
      className={cn(
        "inline-flex items-center border rounded-full font-medium",
        colorClass,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
    >
      {technique}
    </span>
  );
}
