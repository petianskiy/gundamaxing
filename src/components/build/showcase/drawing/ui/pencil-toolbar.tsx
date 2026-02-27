"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Pen,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  X,
  Check,
  Layers,
  Plus,
  Pentagon,
  Pipette,
  PaintBucket,
  Square,
  Circle,
  Triangle,
  Star,
  Hexagon,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PencilToolbarProps {
  // Current settings
  color: string;
  size: number;
  opacity: number;
  pressureGamma: number;
  texture: number;
  smoothing: number;
  tiltShading: boolean;
  isEraser: boolean;

  // Tool state
  activeTool: string;
  canUndo: boolean;
  canRedo: boolean;

  // Shape tool state
  shapeType?: string;
  shapeFilled?: boolean;
  onShapeTypeChange?: (type: string) => void;
  onShapeFilledChange?: (filled: boolean) => void;
  shapeState?: { sideCount: number; starPointCount: number };

  // Callbacks
  onColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
  onOpacityChange: (opacity: number) => void;
  onPressureGammaChange: (v: number) => void;
  onTextureChange: (v: number) => void;
  onSmoothingChange: (v: number) => void;
  onTiltShadingChange: (v: boolean) => void;
  onToolChange: (tool: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onDone: () => void;
  onCancel: () => void;

  // Layer panel toggle
  showLayerPanel: boolean;
  onToggleLayerPanel: () => void;
}

const QUICK_COLORS = ["#ffffff", "#ff4444", "#4488ff"];
const SIZE_PRESETS = [2, 6, 16] as const;

const SHAPE_TOOLS = [
  { type: "rectangle", icon: Square, label: "Rectangle" },
  { type: "ellipse", icon: Circle, label: "Ellipse" },
  { type: "triangle", icon: Triangle, label: "Triangle" },
  { type: "star", icon: Star, label: "Star" },
  { type: "polygon", icon: Hexagon, label: "Polygon" },
  { type: "line", icon: Minus, label: "Line" },
] as const;

const sliderClass =
  "h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500";

function CompactSlider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  const displayValue =
    step && step < 1 ? value.toFixed(1) : Math.round(value).toString();

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="text-[9px] text-zinc-500 w-10 flex-shrink-0 text-right">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn(sliderClass, "w-14 sm:w-20 flex-shrink-0")}
      />
      <span className="text-[10px] text-zinc-400 w-8 flex-shrink-0 tabular-nums">
        {displayValue}
        {suffix}
      </span>
    </div>
  );
}

