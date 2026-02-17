import { Wrench, Paintbrush, Star } from "lucide-react";
import { TechniqueChip } from "@/components/ui/technique-chip";
import { GradeBadge } from "@/components/ui/grade-badge";
import type { Grade } from "@/lib/types";

const skillLevelColors: Record<string, string> = {
  BEGINNER: "bg-green-500/15 text-green-400 border-green-500/30",
  INTERMEDIATE: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  ADVANCED: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  EXPERT: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
};

export function WorkshopSpecs({
  skillLevel,
  techniques,
  tools,
  preferredGrades,
}: {
  skillLevel: string | null;
  techniques: string[];
  tools: string[];
  preferredGrades: string[];
}) {
  const hasContent =
    skillLevel || techniques.length > 0 || tools.length > 0 || preferredGrades.length > 0;

  if (!hasContent) return null;

  return (
    <section className="rounded-xl border border-border/50 bg-card p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Wrench className="h-4 w-4 text-gx-gold" />
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Workshop Specs
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {skillLevel && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Skill Level
              </p>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider border ${
                skillLevelColors[skillLevel] ||
                "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
              }`}
            >
              {skillLevel}
            </span>
          </div>
        )}

        {preferredGrades.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">
              Preferred Grades
            </p>
            <div className="flex flex-wrap gap-1.5">
              {preferredGrades.map((grade) => (
                <GradeBadge key={grade} grade={grade as Grade} />
              ))}
            </div>
          </div>
        )}

        {techniques.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Paintbrush className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Techniques
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {techniques.map((tech) => (
                <TechniqueChip key={tech} technique={tech} size="md" />
              ))}
            </div>
          </div>
        )}

        {tools.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Tools
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tools.map((tool) => (
                <span
                  key={tool}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
