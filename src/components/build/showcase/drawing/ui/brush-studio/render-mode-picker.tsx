"use client";

import { cn } from "@/lib/utils";
import type { RenderMode } from "../../engine/brush-types";

const RENDER_MODES: { value: RenderMode; label: string; description: string }[] = [
  { value: "normal", label: "Normal", description: "Standard source-over per dab" },
  { value: "buildup", label: "Buildup", description: "Multiply composite per stroke" },
  { value: "wet", label: "Wet", description: "Samples underlying color" },
];

const BLEND_MODES: { value: GlobalCompositeOperation; label: string }[] = [
  { value: "source-over", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "darken", label: "Darken" },
  { value: "lighten", label: "Lighten" },
  { value: "color-dodge", label: "Color Dodge" },
  { value: "color-burn", label: "Color Burn" },
  { value: "hard-light", label: "Hard Light" },
  { value: "soft-light", label: "Soft Light" },
  { value: "difference", label: "Difference" },
  { value: "exclusion", label: "Exclusion" },
  { value: "lighter", label: "Add/Glow" },
];

const SLIDER_CLASS =
  "flex-1 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500";

interface RenderModePickerProps {
  renderMode: RenderMode;
  blendMode: GlobalCompositeOperation;
  stabilization: number;
  isEraser: boolean;
  smudgeStrength: number;
  onChange: (values: {
    renderMode?: RenderMode;
    blendMode?: GlobalCompositeOperation;
    stabilization?: number;
    isEraser?: boolean;
    smudgeStrength?: number;
  }) => void;
}

export function RenderModePicker({
  renderMode,
  blendMode,
  stabilization,
  isEraser,
  smudgeStrength,
  onChange,
}: RenderModePickerProps) {
  return (
    <div className="space-y-3">
      {/* Render Mode toggle buttons */}
      <div>
        <label className="text-[10px] text-zinc-500 mb-1.5 block">Render Mode</label>
        <div className="flex gap-1">
          {RENDER_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => onChange({ renderMode: mode.value })}
              title={mode.description}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs transition-colors",
                renderMode === mode.value
                  ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700"
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Blend Mode dropdown */}
      <div>
        <label className="text-[10px] text-zinc-500 mb-1.5 block">Blend Mode</label>
        <select
          value={blendMode}
          onChange={(e) =>
            onChange({ blendMode: e.target.value as GlobalCompositeOperation })
          }
          className="w-full bg-zinc-800 text-xs text-zinc-300 border border-zinc-700 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {BLEND_MODES.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
      </div>

      {/* Stabilization slider */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] text-zinc-500">Stabilization</label>
          <span className="text-[10px] text-zinc-400">{stabilization}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            value={stabilization}
            onChange={(e) => onChange({ stabilization: parseInt(e.target.value) })}
            className={SLIDER_CLASS}
          />
        </div>
      </div>

      {/* Eraser toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="eraser-toggle"
          checked={isEraser}
          onChange={(e) => onChange({ isEraser: e.target.checked })}
          className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
        />
        <label
          htmlFor="eraser-toggle"
          className="text-xs text-zinc-300 cursor-pointer select-none"
        >
          Eraser
        </label>
      </div>

      {/* Smudge Strength — only visible when wet mode */}
      {renderMode === "wet" && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] text-zinc-500">Smudge Strength</label>
            <span className="text-[10px] text-zinc-400">
              {Math.round(smudgeStrength * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(smudgeStrength * 100)}
              onChange={(e) =>
                onChange({ smudgeStrength: parseInt(e.target.value) / 100 })
              }
              className={SLIDER_CLASS}
            />
          </div>
        </div>
      )}
    </div>
  );
}
