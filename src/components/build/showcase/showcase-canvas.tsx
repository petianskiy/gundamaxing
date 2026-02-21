"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { ShowcaseElement } from "./showcase-element";
import { isWebGLPreset } from "./backgrounds";
import type { Build, ShowcaseLayout } from "@/lib/types";

// ─── WebGL Background Components (lazy, SSR-safe) ──────────────

const FaultyTerminal = dynamic(
  () => import("./backgrounds/faulty-terminal").then((m) => m.FaultyTerminal),
  { ssr: false },
);

const Grainient = dynamic(
  () => import("./backgrounds/grainient").then((m) => m.Grainient),
  { ssr: false },
);

// ─── Preset Background Styles ───────────────────────────────────

interface ShowcaseCanvasProps {
  layout: ShowcaseLayout;
  build: Build;
}

const PRESET_STYLES: Record<string, React.CSSProperties> = {
  "preset:noise": {
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E")`,
    backgroundSize: "200px 200px",
  },
  "preset:grid": {
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
  },
  "preset:gradient-dark": {
    background: "linear-gradient(135deg, #0f0f12 0%, #1a1a2e 50%, #0f0f12 100%)",
  },
  "preset:gradient-red": {
    background: "linear-gradient(135deg, #0f0f12 0%, #3b0d0d 50%, #0f0f12 100%)",
  },
};

export function ShowcaseCanvas({ layout, build }: ShowcaseCanvasProps) {
  const { canvas, elements } = layout;
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  const bgUrl = canvas.backgroundImageUrl;
  const bgOpacity = canvas.backgroundOpacity;
  const bgBlurStyle = canvas.backgroundBlur > 0 ? `blur(${canvas.backgroundBlur}px)` : undefined;

  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: canvas.aspectRatio || "4 / 5" }}>
      {/* Solid color background */}
      {canvas.backgroundColor && !bgUrl && (
        <div
          className="absolute inset-0 z-0"
          style={{ backgroundColor: canvas.backgroundColor }}
        />
      )}

      {/* WebGL preset backgrounds */}
      {bgUrl === "preset:faulty-terminal" && (
        <div className="absolute inset-0 z-0" style={{ opacity: bgOpacity, filter: bgBlurStyle }}>
          <FaultyTerminal />
        </div>
      )}
      {bgUrl === "preset:grainient" && (
        <div className="absolute inset-0 z-0" style={{ opacity: bgOpacity, filter: bgBlurStyle }}>
          <Grainient />
        </div>
      )}

      {/* CSS preset backgrounds */}
      {bgUrl?.startsWith("preset:") && !isWebGLPreset(bgUrl) && (
        <div
          className="absolute inset-0 z-0"
          style={{
            ...PRESET_STYLES[bgUrl],
            opacity: bgOpacity,
          }}
        />
      )}

      {/* Image background */}
      {bgUrl && !bgUrl.startsWith("preset:") && (
        <div className="absolute inset-0 z-0">
          <Image
            src={bgUrl}
            alt="Showcase background"
            fill
            className="object-cover"
            style={{
              opacity: bgOpacity,
              filter: bgBlurStyle,
            }}
            unoptimized
          />
        </div>
      )}

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 z-[1] bg-black/20" />

      {/* Elements */}
      {sortedElements.map((element) => (
        <div
          key={element.id}
          className="absolute"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            width: `${element.width}%`,
            height: `${element.height}%`,
            zIndex: element.zIndex + 2,
            transform: element.rotation !== 0 ? `rotate(${element.rotation}deg)` : undefined,
          }}
        >
          <ShowcaseElement element={element} build={build} />
        </div>
      ))}

      {/* Empty state */}
      {elements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-zinc-500 text-sm">Empty showcase</p>
        </div>
      )}
    </div>
  );
}
