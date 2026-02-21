"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorPickerPanelProps {
  color: string;
  onSetColor: (color: string) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  "#FFFFFF", // white
  "#000000", // black
  "#EF4444", // red
  "#3B82F6", // blue
  "#10B981", // green
  "#EAB308", // yellow
  "#F97316", // orange
  "#A855F7", // purple
  "#06B6D4", // cyan
  "#EC4899", // magenta
  "#92400E", // brown
  "#6B7280", // gray
];

export function ColorPickerPanel({
  color,
  onSetColor,
  onClose,
}: ColorPickerPanelProps) {
  const [hexInput, setHexInput] = useState(color);
  const [recentColors, setRecentColors] = useState<string[]>([]);

  useEffect(() => {
    setHexInput(color);
  }, [color]);

  const handleColorChange = (newColor: string) => {
    onSetColor(newColor);
    setHexInput(newColor);
  };

  const handleHexInputChange = (value: string) => {
    setHexInput(value);

    // Validate hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      onSetColor(value);
    }
  };

  const handleClose = () => {
    // Add current color to recent colors if not already present
    if (color && !recentColors.includes(color)) {
      setRecentColors((prev) => [color, ...prev].slice(0, 12));
    }
    onClose();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-20 sm:left-4 z-[500] bg-zinc-900 border border-zinc-800 rounded-t-lg sm:rounded-lg shadow-2xl p-4 max-w-sm sm:w-80">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-200">Color Picker</h3>
        <button
          onClick={handleClose}
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-zinc-800 text-zinc-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Native color input */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="color"
          value={color}
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-12 h-12 rounded border border-zinc-700 cursor-pointer bg-transparent"
        />

        {/* Hex input */}
        <div className="flex-1">
          <label className="block text-xs text-zinc-400 mb-1">Hex</label>
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexInputChange(e.target.value.toUpperCase())}
            placeholder="#000000"
            maxLength={7}
            className={cn(
              "w-full px-3 py-2 rounded bg-zinc-800 border text-sm text-zinc-200",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
              /^#[0-9A-Fa-f]{6}$/.test(hexInput)
                ? "border-zinc-700"
                : "border-red-500/50"
            )}
          />
        </div>
      </div>

      {/* Recent colors */}
      {recentColors.length > 0 && (
        <div className="mb-4">
          <label className="block text-xs text-zinc-400 mb-2">Recent</label>
          <div className="flex flex-wrap gap-2">
            {recentColors.map((recentColor, index) => (
              <button
                key={`${recentColor}-${index}`}
                onClick={() => handleColorChange(recentColor)}
                className={cn(
                  "w-8 h-8 rounded border-2 transition-all",
                  color === recentColor
                    ? "border-blue-500 scale-110"
                    : "border-zinc-700 hover:border-zinc-600"
                )}
                style={{ backgroundColor: recentColor }}
                title={recentColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Preset colors */}
      <div>
        <label className="block text-xs text-zinc-400 mb-2">Presets</label>
        <div className="grid grid-cols-6 gap-2">
          {PRESET_COLORS.map((presetColor) => (
            <button
              key={presetColor}
              onClick={() => handleColorChange(presetColor)}
              className={cn(
                "w-full aspect-square rounded border-2 transition-all",
                color === presetColor
                  ? "border-blue-500 scale-110"
                  : "border-zinc-700 hover:border-zinc-600"
              )}
              style={{ backgroundColor: presetColor }}
              title={presetColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
