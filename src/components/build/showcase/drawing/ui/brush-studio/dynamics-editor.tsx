"use client";

import { useCallback, useEffect, useRef } from "react";
import type { DynamicsConfig } from "../../engine/brush-types";
import { cn } from "@/lib/utils";

interface DynamicsEditorProps {
  label: string;
  value: DynamicsConfig;
  onChange: (value: DynamicsConfig) => void;
  min?: number;
  max?: number;
  step?: number;
}

const sliderClassName =
  "flex-1 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500";

export function DynamicsEditor({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
}: DynamicsEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCurve = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = "#27272a"; // zinc-800
    ctx.fillRect(0, 0, w, h);

    // Pressure curve line
    ctx.beginPath();
    ctx.strokeStyle = "#60a5fa"; // blue-400
    ctx.lineWidth = 1.5;

    // Normalize pressureMin/Max to 0-1 range for the preview
    const normalizedMin = (value.pressureMin - min) / (max - min);
    const normalizedMax = (value.pressureMax - min) / (max - min);

    ctx.moveTo(0, h - normalizedMin * h);
    ctx.lineTo(w, h - normalizedMax * h);
    ctx.stroke();
  }, [value.pressureMin, value.pressureMax, min, max]);

  useEffect(() => {
    drawCurve();
  }, [drawCurve]);

  function update(patch: Partial<DynamicsConfig>) {
    onChange({ ...value, ...patch });
  }

  return (
    <div className="space-y-1.5">
      {/* Header */}
      <p className="text-[10px] font-medium text-zinc-400">{label}</p>

      {/* Min / Max sliders side by side */}
      <div className="flex gap-2">
        {/* Min */}
        <div className="flex-1 flex items-center gap-1">
          <span className="text-[10px] text-zinc-500">Min</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value.pressureMin}
            onChange={(e) => update({ pressureMin: parseFloat(e.target.value) })}
            className={sliderClassName}
          />
          <span className="text-[10px] text-zinc-400 w-8 text-right">
            {value.pressureMin.toFixed(2)}
          </span>
        </div>

        {/* Max */}
        <div className="flex-1 flex items-center gap-1">
          <span className="text-[10px] text-zinc-500">Max</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value.pressureMax}
            onChange={(e) => update({ pressureMax: parseFloat(e.target.value) })}
            className={sliderClassName}
          />
          <span className="text-[10px] text-zinc-400 w-8 text-right">
            {value.pressureMax.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Velocity slider */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 w-10">Velocity</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value.velocityInfluence}
          onChange={(e) =>
            update({ velocityInfluence: parseFloat(e.target.value) })
          }
          className={sliderClassName}
        />
        <span className="text-[10px] text-zinc-400 w-8 text-right">
          {value.velocityInfluence.toFixed(2)}
        </span>
      </div>

      {/* Tilt slider */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 w-10">Tilt</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value.tiltInfluence}
          onChange={(e) =>
            update({ tiltInfluence: parseFloat(e.target.value) })
          }
          className={sliderClassName}
        />
        <span className="text-[10px] text-zinc-400 w-8 text-right">
          {value.tiltInfluence.toFixed(2)}
        </span>
      </div>

      {/* Mini curve preview */}
      <canvas
        ref={canvasRef}
        width={80}
        height={40}
        className="rounded border border-zinc-700"
      />
    </div>
  );
}
