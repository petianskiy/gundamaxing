"use client";

import { cn } from "@/lib/utils";
import { GradeBadge } from "@/components/ui/grade-badge";
import { TechniqueChip } from "@/components/ui/technique-chip";
import { SupplyChip } from "@/components/supply/supply-chip";
import type { Build, ShowcaseMetadataElement } from "@/lib/types";

interface MetadataElementProps {
  element: ShowcaseMetadataElement;
  build: Build;
}

// Helper: convert px design value to cqi (reference: 1000px canvas = 100cqi)
function cqi(px: number): string {
  return `${px / 10}cqi`;
}

function CardShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "w-full h-full overflow-hidden",
        "bg-black/60 backdrop-blur-md border border-white/10",
        "text-white",
        className
      )}
      style={{
        padding: cqi(16),
        borderRadius: cqi(12),
        fontSize: cqi(12),
      }}
    >
      {children}
    </div>
  );
}

function CompactCard({ build }: { build: Build }) {
  return (
    <CardShell>
      <div className="flex items-center" style={{ gap: cqi(8), marginBottom: cqi(8) }}>
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
      <h3 className="font-bold text-white leading-tight" style={{ fontSize: cqi(14) }}>
        {build.title}
      </h3>
      <p className="text-zinc-400" style={{ fontSize: cqi(12), marginTop: cqi(2) }}>{build.kitName}</p>
      {build.techniques.length > 0 && (
        <div className="flex flex-wrap" style={{ marginTop: cqi(8), gap: cqi(4) }}>
          {build.techniques.slice(0, 3).map((tech) => (
            <TechniqueChip key={tech} technique={tech} size="sm" />
          ))}
          {build.techniques.length > 3 && (
            <span className="text-zinc-500 self-center" style={{ fontSize: cqi(10) }}>
              +{build.techniques.length - 3}
            </span>
          )}
        </div>
      )}
    </CardShell>
  );
}

function FullCard({ build }: { build: Build }) {
  return (
    <CardShell>
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
      <h3 className="font-bold text-white leading-tight" style={{ fontSize: cqi(18) }}>
        {build.title}
      </h3>
      <p className="text-zinc-400" style={{ fontSize: cqi(12), marginTop: cqi(2) }}>{build.kitName}</p>

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

      {build.techniques.length > 0 && (
        <div className="flex flex-wrap" style={{ marginTop: cqi(12), gap: cqi(4) }}>
          {build.techniques.slice(0, 8).map((tech) => (
            <TechniqueChip key={tech} technique={tech} size="sm" />
          ))}
          {build.techniques.length > 8 && (
            <span className="text-zinc-500 self-center" style={{ fontSize: cqi(10) }}>
              +{build.techniques.length - 8}
            </span>
          )}
        </div>
      )}

      {build.intentStatement && (
        <p
          className="text-zinc-400 italic line-clamp-3 border-l-2 border-red-600/50"
          style={{ marginTop: cqi(12), fontSize: cqi(12), paddingLeft: cqi(8) }}
        >
          {build.intentStatement}
        </p>
      )}
    </CardShell>
  );
}

