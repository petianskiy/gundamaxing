import { Award } from "lucide-react";

const tierBorderColors: Record<string, string> = {
  BRONZE: "border-amber-700",
  SILVER: "border-zinc-400",
  GOLD: "border-yellow-500",
  PLATINUM: "border-cyan-400",
};

const tierBgColors: Record<string, string> = {
  BRONZE: "bg-amber-700/10",
  SILVER: "bg-zinc-400/10",
  GOLD: "bg-yellow-500/10",
  PLATINUM: "bg-cyan-400/10",
};

const tierTextColors: Record<string, string> = {
  BRONZE: "text-amber-600",
  SILVER: "text-zinc-400",
  GOLD: "text-yellow-400",
  PLATINUM: "text-cyan-300",
};

interface BadgeData {
  id: string;
  name: string;
  icon: string;
  description: string;
  tier: string;
}

export function Achievements({ badges }: { badges: BadgeData[] }) {
  return (
    <section className="rounded-xl border border-border/50 bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Award className="h-4 w-4 text-gx-gold" />
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Achievements
        </h2>
      </div>

      {badges.length === 0 ? (
        <div className="py-8 text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-muted/30 mb-3">
            <Award className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">
            No badges yet — start building!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`flex flex-col items-center p-4 rounded-xl border-2 ${
                tierBorderColors[badge.tier] || "border-border/50"
              } ${tierBgColors[badge.tier] || "bg-muted/10"} transition-transform hover:scale-105`}
              title={badge.description}
            >
              <span className="text-2xl mb-2">{badge.icon}</span>
              <p className="text-xs font-semibold text-foreground text-center leading-tight">
                {badge.name}
              </p>
              <span
                className={`mt-1.5 text-[9px] font-bold uppercase tracking-widest ${
                  tierTextColors[badge.tier] || "text-muted-foreground"
                }`}
              >
                {badge.tier}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
