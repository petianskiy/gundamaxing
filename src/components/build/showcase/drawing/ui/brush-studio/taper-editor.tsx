"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface TaperEditorProps {
  taperStart: number;
  taperEnd: number;
  taperSizeMin: number;
  onChange: (values: {
    taperStart: number;
    taperEnd: number;
    taperSizeMin: number;
  }) => void;
}

const sliderClassName =
  "flex-1 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500";

export function TaperEditor({
  taperStart,
  taperEnd,
  taperSizeMin,
  onChange,
}: TaperEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const halfH = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Draw tapered stroke shape
    ctx.beginPath();
    ctx.fillStyle = "#a1a1aa"; // zinc-400

    const steps = 100;
    // Top edge (going left to right)
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = t * w;

      // Calculate thickness multiplier at this point
      let thickness = 1;
      if (taperStart > 0 && t < taperStart) {
        // In taper-in region: interpolate from taperSizeMin to 1
        thickness = taperSizeMin + (1 - taperSizeMin) * (t / taperStart);
      } else if (taperEnd > 0 && t > 1 - taperEnd) {
        // In taper-out region: interpolate from 1 to taperSizeMin
        const taperT = (t - (1 - taperEnd)) / taperEnd;
        thickness = 1 - (1 - taperSizeMin) * taperT;
      }

      const yOffset = halfH * thickness * 0.8;
      if (i === 0) {
        ctx.moveTo(x, halfH - yOffset);
      } else {
        ctx.lineTo(x, halfH - yOffset);
      }
    }

    // Bottom edge (going right to left)
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const x = t * w;

      let thickness = 1;
      if (taperStart > 0 && t < taperStart) {
        thickness = taperSizeMin + (1 - taperSizeMin) * (t / taperStart);
      } else if (taperEnd > 0 && t > 1 - taperEnd) {
        const taperT = (t - (1 - taperEnd)) / taperEnd;
        thickness = 1 - (1 - taperSizeMin) * taperT;
      }

      const yOffset = halfH * thickness * 0.8;
      ctx.lineTo(x, halfH + yOffset);
    }

    ctx.closePath();
    ctx.fill();
  }, [taperStart, taperEnd, taperSizeMin]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  function update(patch: Partial<{
    taperStart: number;
    taperEnd: number;
    taperSizeMin: number;
  }>) {
    onChange({
      taperStart,
      taperEnd,
      taperSizeMin,
      ...patch,
    });
  }

  return (
    <div className="space-y-1.5">
      {/* Start Taper */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 w-14">Start Taper</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={taperStart}
          onChange={(e) => update({ taperStart: parseFloat(e.target.value) })}
          className={sliderClassName}
        />
        <span className="text-[10px] text-zinc-400 w-8 text-right">
          {taperStart.toFixed(2)}
        </span>
      </div>

      {/* End Taper */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 w-14">End Taper</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={taperEnd}
          onChange={(e) => update({ taperEnd: parseFloat(e.target.value) })}
          className={sliderClassName}
        />
        <span className="text-[10px] text-zinc-400 w-8 text-right">
          {taperEnd.toFixed(2)}
        </span>
      </div>

      {/* Min Size */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 w-14">Min Size</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={taperSizeMin}
          onChange={(e) => update({ taperSizeMin: parseFloat(e.target.value) })}
          className={sliderClassName}
        />
        <span className="text-[10px] text-zinc-400 w-8 text-right">
          {taperSizeMin.toFixed(2)}
        </span>
      </div>

      {/* Visual preview */}
      <canvas
        ref={canvasRef}
        width={160}
        height={30}
        className="rounded border border-zinc-700"
      />
    </div>
  );
}
