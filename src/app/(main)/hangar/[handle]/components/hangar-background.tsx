"use client";

import { HANGAR_THEMES } from "./theme-config";
import type { ThemeKey } from "./theme-config";

interface HangarBackgroundProps {
  theme: ThemeKey;
  accentColor: string | null;
}

export function HangarBackground({ theme, accentColor }: HangarBackgroundProps) {
  const config = HANGAR_THEMES[theme];
  const gridColor = accentColor || config.gridColor;
  const gridOpacity = config.gridOpacity;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{ background: config.bgGradient }}
      />

      {/* Grid lines */}
      <div
        className="absolute inset-0"
        style={{
          opacity: gridOpacity,
          backgroundImage: [
            `repeating-linear-gradient(0deg, ${gridColor} 0px, ${gridColor} 1px, transparent 1px, transparent 80px)`,
            `repeating-linear-gradient(90deg, ${gridColor} 0px, ${gridColor} 1px, transparent 1px, transparent 80px)`,
          ].join(", "),
        }}
      />

      {/* Scan line effect (for themes that support it) */}
      {config.scanLine && <div className="scan-line" />}

      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* NEON_TOKYO rain streaks */}
      {theme === "NEON_TOKYO" && (
        <>
          <style>{`
            @keyframes neon-rain {
              0% { transform: translateY(-100%); }
              100% { transform: translateY(100vh); }
            }
            .neon-rain-streak {
              position: absolute;
              width: 1px;
              background: linear-gradient(180deg, transparent, ${gridColor}40, transparent);
              pointer-events: none;
              opacity: 0.3;
            }
          `}</style>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="neon-rain-streak"
              style={{
                left: `${(i * 5.26) + Math.random() * 2}%`,
                height: `${60 + Math.random() * 80}px`,
                animationName: "neon-rain",
                animationDuration: `${2 + Math.random() * 3}s`,
                animationDelay: `${Math.random() * 4}s`,
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
              }}
            />
          ))}
        </>
      )}

      {/* DESERT_BATTLEFIELD sand drift */}
      {theme === "DESERT_BATTLEFIELD" && (
        <>
          <style>{`
            @keyframes sand-drift {
              0% { transform: translateX(-100%) translateY(0); opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { transform: translateX(100vw) translateY(-20px); opacity: 0; }
            }
            .sand-particle {
              position: absolute;
              width: 2px;
              height: 2px;
              border-radius: 50%;
              background: ${gridColor};
              pointer-events: none;
              opacity: 0.2;
            }
          `}</style>
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="sand-particle"
              style={{
                top: `${50 + Math.random() * 50}%`,
                left: `${Math.random() * 100}%`,
                animationName: "sand-drift",
                animationDuration: `${8 + Math.random() * 12}s`,
                animationDelay: `${Math.random() * 10}s`,
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
