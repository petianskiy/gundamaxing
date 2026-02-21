"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BrushPreset, BrushCategory } from "../engine/brush-types";
import { clamp } from "../engine/brush-types";
import { CATEGORY_META, getPresetsByCategory, searchPresets } from "../brushes/presets";
import { preloadCategoryAssets } from "../engine/stamp-renderer";
import { EditableValue } from "./editable-value";

// ─── Preview dab renderer ───────────────────────────────────────
// Simplified dab renderer for brush thumbnails.

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawPreviewDab(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  preset: BrushPreset,
  color: string
): void {
  if (size < 0.5) return;

  const rx = size / 2;
  const ry = rx * clamp(preset.roundness, 0.1, 1);
  const angle = preset.angle * (Math.PI / 180);

  ctx.save();
  ctx.globalAlpha = 0.85;

  // Use the preset's blend mode for preview (lighter → additive glow, etc.)
  if (!preset.isEraser && preset.blendMode !== "source-over") {
    ctx.globalCompositeOperation = preset.blendMode;
  }

  ctx.translate(x, y);
  if (Math.abs(angle) > 0.001) ctx.rotate(angle);

  if (preset.hardness >= 0.85 || size < 3) {
    ctx.fillStyle = color;
    if (preset.shape === "square") {
      ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const innerR = Math.max(rx, ry) * Math.max(0, preset.hardness);
    const outerR = Math.max(rx, ry);
    const gradient = ctx.createRadialGradient(0, 0, innerR, 0, 0, outerR);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = gradient;
    if (preset.shape === "square") {
      ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Simulate grain as speckled alpha punch-out
  if (preset.grainIntensity > 0.1) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.globalAlpha = clamp(preset.grainIntensity * 0.6, 0, 0.7);
    const speckleCount = Math.round(8 + preset.grainIntensity * 20);
    for (let i = 0; i < speckleCount; i++) {
      const sx = (Math.random() - 0.5) * rx * 2;
      const sy = (Math.random() - 0.5) * ry * 2;
      const sr = Math.random() * size * 0.12 + 0.3;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// ─── Panel Component ────────────────────────────────────────────

interface BrushSettingsPanelProps {
  activeBrushId: string;
  onSelectBrush: (id: string) => void;
  brushSize: number;
  onSetSize: (size: number) => void;
  brushOpacity: number;
  onSetOpacity: (opacity: number) => void;
  onClose: () => void;
  onOpenStudio?: () => void;
  onEditPreset?: (preset: BrushPreset) => void;
}

export function BrushSettingsPanel({
  activeBrushId,
  onSelectBrush,
  brushSize,
  onSetSize,
  brushOpacity,
  onSetOpacity,
  onClose,
  onOpenStudio,
  onEditPreset,
}: BrushSettingsPanelProps) {
  const [activeCategory, setActiveCategory] = useState<BrushCategory>("pencils");
  const [searchQuery, setSearchQuery] = useState("");

  // Preload brush assets when category changes
  useEffect(() => {
    const presets = getPresetsByCategory(activeCategory);
    preloadCategoryAssets(presets).catch(() => {});
  }, [activeCategory]);

  const displayPresets = useMemo(() => {
    if (searchQuery.trim()) {
      return searchPresets(searchQuery);
    }
    return getPresetsByCategory(activeCategory);
  }, [activeCategory, searchQuery]);

  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-20 sm:left-16 z-[10001] w-full sm:w-72 bg-zinc-900 border-t sm:border border-zinc-700 sm:rounded-xl rounded-t-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <h3 className="text-sm font-semibold text-white">Brushes</h3>
        <div className="flex items-center gap-2">
          {onOpenStudio && (
            <button
              onClick={onOpenStudio}
              className="text-[10px] px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              + New
            </button>
          )}
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Size + Opacity sliders */}
      <div className="px-4 py-2 border-b border-zinc-800 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 w-8">Size</span>
          <input
            type="range"
            min={1}
            max={200}
            value={brushSize}
            onChange={(e) => onSetSize(parseInt(e.target.value))}
            className="flex-1 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
          />
          <EditableValue
            value={brushSize}
            onChange={onSetSize}
            min={1}
            max={200}
            suffix="px"
            className="w-8 text-right"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 w-8">Opacity</span>
          <input
            type="range"
            min={1}
            max={100}
            value={Math.round(brushOpacity * 100)}
            onChange={(e) => onSetOpacity(parseInt(e.target.value) / 100)}
            className="flex-1 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
          />
          <EditableValue
            value={Math.round(brushOpacity * 100)}
            onChange={(v) => onSetOpacity(v / 100)}
            min={1}
            max={100}
            suffix="%"
            className="w-8 text-right"
          />
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-zinc-800">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search brushes..."
            className="w-full bg-zinc-800 text-xs text-zinc-300 pl-7 pr-2 py-1.5 rounded-lg border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Category tabs */}
      {!searchQuery && (
        <div className="flex overflow-x-auto px-2 py-1.5 gap-1 border-b border-zinc-800" style={{ scrollbarWidth: "none" }}>
          {CATEGORY_META.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "text-[10px] px-2 py-1 rounded-md whitespace-nowrap transition-colors flex-shrink-0",
                activeCategory === cat.id
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              )}
            >
              {cat.label}
              <span className="ml-0.5 text-zinc-600">{cat.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Brush grid */}
      <div className="max-h-[40vh] sm:max-h-[50vh] overflow-y-auto p-2">
        {displayPresets.length === 0 ? (
          <p className="text-xs text-zinc-600 text-center py-4">No brushes found</p>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {displayPresets.map((preset) => (
              <BrushPresetButton
                key={preset.id}
                preset={preset}
                isActive={preset.id === activeBrushId}
                onSelect={() => onSelectBrush(preset.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BrushPresetButton({
  preset,
  isActive,
  onSelect,
}: {
  preset: BrushPreset;
  isActive: boolean;
  onSelect: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 36;
    canvas.height = 36;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, 36, 36);

    // Calculate a reasonable preview size based on preset character
    const baseSize = clamp(preset.hardness * 10 + 4, 4, 14);
    const color = preset.isEraser ? "#888888" : "#ffffff";

    // Draw a short diagonal stroke preview (5 dabs)
    const dabCount = preset.spacing > 10 ? 3 : 5;
    const scatter = preset.scatter > 0 ? clamp(preset.scatter / 100, 0, 0.3) : 0;

    for (let i = 0; i < dabCount; i++) {
      const t = i / (dabCount - 1);
      let px = 5 + t * 26;
      let py = 31 - t * 26;

      if (scatter > 0) {
        px += (Math.random() - 0.5) * baseSize * scatter;
        py += (Math.random() - 0.5) * baseSize * scatter;
      }

      drawPreviewDab(ctx, px, py, baseSize, preset, color);
    }
  }, [preset]);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
        isActive
          ? "bg-blue-500/20 ring-1 ring-blue-500/50"
          : "hover:bg-zinc-800"
      )}
      title={preset.name}
    >
      <canvas
        ref={canvasRef}
        className="w-9 h-9"
        style={{ imageRendering: "auto" }}
      />
      <span className={cn(
        "text-[9px] leading-tight text-center truncate w-full",
        isActive ? "text-blue-400" : "text-zinc-400"
      )}>
        {preset.name}
      </span>
    </button>
  );
}
