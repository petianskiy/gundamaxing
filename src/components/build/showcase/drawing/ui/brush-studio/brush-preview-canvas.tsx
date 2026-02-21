"use client";

import { useEffect, useRef, useCallback } from "react";
import type { BrushPreset, DabParams } from "../../engine/brush-types";
import { lerp, clamp } from "../../engine/brush-types";
import { renderDab, preloadPresetAssets } from "../../engine/stamp-renderer";
import { cn } from "@/lib/utils";

interface BrushPreviewCanvasProps {
  preset: BrushPreset;
  color: string;
  size: number;
  className?: string;
}

// Canvas logical dimensions
const WIDTH = 200;
const HEIGHT = 60;
// Retina backing scale
const DPR = 2;

/**
 * S-curve control points (cubic bezier).
 * Start lower-left, curve up, then sweep to upper-right.
 */
const CURVE_START = { x: 15, y: 45 };
const CURVE_CP1 = { x: 65, y: 70 };
const CURVE_CP2 = { x: 135, y: -10 };
const CURVE_END = { x: 185, y: 15 };

/** Evaluate a cubic bezier at parameter t (0-1) */
function cubicBezier(
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number
): number {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

/** Simulate pressure along the stroke: ramp up then ramp down */
function simulatePressure(t: number): number {
  // bell-like curve: 0 at edges, 1 at center
  // Use sin for smooth ramp
  return Math.sin(t * Math.PI);
}

/** Evaluate a dynamics config given a simulated pressure value (0-1) */
function evalDynamics(
  dynamics: BrushPreset["sizeDynamics"],
  pressure: number
): number {
  return lerp(dynamics.pressureMin, dynamics.pressureMax, pressure);
}

/** Compute taper multiplier given stroke position and preset */
function taperMultiplier(
  t: number,
  taperStart: number,
  taperEnd: number,
  taperSizeMin: number
): number {
  let taper = 1;
  if (taperStart > 0 && t < taperStart) {
    taper = lerp(taperSizeMin, 1, t / taperStart);
  }
  if (taperEnd > 0 && t > 1 - taperEnd) {
    taper = Math.min(taper, lerp(taperSizeMin, 1, (1 - t) / taperEnd));
  }
  return taper;
}

/** Simple seeded random for deterministic jitter */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function BrushPreviewCanvas({
  preset,
  color,
  size,
  className,
}: BrushPreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mountedRef = useRef(true);

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.save();
    if (preset.isEraser) {
      // Light background so erasing effect is visible
      ctx.fillStyle = "#d4d4d8"; // zinc-300
    } else {
      ctx.fillStyle = "#18181b"; // zinc-900
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Scale for DPR
    ctx.save();
    ctx.scale(DPR, DPR);

    // For eraser preview, first fill a solid color layer to erase from
    if (preset.isEraser) {
      ctx.fillStyle = color || "#a1a1aa";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    // Clamp brush size for the preview (so it fits nicely)
    const previewSize = clamp(size, 2, 40);

    // Calculate spacing in pixels
    const spacingPx = Math.max(1, (previewSize * preset.spacing) / 100);

    // Approximate curve length by sampling
    const SAMPLE_COUNT = 200;
    let totalLength = 0;
    let prevX = CURVE_START.x;
    let prevY = CURVE_START.y;

    for (let i = 1; i <= SAMPLE_COUNT; i++) {
      const t = i / SAMPLE_COUNT;
      const cx = cubicBezier(t, CURVE_START.x, CURVE_CP1.x, CURVE_CP2.x, CURVE_END.x);
      const cy = cubicBezier(t, CURVE_START.y, CURVE_CP1.y, CURVE_CP2.y, CURVE_END.y);
      totalLength += Math.hypot(cx - prevX, cy - prevY);
      prevX = cx;
      prevY = cy;
    }

    // Walk the curve, placing dabs at spacing intervals
    let distAccum = 0;
    let walkPrevX = CURVE_START.x;
    let walkPrevY = CURVE_START.y;
    let dabIndex = 0;

    for (let i = 1; i <= SAMPLE_COUNT; i++) {
      const t = i / SAMPLE_COUNT;
      const cx = cubicBezier(t, CURVE_START.x, CURVE_CP1.x, CURVE_CP2.x, CURVE_END.x);
      const cy = cubicBezier(t, CURVE_START.y, CURVE_CP1.y, CURVE_CP2.y, CURVE_END.y);
      const segLen = Math.hypot(cx - walkPrevX, cy - walkPrevY);
      distAccum += segLen;

      while (distAccum >= spacingPx) {
        distAccum -= spacingPx;

        // Interpolate back to the exact dab position
        const overshoot = distAccum / segLen;
        const dabX = lerp(cx, walkPrevX, overshoot);
        const dabY = lerp(cy, walkPrevY, overshoot);

        // Stroke position (0-1)
        const strokeT = clamp(
          (t * totalLength - distAccum) / totalLength,
          0,
          1
        );

        // Simulated pressure
        const pressure = simulatePressure(strokeT);

        // Evaluate dynamics
        const dynSize = evalDynamics(preset.sizeDynamics, pressure);
        const dynOpacity = evalDynamics(preset.opacityDynamics, pressure);
        const dynFlow = evalDynamics(preset.flowDynamics, pressure);

        // Taper
        const taper = taperMultiplier(
          strokeT,
          preset.taperStart,
          preset.taperEnd,
          preset.taperSizeMin
        );

        // Final size with dynamics and taper
        let dabSize = previewSize * dynSize * taper;

        // Jitter size
        if (preset.jitterSize > 0) {
          const rand = seededRandom(dabIndex * 7 + 1);
          const jitterFactor = 1 + (rand - 0.5) * 2 * (preset.jitterSize / 100);
          dabSize *= clamp(jitterFactor, 0.1, 3);
        }

        // Final opacity
        let dabOpacity = clamp(dynOpacity, 0, 1);
        if (preset.jitterOpacity > 0) {
          const rand = seededRandom(dabIndex * 13 + 3);
          dabOpacity *= clamp(1 - rand * (preset.jitterOpacity / 100), 0, 1);
        }

        // Final flow
        const dabFlow = clamp(dynFlow, 0, 1);

        // Rotation jitter
        let dabRotation = 0;
        if (preset.jitterRotation > 0) {
          const rand = seededRandom(dabIndex * 19 + 5);
          dabRotation = (rand - 0.5) * 2 * preset.jitterRotation;
        }

        // Scatter (perpendicular offset)
        let finalX = dabX;
        let finalY = dabY;
        if (preset.scatter > 0) {
          const rand = seededRandom(dabIndex * 23 + 7);
          const scatterAmount = (rand - 0.5) * 2 * (preset.scatter / 100) * previewSize;
          // Perpendicular to stroke direction
          const dx = cx - walkPrevX;
          const dy = cy - walkPrevY;
          const len = Math.hypot(dx, dy);
          if (len > 0.001) {
            finalX += (-dy / len) * scatterAmount;
            finalY += (dx / len) * scatterAmount;
          }
        }

        const dab: DabParams = {
          x: finalX,
          y: finalY,
          size: Math.max(1, dabSize),
          opacity: dabOpacity,
          flow: dabFlow,
          rotation: dabRotation,
          strokePosition: strokeT,
        };

        renderDab(ctx, dab, color, preset);
        dabIndex++;
      }

      walkPrevX = cx;
      walkPrevY = cy;
    }

    ctx.restore();
  }, [preset, color, size]);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    async function init() {
      await preloadPresetAssets(preset);
      // Short delay to let image decoding settle
      await new Promise((r) => setTimeout(r, 30));
      if (!cancelled && mountedRef.current) {
        drawPreview();
      }
    }

    init();

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [preset, color, size, drawPreview]);

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH * DPR}
      height={HEIGHT * DPR}
      className={cn("rounded-lg", className)}
      style={{ width: WIDTH, height: HEIGHT }}
    />
  );
}
