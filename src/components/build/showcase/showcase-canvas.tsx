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

const WarSmoke = dynamic(
  () => import("./backgrounds/war-smoke").then((m) => m.WarSmoke),
  { ssr: false },
);

// ─── Preset Background Styles ───────────────────────────────────

interface ShowcaseCanvasProps {
  layout: ShowcaseLayout;
  build: Build;
}

const PRESET_STYLES: Record<string, React.CSSProperties> = {
  "preset:grid": {
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
  },
};

export function ShowcaseCanvas({ layout, build }: ShowcaseCanvasProps) {
  const { canvas, elements } = layout;
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  const bgUrl = canvas.backgroundImageUrl;
  const bgOpacity = canvas.backgroundOpacity;
  const bgBlurStyle = canvas.backgroundBlur > 0 ? `blur(${canvas.backgroundBlur}px)` : undefined;
  const bgConfig = (canvas.backgroundConfig ?? {}) as Record<string, unknown>;

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
          <FaultyTerminal
            scale={(bgConfig.scale as number) ?? 3}
            gridMul={(bgConfig.gridMul as [number, number]) ?? [2, 1]}
            digitSize={(bgConfig.digitSize as number) ?? 2.5}
            timeScale={(bgConfig.timeScale as number) ?? 0.5}
            pause={false}
            scanlineIntensity={(bgConfig.scanlineIntensity as number) ?? 0.5}
            glitchAmount={(bgConfig.glitchAmount as number) ?? 1}
            flickerAmount={(bgConfig.flickerAmount as number) ?? 1}
            noiseAmp={(bgConfig.noiseAmp as number) ?? 0.7}
            chromaticAberration={(bgConfig.chromaticAberration as number) ?? 0}
            dither={(bgConfig.dither as number) ?? 0}
            curvature={(bgConfig.curvature as number) ?? 0.1}
            tint={(bgConfig.tint as string) ?? "#d357fe"}
            mouseReact={(bgConfig.mouseReact as boolean) ?? true}
            mouseStrength={(bgConfig.mouseStrength as number) ?? 0.5}
            pageLoadAnimation
            brightness={(bgConfig.brightness as number) ?? 0.6}
          />
        </div>
      )}
      {bgUrl === "preset:grainient" && (
        <div className="absolute inset-0 z-0" style={{ opacity: bgOpacity, filter: bgBlurStyle }}>
          <Grainient
            color1={(bgConfig.color1 as string) ?? "#FF9FFC"}
            color2={(bgConfig.color2 as string) ?? "#785700"}
            color3={(bgConfig.color3 as string) ?? "#B19EEF"}
            timeSpeed={(bgConfig.timeSpeed as number) ?? 0.25}
            colorBalance={(bgConfig.colorBalance as number) ?? 0}
            warpStrength={(bgConfig.warpStrength as number) ?? 1}
            warpFrequency={(bgConfig.warpFrequency as number) ?? 5}
            warpSpeed={(bgConfig.warpSpeed as number) ?? 2}
            warpAmplitude={(bgConfig.warpAmplitude as number) ?? 50}
            blendAngle={(bgConfig.blendAngle as number) ?? 0}
            blendSoftness={(bgConfig.blendSoftness as number) ?? 0.05}
            rotationAmount={(bgConfig.rotationAmount as number) ?? 500}
            noiseScale={(bgConfig.noiseScale as number) ?? 2}
            grainAmount={(bgConfig.grainAmount as number) ?? 0.1}
            grainScale={(bgConfig.grainScale as number) ?? 2}
            grainAnimated={(bgConfig.grainAnimated as boolean) ?? false}
            contrast={(bgConfig.contrast as number) ?? 1.5}
            gamma={(bgConfig.gamma as number) ?? 1}
            saturation={(bgConfig.saturation as number) ?? 1}
            centerX={(bgConfig.centerX as number) ?? 0}
            centerY={(bgConfig.centerY as number) ?? 0}
            zoom={(bgConfig.zoom as number) ?? 0.9}
          />
        </div>
      )}
      {bgUrl === "preset:war-smoke" && (
        <div className="absolute inset-0 z-0" style={{ opacity: bgOpacity, filter: bgBlurStyle }}>
          <WarSmoke
            color={(bgConfig.color as string) ?? "#ff8647"}
            brightness={(bgConfig.brightness as number) ?? 2}
            edgeIntensity={(bgConfig.edgeIntensity as number) ?? 0}
            trailLength={(bgConfig.trailLength as number) ?? 50}
            inertia={(bgConfig.inertia as number) ?? 0.5}
            grainIntensity={(bgConfig.grainIntensity as number) ?? 0.05}
            bloomStrength={(bgConfig.bloomStrength as number) ?? 0.1}
            bloomRadius={(bgConfig.bloomRadius as number) ?? 1}
            bloomThreshold={(bgConfig.bloomThreshold as number) ?? 0.025}
            fadeDelayMs={(bgConfig.fadeDelayMs as number) ?? 1000}
            fadeDurationMs={(bgConfig.fadeDurationMs as number) ?? 1500}
          />
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
