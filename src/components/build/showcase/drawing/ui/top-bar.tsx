"use client";

import {
  X,
  Check,
  Trash2,
  Palette,
  Minus,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  brushSize: number;
  onSetSize: (size: number) => void;
  brushOpacity: number;
  onSetOpacity: (opacity: number) => void;
  brushColor: string;
  onToggleColorPicker: () => void;
  showColorPicker: boolean;
  onClear: () => void;
  onCancel: () => void;
  onDone: () => void;
}

export function TopBar({
  brushSize,
  onSetSize,
  brushOpacity,
  onSetOpacity,
  brushColor,
  onToggleColorPicker,
  showColorPicker,
  onClear,
  onCancel,
  onDone,
}: TopBarProps) {
  return (
    <div
      className="fixed top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 shadow-2xl max-w-[calc(100vw-1rem)] overflow-x-auto"
      style={{ zIndex: 210, scrollbarWidth: "none" }}
    >
      {/* Color swatch */}
      <button
        onClick={onToggleColorPicker}
        className={cn(
          "w-8 h-8 rounded-lg border-2 flex-shrink-0 transition-all",
          showColorPicker ? "border-blue-500 scale-110" : "border-zinc-600"
        )}
        style={{ backgroundColor: brushColor }}
        title="Color"
      />

      <div className="w-px h-6 bg-zinc-700 flex-shrink-0" />

      {/* Size control */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={() => onSetSize(Math.max(1, brushSize - (brushSize > 20 ? 5 : 2)))}
          className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <Minus className="h-3 w-3" />
        </button>
        <input
          type="range"
          min={1}
          max={200}
          value={brushSize}
          onChange={(e) => onSetSize(parseInt(e.target.value))}
          className="w-16 sm:w-20 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
        />
        <button
          onClick={() => onSetSize(Math.min(200, brushSize + (brushSize > 20 ? 5 : 2)))}
          className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <Plus className="h-3 w-3" />
        </button>
        <span className="text-[10px] text-zinc-400 w-6 text-center">{brushSize}</span>
      </div>

      {/* Opacity control */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <span className="text-[9px] text-zinc-500 w-5">Op</span>
        <input
          type="range"
          min={5}
          max={100}
          value={Math.round(brushOpacity * 100)}
          onChange={(e) => onSetOpacity(parseInt(e.target.value) / 100)}
          className="w-12 sm:w-16 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
        />
        <span className="text-[10px] text-zinc-400 w-7 text-center">
          {Math.round(brushOpacity * 100)}%
        </span>
      </div>

      <div className="w-px h-6 bg-zinc-700 flex-shrink-0" />

      {/* Clear */}
      <button
        onClick={onClear}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors flex-shrink-0"
        title="Clear active layer"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* Cancel */}
      <button
        onClick={onCancel}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex-shrink-0"
        title="Cancel"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Done */}
      <button
        onClick={onDone}
        className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-400 transition-colors flex items-center gap-1.5 flex-shrink-0"
      >
        <Check className="h-3.5 w-3.5" />
        Done
      </button>
    </div>
  );
}
