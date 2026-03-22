"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { Heart } from "lucide-react";
import type { Build } from "@/lib/types";
import "./showcase-view.css";

// ── Rarity based on likes (percentile-based, adapts to community size) ──

type Rarity = "C" | "R" | "SR" | "SSR" | "L";

/**
 * Calculate rarity thresholds from the actual like distribution.
 * Top 1 build → Legendary
 * Top ~5% → SSR
 * Top ~15% → SR
 * Top ~35% → R
 * Rest → C
 */
function computeThresholds(likeCounts: number[]): { l: number; ssr: number; sr: number; r: number } {
  if (likeCounts.length === 0) return { l: 1, ssr: 1, sr: 1, r: 1 };
  const sorted = [...likeCounts].sort((a, b) => b - a);
  const max = sorted[0];

  // If max is 0, everything is C
  if (max === 0) return { l: 1, ssr: 1, sr: 1, r: 1 };

  // Percentile positions
  const p = (pct: number) => sorted[Math.max(0, Math.floor(sorted.length * pct) - 1)] ?? 0;

  const l = max; // Only the very top build(s)
  const ssr = Math.max(p(0.05), Math.ceil(max * 0.85)); // Top ~5%
  const sr = Math.max(p(0.15), Math.ceil(max * 0.6));   // Top ~15%
  const r = Math.max(p(0.35), Math.ceil(max * 0.35));    // Top ~35%

  return { l, ssr, sr, r };
}

function getRarity(likes: number, thresholds: { l: number; ssr: number; sr: number; r: number }): Rarity {
  if (likes >= thresholds.l) return "L";
  if (likes >= thresholds.ssr) return "SSR";
  if (likes >= thresholds.sr) return "SR";
  if (likes >= thresholds.r) return "R";
  return "C";
}

const RARITY_LABELS: Record<Rarity, string> = {
  C: "C", R: "R", SR: "SR", SSR: "SSR", L: "LEGEND",
};

const RARITY_BADGE_STYLES: Record<Rarity, React.CSSProperties> = {
  C: { color: "#8ab4c9", borderColor: "rgba(138,180,201,0.35)" },
  R: { color: "#a78bfa", borderColor: "rgba(167,139,250,0.45)" },
  SR: { color: "#fcd34d", borderColor: "rgba(252,211,77,0.5)" },
  SSR: { color: "#f87171", borderColor: "rgba(248,113,113,0.55)" },
  L: { color: "#86efac", borderColor: "rgba(134,239,172,0.6)" },
};

// ── Component ──

interface ShowcaseViewProps {
  builds: Build[];
  likeCounts: Record<string, number>;
}