function StatsCard({ build }: { build: Build }) {
  const stats = [
    { label: "Likes", value: build.likes },
    { label: "Comments", value: build.comments },
    { label: "Forks", value: build.forkCount },
    { label: "Bookmarks", value: build.bookmarks },
  ];
  const reactions = [
    { label: "Respect", value: build.respectCount, color: "text-blue-400" },
    { label: "Technique", value: build.techniqueCount, color: "text-emerald-400" },
    { label: "Creativity", value: build.creativityCount, color: "text-purple-400" },
  ];

  return (
    <CardShell>
      <h4 className="uppercase tracking-widest text-zinc-500 font-bold" style={{ fontSize: cqi(10), marginBottom: cqi(12) }}>
        Build Stats
      </h4>
      <div className="grid grid-cols-2" style={{ gap: cqi(10) }}>
        {stats.map((s) => (
          <div key={s.label}>
            <p className="font-bold text-white" style={{ fontSize: cqi(22) }}>
              {s.value >= 1000 ? `${(s.value / 1000).toFixed(1)}k` : s.value}
            </p>
            <p className="text-zinc-500 uppercase tracking-wider" style={{ fontSize: cqi(10) }}>{s.label}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10" style={{ marginTop: cqi(12), paddingTop: cqi(12) }}>
        <p className="text-zinc-500 uppercase tracking-wider" style={{ fontSize: cqi(9), marginBottom: cqi(8) }}>Reactions</p>
        <div className="flex" style={{ gap: cqi(12) }}>
          {reactions.map((r) => (
            <div key={r.label} className="text-center">
              <p className={cn("font-bold", r.color)} style={{ fontSize: cqi(18) }}>{r.value}</p>
              <p className="text-zinc-500" style={{ fontSize: cqi(9) }}>{r.label}</p>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
}

function DescriptionCard({ build }: { build: Build }) {
  return (
    <CardShell>
      <h4 className="uppercase tracking-widest text-zinc-500 font-bold" style={{ fontSize: cqi(10), marginBottom: cqi(10) }}>
        About This Build
      </h4>
      {build.description ? (
        <p className="text-zinc-300 leading-relaxed whitespace-pre-line" style={{ fontSize: cqi(13) }}>
          {build.description}
        </p>
      ) : (
        <p className="text-zinc-600 italic" style={{ fontSize: cqi(12) }}>
          No description added yet
        </p>
      )}
    </CardShell>
  );
}

function PaintCard({ build }: { build: Build }) {
  const rows = [
    { label: "Paint System", value: build.paintSystem },
    { label: "Topcoat", value: build.topcoat },
    { label: "Kit Name", value: build.kitName },
    { label: "Grade", value: build.grade },
    { label: "Scale", value: build.scale },
    { label: "Timeline", value: build.timeline },
  ].filter((r) => r.value);

  return (
    <CardShell>
      <h4 className="uppercase tracking-widest text-zinc-500 font-bold" style={{ fontSize: cqi(10), marginBottom: cqi(12) }}>
        Paint & Kit Specs
      </h4>
      <div style={{ display: "flex", flexDirection: "column", gap: cqi(8) }}>
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between border-b border-white/5" style={{ paddingBottom: cqi(6) }}>
            <span className="text-zinc-500 uppercase tracking-wider" style={{ fontSize: cqi(10) }}>
              {row.label}
            </span>
            <span className="text-zinc-200 font-medium" style={{ fontSize: cqi(12) }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function ToolsCard({ build }: { build: Build }) {
  const hasSupplies = build.supplies && build.supplies.length > 0;
  const hasTools = build.tools && build.tools.length > 0;

  return (
    <CardShell>
      <h4 className="uppercase tracking-widest text-zinc-500 font-bold" style={{ fontSize: cqi(10), marginBottom: cqi(10) }}>
        Tools & Techniques
      </h4>

      {/* Structured supplies (clickable with popover) */}
      {hasSupplies && (
        <div style={{ marginBottom: cqi(12) }}>
          <p className="text-zinc-500 uppercase tracking-wider" style={{ fontSize: cqi(9), marginBottom: cqi(6) }}>Supplies</p>
          <div className="flex flex-wrap" style={{ gap: cqi(4) }}>
            {build.supplies!.map((supply) => (
              <SupplyChip
                key={supply.id}
                supply={supply}
                style={{
                  padding: `${cqi(3)} ${cqi(8)}`,
                  borderRadius: cqi(6),
                  fontSize: cqi(11),
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Free-text tools (plain chips, backward compat) */}
      {hasTools && (
        <div style={{ marginBottom: cqi(12) }}>
          <p className="text-zinc-500 uppercase tracking-wider" style={{ fontSize: cqi(9), marginBottom: cqi(6) }}>
            {hasSupplies ? "Other Tools" : "Tools Used"}
          </p>
          <div className="flex flex-wrap" style={{ gap: cqi(4) }}>
            {build.tools!.map((tool) => (
              <span
                key={tool}
                className="bg-zinc-800 text-zinc-300 border border-zinc-700"
                style={{ padding: `${cqi(3)} ${cqi(8)}`, borderRadius: cqi(6), fontSize: cqi(11) }}
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {build.techniques.length > 0 && (
        <div>
          <p className="text-zinc-500 uppercase tracking-wider" style={{ fontSize: cqi(9), marginBottom: cqi(6) }}>Techniques</p>
          <div className="flex flex-wrap" style={{ gap: cqi(4) }}>
            {build.techniques.map((tech) => (
              <TechniqueChip key={tech} technique={tech} size="sm" />
            ))}
          </div>
        </div>
      )}
      {build.timeInvested && (
        <div className="border-t border-white/10" style={{ marginTop: cqi(12), paddingTop: cqi(10) }}>
          <span className="text-zinc-500 uppercase tracking-wider" style={{ fontSize: cqi(9) }}>Time Invested: </span>
          <span className="text-zinc-300 font-medium" style={{ fontSize: cqi(12) }}>{build.timeInvested}</span>
        </div>
      )}
    </CardShell>
  );
}

function IntentCard({ build }: { build: Build }) {
  return (
    <CardShell className="flex flex-col justify-center">
      <div className="border-l-2 border-red-500/60" style={{ paddingLeft: cqi(12) }}>
        {build.intentStatement ? (
          <>
            <p className="text-zinc-200 italic leading-relaxed" style={{ fontSize: cqi(15) }}>
              &ldquo;{build.intentStatement}&rdquo;
            </p>
            <p className="text-zinc-500" style={{ fontSize: cqi(11), marginTop: cqi(8) }}>
              &mdash; {build.username}
            </p>
          </>
        ) : (
          <p className="text-zinc-600 italic" style={{ fontSize: cqi(12) }}>
            No builder intent statement added
          </p>
        )}
      </div>
    </CardShell>
  );
}

export function MetadataElement({ element, build }: MetadataElementProps) {
  switch (element.variant) {
    case "compact":
      return <CompactCard build={build} />;
    case "full":
      return <FullCard build={build} />;
    case "stats":
      return <StatsCard build={build} />;
    case "description":
      return <DescriptionCard build={build} />;
    case "paint":
      return <PaintCard build={build} />;
    case "tools":
      return <ToolsCard build={build} />;
    case "intent":
      return <IntentCard build={build} />;
    default:
      return <FullCard build={build} />;
  }
}
