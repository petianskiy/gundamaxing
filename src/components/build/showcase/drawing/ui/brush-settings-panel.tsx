"use client";

import { useState, useMemo } from "react";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BrushPreset, BrushCategory } from "../engine/brush-types";
import { CATEGORY_META, getPresetsByCategory, searchPresets } from "../brushes/presets";

interface BrushSettingsPanelProps {
  activeBrushId: string;
  onSelectBrush: (id: string) => void;
  brushSize: number;
  onSetSize: (size: number) => void;
  brushOpacity: number;
  onSetOpacity: (opacity: number) => void;
  onClose: () => void;
}

export function BrushSettingsPanel({
  activeBrushId,
  onSelectBrush,
  brushSize,
  onSetSize,
  brushOpacity,
  onSetOpacity,
  onClose,
}: BrushSettingsPanelProps) {
  const [activeCategory, setActiveCategory] = useState<BrushCategory>("pencils");
  const [searchQuery, setSearchQuery] = useState("");

  const displayPresets = useMemo(() => {
    if (searchQuery.trim()) {
      return searchPresets(searchQuery);
    }
    return getPresetsByCategory(activeCategory);
  }, [activeCategory, searchQuery]);

  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-20 sm:left-4 z-[500] w-full sm:w-72 bg-zinc-900 border-t sm:border border-zinc-700 sm:rounded-xl rounded-t-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <h3 className="text-sm font-semibold text-white">Brushes</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
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
          <span className="text-[10px] text-zinc-400 w-8 text-right">{brushSize}px</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 w-8">Opacity</span>
          <input
            type="range"
            min={5}
            max={100}
            value={Math.round(brushOpacity * 100)}
            onChange={(e) => onSetOpacity(parseInt(e.target.value) / 100)}
            className="flex-1 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
          />
          <span className="text-[10px] text-zinc-400 w-8 text-right">
            {Math.round(brushOpacity * 100)}%
          </span>
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
      {/* Brush preview circle */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle, rgba(255,255,255,${preset.hardness * 0.8 + 0.2}) 0%, rgba(255,255,255,${preset.hardness * 0.1}) ${Math.round(preset.hardness * 60 + 40)}%, transparent 100%)`,
        }}
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