export function ShowcaseView({ builds, likeCounts }: ShowcaseViewProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  // Sort by likes descending
  const sorted = [...builds].sort((a, b) => {
    const aLikes = likeCounts[a.id] ?? a.likes;
    const bLikes = likeCounts[b.id] ?? b.likes;
    return bLikes - aLikes;
  });

  // Compute rarity thresholds from actual data
  const allLikeCounts = sorted.map((b) => likeCounts[b.id] ?? b.likes);
  const thresholds = computeThresholds(allLikeCounts);

  // Holographic tilt effect
  const setupTilt = useCallback(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll<HTMLElement>(".showcase-card");

    cards.forEach((card) => {
      const inner = card.querySelector<HTMLElement>(".showcase-card-inner");
      const holo = card.querySelector<HTMLElement>(".showcase-card-holo");
      const border = card.querySelector<HTMLElement>(".showcase-card-border");
      if (!inner) return;

      const onMove = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        inner.style.transform = `perspective(800px) rotateY(${dx * 14}deg) rotateX(${-dy * 10}deg) scale3d(1.04,1.04,1.04)`;

        const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
        if (holo) holo.style.setProperty("--holo-angle", `${angle}deg`);
        if (border) border.style.setProperty("--holo-angle", `${angle}deg`);
      };

      const onLeave = () => {
        inner.style.transform = "";
        inner.style.transition = "transform 0.4s cubic-bezier(0.23,1,0.32,1)";
        setTimeout(() => { inner.style.transition = "transform 0.15s ease"; }, 400);
      };

      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);

      // Legendary continuous holo animation
      if (card.dataset.rarity === "L" && holo && border) {
        let t = 0;
        const tick = () => {
          t += 0.4;
          holo.style.setProperty("--holo-angle", `${t}deg`);
          border.style.setProperty("--holo-angle", `${t}deg`);
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    });
  }, []);

  useEffect(() => {
    // Small delay to let cards render
    const timer = setTimeout(setupTilt, 100);
    return () => clearTimeout(timer);
  }, [setupTilt, sorted.length]);

  return (
    <div>
      {/* Section label */}
      <div className="flex items-center gap-4 mb-6">
        <span className="font-rajdhani text-[11px] font-bold tracking-[3px] uppercase text-gx-red whitespace-nowrap">
          Featured Builds
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-gx-red/40 to-transparent" />
      </div>

      <div ref={gridRef} className="showcase-grid">
        {sorted.map((build, idx) => {
          const likes = likeCounts[build.id] ?? build.likes;
          const rarity = getRarity(likes, thresholds);
          const primaryImage = build.images.find((img) => img.isPrimary) || build.images[0];
          const isFeatured = idx === 0;

          return (
            <Link
              key={build.id}
              href={`/builds/${build.slug}`}
              className={`showcase-card${isFeatured ? " featured" : ""}`}
              data-rarity={rarity}
              style={{ animationDelay: `${Math.min(idx, 20) * 60}ms` }}
            >
              <div className="showcase-card-border" />
              <div className="showcase-card-inner">
                {/* Card number watermark */}
                <span
                  className="absolute top-2.5 left-1/2 -translate-x-1/2 z-[6] font-mono text-[8px] text-white/25 tracking-[2px]"
                >
                  GX-{String(idx + 1).padStart(3, "0")}
                </span>

                {/* Grade badge */}
                <span className="absolute top-2.5 left-2.5 z-[5] font-mono text-[9px] font-bold tracking-[1px] uppercase px-2 py-0.5 rounded bg-black/70 border border-white/15 backdrop-blur-sm text-white">
                  {build.grade} · {build.scale}
                </span>

                {/* Rarity badge */}
                <span
                  className="absolute top-2.5 right-2.5 z-[5] font-mono text-[8px] font-bold tracking-[1.5px] uppercase px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm border"
                  style={RARITY_BADGE_STYLES[rarity]}
                >
                  {RARITY_LABELS[rarity]}
                </span>

                {/* WIP badge */}
                {build.status === "WIP" && (
                  <span className="absolute top-9 right-2.5 z-[6] font-mono text-[7px] font-bold tracking-[1.5px] uppercase px-1.5 py-0.5 rounded bg-amber-400/15 border border-amber-400/40 text-amber-400">
                    WIP
                  </span>
                )}

                {/* Corner decorations */}
                <div className="showcase-corner tl" />
                <div className="showcase-corner tr" />
                <div className="showcase-corner bl" />
                <div className="showcase-corner br" />

                {/* Image */}
                <div className="showcase-card-image">
                  {primaryImage && (
                    <Image
                      src={primaryImage.url}
                      alt={build.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="showcase-card-img"
                      style={primaryImage.objectPosition ? { objectPosition: primaryImage.objectPosition } : undefined}
                    />
                  )}
                  <div className="showcase-card-overlay" />
                  <div className="showcase-card-holo" />
                </div>

                {/* Info */}
                <div className="showcase-card-info">
                  {/* Technique tags */}
                  {build.techniques.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {build.techniques.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="font-rajdhani text-[9px] font-semibold tracking-[0.8px] uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/55 border border-white/10"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  <h3 className="font-rajdhani text-[15px] font-bold tracking-[0.5px] text-white leading-tight truncate">
                    {build.title}
                  </h3>
                  <p className="text-[11px] text-white/50 tracking-[0.3px] truncate mb-2.5">
                    {build.kitName} · {build.grade} {build.scale}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-gx-red to-purple-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0 overflow-hidden">
                        {build.userAvatar ? (
                          <Image src={build.userAvatar} alt={build.username} width={22} height={22} className="object-cover" />
                        ) : (
                          build.username.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <span className="text-[11px] text-white/60 truncate">{build.username}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-white/60 shrink-0">
                      <Heart className="h-3 w-3" />
                      {likes}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