export function PencilToolbar({
  color,
  size,
  opacity,
  pressureGamma,
  texture,
  smoothing,
  tiltShading,
  isEraser,
  activeTool,
  canUndo,
  canRedo,
  shapeType,
  shapeFilled,
  onShapeTypeChange,
  onShapeFilledChange,
  onColorChange,
  onSizeChange,
  onOpacityChange,
  onPressureGammaChange,
  onTextureChange,
  onSmoothingChange,
  onTiltShadingChange,
  onToolChange,
  onUndo,
  onRedo,
  onClear,
  onDone,
  onCancel,
  showLayerPanel,
  onToggleLayerPanel,
}: PencilToolbarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [savedColors, setSavedColors] = useState<string[]>(QUICK_COLORS);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [hexInput, setHexInput] = useState(color);

  const closestSizeIdx = SIZE_PRESETS.reduce(
    (best, preset, i) =>
      Math.abs(preset - size) < Math.abs(SIZE_PRESETS[best] - size) ? i : best,
    0
  );

  const handleToolToggle = (tool: "pencil" | "eraser") => {
    if (activeTool === tool) {
      setShowSettings((prev) => !prev);
    } else {
      onToolChange(tool);
      setShowSettings(false);
    }
  };

  const handleAddColor = () => {
    colorInputRef.current?.click();
  };

  const handleColorInputChange = (newColor: string) => {
    onColorChange(newColor);
    setHexInput(newColor);
    if (!savedColors.includes(newColor)) {
      setSavedColors((prev) => [...prev.slice(0, 2), newColor].slice(0, 3));
    }
  };

  const handleHexCommit = (val: string) => {
    const trimmed = val.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
      onColorChange(trimmed);
    }
  };

  return (
    <div
      className="fixed top-3 left-1/2 -translate-x-1/2 flex flex-col items-center"
      style={{ zIndex: 10000 }}
    >
      {/* Main toolbar strip */}
      <div
        className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 shadow-2xl max-w-[calc(100vw-1rem)] overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {/* 1. Pencil / Eraser toggle */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => handleToolToggle("pencil")}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
              activeTool === "pencil"
                ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
            title="Pencil (tap again for settings)"
          >
            <Pen className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleToolToggle("eraser")}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
              activeTool === "eraser"
                ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
            title="Eraser (tap again for settings)"
          >
            <Eraser className="h-4 w-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-zinc-700 flex-shrink-0" />

        {/* 2. Quick color swatches */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {savedColors.map((swatch) => (
            <button
              key={swatch}
              onClick={() => {
                onColorChange(swatch);
                setHexInput(swatch);
              }}
              className={cn(
                "w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all",
                color.toLowerCase() === swatch.toLowerCase()
                  ? "border-blue-400 ring-2 ring-blue-500/40 scale-110"
                  : "border-zinc-600 hover:border-zinc-400"
              )}
              style={{ backgroundColor: swatch }}
              title={swatch}
            />
          ))}
          <button
            onClick={handleAddColor}
            className="w-6 h-6 rounded-full border border-dashed border-zinc-600 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:border-zinc-400 transition-colors"
            title="Pick custom color"
          >
            <Plus className="h-3 w-3" />
          </button>
          <input
            ref={colorInputRef}
            type="color"
            value={color}
            onChange={(e) => handleColorInputChange(e.target.value)}
            className="sr-only"
            tabIndex={-1}
          />
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-zinc-700 flex-shrink-0" />

        {/* 3. Thickness preset dots */}
        <div className="flex items-center gap-2 flex-shrink-0 px-1">
          {SIZE_PRESETS.map((preset, i) => {
            const dotSizes = ["w-1.5 h-1.5", "w-2.5 h-2.5", "w-4 h-4"];
            const isActive = i === closestSizeIdx;
            return (
              <button
                key={preset}
                onClick={() => onSizeChange(preset)}
                className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-lg transition-all",
                  isActive && "ring-1 ring-blue-500/50 bg-blue-500/10"
                )}
                title={`Size ${preset}`}
              >
                <span
                  className={cn(
                    "rounded-full bg-zinc-300",
                    dotSizes[i],
                    isActive && "bg-blue-400"
                  )}
                />
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-zinc-700 flex-shrink-0" />

        {/* 4. Shape / Eyedropper / Fill tools */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => onToolChange("shape")}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
              activeTool === "shape"
                ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
            title="Shape"
          >
            <Pentagon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onToolChange("eyedropper")}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
              activeTool === "eyedropper"
                ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
            title="Eyedropper"
          >
            <Pipette className="h-4 w-4" />
          </button>
          <button
            onClick={() => onToolChange("fill")}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
              activeTool === "fill"
                ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
            title="Fill"
          >
            <PaintBucket className="h-4 w-4" />
          </button>
        </div>

        {/* Inline shape type selectors when shape tool is active */}
        {activeTool === "shape" && (
          <>
            <div className="w-px h-6 bg-zinc-700 flex-shrink-0" />
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {SHAPE_TOOLS.map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => onShapeTypeChange?.(type)}
                  className={cn(
                    "w-7 h-7 rounded-md flex items-center justify-center transition-colors",
                    shapeType === type
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                  )}
                  title={label}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
              <button
                onClick={() => onShapeFilledChange?.(!shapeFilled)}
                className={cn(
                  "px-1.5 h-7 rounded-md text-[9px] font-medium transition-colors",
                  shapeFilled
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                )}
                title={shapeFilled ? "Filled" : "Stroke only"}
              >
                {shapeFilled ? "Fill" : "Stroke"}
              </button>
            </div>
          </>
        )}

        {/* Divider */}
        <div className="w-px h-6 bg-zinc-700 flex-shrink-0" />

        {/* 5. Action buttons */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={onToggleLayerPanel}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
              showLayerPanel
                ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
            title="Layers"
          >
            <Layers className="h-4 w-4" />
          </button>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
              canUndo
                ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                : "text-zinc-700 cursor-not-allowed"
            )}
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
              canRedo
                ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                : "text-zinc-700 cursor-not-allowed"
            )}
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          <button
            onClick={onClear}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
            title="Clear active layer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={onDone}
            className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-[11px] font-medium hover:bg-blue-400 transition-colors flex items-center gap-1 flex-shrink-0"
          >
            <Check className="h-3.5 w-3.5" />
            Done
          </button>
        </div>
      </div>

      {/* Settings popover (expanded row below toolbar) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
            transition={{ duration: 0.15 }}
            className="mt-1.5 px-3 py-2.5 rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 shadow-2xl max-w-[calc(100vw-1rem)] overflow-x-auto"
            style={{ scrollbarWidth: "none", transformOrigin: "top center" }}
          >
            {/* Desktop: single horizontal row. Mobile: vertical stack */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
              {/* Color picker + hex input */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    onColorChange(e.target.value);
                    setHexInput(e.target.value);
                  }}
                  className="w-7 h-7 rounded border border-zinc-700 cursor-pointer bg-transparent flex-shrink-0"
                />
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setHexInput(val);
                    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                      onColorChange(val);
                    }
                  }}
                  onBlur={(e) => handleHexCommit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleHexCommit(hexInput);
                  }}
                  maxLength={7}
                  className={cn(
                    "w-[4.5rem] px-1.5 py-1 rounded bg-zinc-800 border text-[11px] text-zinc-200 font-mono",
                    "focus:outline-none focus:ring-1 focus:ring-blue-500/50",
                    /^#[0-9A-Fa-f]{6}$/.test(hexInput)
                      ? "border-zinc-700"
                      : "border-red-500/50"
                  )}
                  placeholder="#FFFFFF"
                />
              </div>

              <div className="hidden sm:block w-px h-5 bg-zinc-700/50 flex-shrink-0" />

              {/* Sliders */}
              <CompactSlider
                label="Size"
                value={size}
                min={1}
                max={50}
                onChange={onSizeChange}
              />
              <CompactSlider
                label="Opacity"
                value={opacity}
                min={1}
                max={100}
                suffix="%"
                onChange={onOpacityChange}
              />
              <CompactSlider
                label="Grain"
                value={texture}
                min={0}
                max={100}
                onChange={onTextureChange}
              />
              <CompactSlider
                label="Smooth"
                value={smoothing}
                min={0}
                max={100}
                onChange={onSmoothingChange}
              />
              <CompactSlider
                label="Pressure"
                value={pressureGamma}
                min={0.5}
                max={3.0}
                step={0.1}
                onChange={onPressureGammaChange}
              />

              <div className="hidden sm:block w-px h-5 bg-zinc-700/50 flex-shrink-0" />

              {/* Tilt shading toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0 select-none">
                <input
                  type="checkbox"
                  checked={tiltShading}
                  onChange={(e) => onTiltShadingChange(e.target.checked)}
                  className="w-3 h-3 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500/50 focus:ring-1 cursor-pointer"
                />
                <span className="text-[9px] text-zinc-400">Tilt shading</span>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
