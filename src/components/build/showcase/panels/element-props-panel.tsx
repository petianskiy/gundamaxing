"use client";

import { useState, useCallback } from "react";
import { X, RotateCw, Square, Trash2, Bold, Italic, Underline, Strikethrough, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ElasticSlider } from "@/components/ui/elastic-slider";
import type { ShowcaseElement, ShowcaseFontFamily } from "@/lib/types";

const SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315, 360];
const SNAP_THRESHOLD = 5; // degrees — snap when within this range

interface ElementPropsPanelProps {
  element: ShowcaseElement;
  onUpdate: (updates: Partial<ShowcaseElement>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ElementPropsPanel({ element, onUpdate, onDelete, onClose }: ElementPropsPanelProps) {
  const [rotationInput, setRotationInput] = useState(String(element.rotation));

  const handleRotationSlider = useCallback((rawVal: number) => {
    // Snap to key angles when within threshold
    let val = rawVal;
    for (const snap of SNAP_ANGLES) {
      if (Math.abs(val - snap) <= SNAP_THRESHOLD) {
        val = snap;
        break;
      }
      // Also snap to negative equivalents
      if (Math.abs(val - (snap - 360)) <= SNAP_THRESHOLD) {
        val = snap - 360;
        break;
      }
    }
    const rounded = Math.round(val);
    // Normalize 360 to 0
    const final = rounded === 360 ? 0 : rounded;
    setRotationInput(String(final));
    onUpdate({ rotation: final });
  }, [onUpdate]);

  const handleRotationInput = useCallback((raw: string) => {
    setRotationInput(raw);
    const val = parseInt(raw);
    if (!isNaN(val) && val >= -360 && val <= 360) {
      onUpdate({ rotation: val });
    }
  }, [onUpdate]);

  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-4 sm:left-4 z-[500] w-full sm:w-64 bg-zinc-900 border-t sm:border border-zinc-700 sm:rounded-xl rounded-t-xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <h3 className="text-sm font-semibold text-white capitalize">{element.type} Properties</h3>
        <div className="flex items-center gap-1.5">
          <button onClick={onDelete} className="text-zinc-400 hover:text-red-400 transition-colors" title="Delete element">
            <Trash2 className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="p-4 space-y-3 max-h-[50vh] sm:max-h-[80vh] overflow-y-auto">
        {/* Common: Rotation — full 360° with snap */}
        <div>
          <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 flex justify-between">
            <span>Rotation</span>
          </label>
          <div className="flex items-center gap-2 mb-2">
            <RotateCw className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={element.rotation < 0 ? element.rotation + 360 : element.rotation}
              onChange={(e) => handleRotationSlider(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-900"
            />
            <div className="relative shrink-0">
              <input
                type="number"
                value={rotationInput}
                onChange={(e) => handleRotationInput(e.target.value)}
                min={-360}
                max={360}
                className="w-14 px-1.5 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-xs text-white text-center focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 pointer-events-none">°</span>
            </div>
          </div>
          {/* Quick snap buttons */}
          <div className="flex flex-wrap gap-1">
            {[0, 45, 90, 180, 270].map((angle) => (
              <button
                key={angle}
                onClick={() => { setRotationInput(String(angle)); onUpdate({ rotation: angle }); }}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-medium border transition-colors",
                  element.rotation === angle
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                )}
              >
                {angle}°
              </button>
            ))}
          </div>
        </div>

        {/* Image-specific */}
        {element.type === "image" && (
          <>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">Fit</label>
              <div className="flex gap-2">
                {(["cover", "contain"] as const).map((fit) => (
                  <button
                    key={fit}
                    onClick={() => onUpdate({ objectFit: fit })}
                    className={cn(
                      "flex-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                      element.objectFit === fit
                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                    )}
                  >
                    {fit}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 flex justify-between">
                <span>Border Radius</span>
                <span className="text-zinc-500">{element.borderRadius}px</span>
              </label>
              <ElasticSlider
                defaultValue={element.borderRadius}
                startingValue={0}
                maxValue={50}
                onChange={(val) => onUpdate({ borderRadius: Math.round(val) })}
                leftIcon={<Square className="h-3.5 w-3.5 text-zinc-400" />}
                rightIcon={<Square className="h-3.5 w-3.5 text-zinc-400 rounded" />}
                className="w-full"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400 uppercase tracking-wider">Shadow</label>
              <button
                onClick={() => onUpdate({ shadow: !element.shadow })}
                className={cn(
                  "w-10 h-5 rounded-full transition-colors",
                  element.shadow ? "bg-blue-500" : "bg-zinc-700"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full bg-white transition-transform mx-0.5",
                  element.shadow ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">Caption</label>
              <input
                type="text"
                value={element.caption || ""}
                onChange={(e) => onUpdate({ caption: e.target.value || null })}
                placeholder="Optional caption..."
                className="w-full px-3 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </>
        )}

        {/* Text-specific */}
        {element.type === "text" && (
          <>
            {/* Formatting toolbar */}
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">Format</label>
              <div className="flex gap-1">
                {[
                  { key: "bold" as const, icon: Bold, label: "Bold" },
                  { key: "italic" as const, icon: Italic, label: "Italic" },
                  { key: "underline" as const, icon: Underline, label: "Underline" },
                  { key: "strikethrough" as const, icon: Strikethrough, label: "Strikethrough" },
                ].map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => onUpdate({ [key]: !element[key] })}
                    className={cn(
                      "flex-1 h-8 rounded-md flex items-center justify-center border transition-colors",
                      element[key]
                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                    )}
                    title={label}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Font size — numeric */}
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 flex justify-between">
                <span>Font Size</span>
                <span className="text-zinc-500">{element.fontSize}px</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdate({ fontSize: Math.max(8, element.fontSize - 2) })}
                  className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="number"
                  value={element.fontSize}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 8 && val <= 120) {
                      onUpdate({ fontSize: val });
                    }
                  }}
                  min={8}
                  max={120}
                  className="flex-1 px-2 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-white text-center focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => onUpdate({ fontSize: Math.min(120, element.fontSize + 2) })}
                  className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">Font</label>
              <select
                value={element.fontFamily}
                onChange={(e) => onUpdate({ fontFamily: e.target.value as ShowcaseFontFamily })}
                className="w-full px-3 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="geist">Geist (Default)</option>
                <option value="orbitron">Orbitron</option>
                <option value="rajdhani">Rajdhani</option>
                <option value="exo2">Exo 2</option>
                <option value="shareTechMono">Share Tech Mono</option>
                <option value="audiowide">Audiowide</option>
                <option value="chakraPetch">Chakra Petch</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">Color</label>
              <input
                type="color"
                value={element.color}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="w-full h-8 rounded-md cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">Align</label>
              <div className="flex gap-2">
                {(["left", "center", "right"] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => onUpdate({ textAlign: align })}
                    className={cn(
                      "flex-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                      element.textAlign === align
                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                    )}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>

            {/* Gradient text */}
            <div className="pt-2 border-t border-zinc-700/50">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Gradient</label>
                <button
                  onClick={() => onUpdate({ gradient: !element.gradient, ...((!element.gradient) ? { fuzzy: false } : {}) })}
                  className={cn(
                    "w-10 h-5 rounded-full transition-colors",
                    element.gradient ? "bg-blue-500" : "bg-zinc-700"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full bg-white transition-transform mx-0.5",
                    element.gradient ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>
              </div>
              {element.gradient && (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Colors</label>
                    <div className="flex gap-1 flex-wrap">
                      {element.gradientColors.map((c, i) => (
                        <div key={i} className="relative">
                          <input
                            type="color"
                            value={c}
                            onChange={(e) => {
                              const newColors = [...element.gradientColors];
                              newColors[i] = e.target.value;
                              onUpdate({ gradientColors: newColors });
                            }}
                            className="w-7 h-7 rounded cursor-pointer border border-zinc-700"
                          />
                          {element.gradientColors.length > 2 && (
                            <button
                              onClick={() => {
                                const newColors = element.gradientColors.filter((_, idx) => idx !== i);
                                onUpdate({ gradientColors: newColors });
                              }}
                              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-zinc-800 border border-zinc-600 text-zinc-400 hover:text-red-400 text-[8px] flex items-center justify-center"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      {element.gradientColors.length < 6 && (
                        <button
                          onClick={() => onUpdate({ gradientColors: [...element.gradientColors, "#ff40ff"] })}
                          className="w-7 h-7 rounded border border-dashed border-zinc-600 text-zinc-500 hover:text-white hover:border-zinc-400 flex items-center justify-center text-sm transition-colors"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 flex justify-between">
                      <span>Speed</span>
                      <span>{element.gradientSpeed.toFixed(1)}</span>
                    </label>
                    <input
                      type="range"
                      min={0.5}
                      max={10}
                      step={0.5}
                      value={element.gradientSpeed}
                      onChange={(e) => onUpdate({ gradientSpeed: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Fuzzy text */}
            <div className="pt-2 border-t border-zinc-700/50">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Fuzzy</label>
                <button
                  onClick={() => onUpdate({ fuzzy: !element.fuzzy, ...((!element.fuzzy) ? { gradient: false } : {}) })}
                  className={cn(
                    "w-10 h-5 rounded-full transition-colors",
                    element.fuzzy ? "bg-blue-500" : "bg-zinc-700"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full bg-white transition-transform mx-0.5",
                    element.fuzzy ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>
              </div>
              {element.fuzzy && (
                <div className="space-y-3">
                  {/* Base Intensity */}
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 flex justify-between">
                      <span>Base Intensity</span>
                      <span>{element.fuzzyIntensity.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      min={0.05}
                      max={1}
                      step={0.05}
                      value={element.fuzzyIntensity}
                      onChange={(e) => onUpdate({ fuzzyIntensity: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                    />
                  </div>

                  {/* Fuzz Range */}
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 flex justify-between">
                      <span>Fuzz Range</span>
                      <span>{element.fuzzyFuzzRange.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      min={0.01}
                      max={0.5}
                      step={0.01}
                      value={element.fuzzyFuzzRange}
                      onChange={(e) => onUpdate({ fuzzyFuzzRange: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                    />
                  </div>

                  {/* Enable Hover */}
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-zinc-400 uppercase tracking-wider">Enable Hover</label>
                    <button
                      onClick={() => onUpdate({ fuzzyEnableHover: !element.fuzzyEnableHover })}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors",
                        element.fuzzyEnableHover ? "bg-blue-500" : "bg-zinc-700"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full bg-white transition-transform mx-0.5",
                        element.fuzzyEnableHover ? "translate-x-5" : "translate-x-0"
                      )} />
                    </button>
                  </div>

                  {/* Hover Intensity (only when hover enabled) */}
                  {element.fuzzyEnableHover && (
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 flex justify-between">
                        <span>Hover Intensity</span>
                        <span>{element.fuzzyHoverIntensity.toFixed(2)}</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={2}
                        step={0.05}
                        value={element.fuzzyHoverIntensity}
                        onChange={(e) => onUpdate({ fuzzyHoverIntensity: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                      />
                    </div>
                  )}

                  {/* Direction */}
                  <div>
                    <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">Direction</label>
                    <div className="flex gap-2">
                      {(["horizontal", "vertical", "both"] as const).map((dir) => (
                        <button
                          key={dir}
                          onClick={() => onUpdate({ fuzzyDirection: dir })}
                          className={cn(
                            "flex-1 px-2 py-1.5 rounded-md text-xs font-medium border transition-colors",
                            element.fuzzyDirection === dir
                              ? "border-blue-500 bg-blue-500/10 text-blue-400"
                              : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                          )}
                        >
                          {dir}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transition Speed */}
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 flex justify-between">
                      <span>Transition Speed</span>
                      <span>{element.fuzzyTransitionDuration.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      min={0.01}
                      max={1}
                      step={0.01}
                      value={element.fuzzyTransitionDuration}
                      onChange={(e) => onUpdate({ fuzzyTransitionDuration: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                    />
                  </div>

                  {/* Letter Spacing */}
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 flex justify-between">
                      <span>Letter Spacing</span>
                      <span>{element.fuzzyLetterSpacing}px</span>
                    </label>
                    <input
                      type="range"
                      min={-5}
                      max={20}
                      step={0.5}
                      value={element.fuzzyLetterSpacing}
                      onChange={(e) => onUpdate({ fuzzyLetterSpacing: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                    />
                  </div>

                  {/* Click Effect */}
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-zinc-400 uppercase tracking-wider">Click Effect</label>
                    <button
                      onClick={() => onUpdate({ fuzzyClickEffect: !element.fuzzyClickEffect })}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors",
                        element.fuzzyClickEffect ? "bg-blue-500" : "bg-zinc-700"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full bg-white transition-transform mx-0.5",
                        element.fuzzyClickEffect ? "translate-x-5" : "translate-x-0"
                      )} />
                    </button>
                  </div>

                  {/* Glitch Mode */}
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-zinc-400 uppercase tracking-wider">Glitch Mode</label>
                    <button
                      onClick={() => onUpdate({ fuzzyGlitchMode: !element.fuzzyGlitchMode })}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors",
                        element.fuzzyGlitchMode ? "bg-blue-500" : "bg-zinc-700"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full bg-white transition-transform mx-0.5",
                        element.fuzzyGlitchMode ? "translate-x-5" : "translate-x-0"
                      )} />
                    </button>
                  </div>

                  {/* Glitch Interval & Duration (only when glitch mode enabled) */}
                  {element.fuzzyGlitchMode && (
                    <>
                      <div>
                        <label className="text-xs text-zinc-500 mb-1 flex justify-between">
                          <span>Glitch Interval</span>
                          <span>{element.fuzzyGlitchInterval.toFixed(1)}s</span>
                        </label>
                        <input
                          type="range"
                          min={0.5}
                          max={30}
                          step={0.5}
                          value={element.fuzzyGlitchInterval}
                          onChange={(e) => onUpdate({ fuzzyGlitchInterval: parseFloat(e.target.value) })}
                          className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 mb-1 flex justify-between">
                          <span>Glitch Duration</span>
                          <span>{element.fuzzyGlitchDuration.toFixed(1)}s</span>
                        </label>
                        <input
                          type="range"
                          min={0.1}
                          max={5}
                          step={0.1}
                          value={element.fuzzyGlitchDuration}
                          onChange={(e) => onUpdate({ fuzzyGlitchDuration: parseFloat(e.target.value) })}
                          className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Metadata-specific */}
        {element.type === "metadata" && (
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">Variant</label>
            <div className="flex gap-2">
              {(["compact", "full"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => onUpdate({ variant: v })}
                  className={cn(
                    "flex-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                    element.variant === v
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Effect-specific */}
        {element.type === "effect" && (
          <>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">Color</label>
              <input
                type="color"
                value={element.color}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="w-full h-8 rounded-md cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 flex justify-between">
                <span>Speed</span>
                <span className="text-zinc-500">{element.speed.toFixed(1)}</span>
              </label>
              <ElasticSlider
                defaultValue={element.speed * 20}
                startingValue={2}
                maxValue={100}
                onChange={(val) => onUpdate({ speed: val / 20 })}
                leftIcon={<RotateCw className="h-3.5 w-3.5 text-zinc-400" />}
                rightIcon={<RotateCw className="h-3.5 w-3.5 text-zinc-400" />}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 flex justify-between">
                <span>Chaos</span>
                <span className="text-zinc-500">{element.chaos.toFixed(2)}</span>
              </label>
              <ElasticSlider
                defaultValue={element.chaos * 100}
                startingValue={0}
                maxValue={100}
                onChange={(val) => onUpdate({ chaos: val / 100 })}
                leftIcon={<Square className="h-3.5 w-3.5 text-zinc-400" />}
                rightIcon={<Square className="h-3.5 w-3.5 text-zinc-400" />}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 flex justify-between">
                <span>Border Radius</span>
                <span className="text-zinc-500">{element.borderRadius}px</span>
              </label>
              <ElasticSlider
                defaultValue={element.borderRadius}
                startingValue={0}
                maxValue={50}
                onChange={(val) => onUpdate({ borderRadius: Math.round(val) })}
                leftIcon={<Square className="h-3.5 w-3.5 text-zinc-400" />}
                rightIcon={<Square className="h-3.5 w-3.5 text-zinc-400 rounded" />}
                className="w-full"
              />
            </div>
          </>
        )}

        {/* Video-specific */}
        {element.type === "video" && (
          <>
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400 uppercase tracking-wider">Muted</label>
              <button
                onClick={() => onUpdate({ muted: !element.muted })}
                className={cn(
                  "w-10 h-5 rounded-full transition-colors",
                  element.muted ? "bg-blue-500" : "bg-zinc-700"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full bg-white transition-transform mx-0.5",
                  element.muted ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400 uppercase tracking-wider">Loop</label>
              <button
                onClick={() => onUpdate({ loop: !element.loop })}
                className={cn(
                  "w-10 h-5 rounded-full transition-colors",
                  element.loop ? "bg-blue-500" : "bg-zinc-700"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full bg-white transition-transform mx-0.5",
                  element.loop ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 flex justify-between">
                <span>Border Radius</span>
                <span className="text-zinc-500">{element.borderRadius}px</span>
              </label>
              <ElasticSlider
                defaultValue={element.borderRadius}
                startingValue={0}
                maxValue={50}
                onChange={(val) => onUpdate({ borderRadius: Math.round(val) })}
                leftIcon={<Square className="h-3.5 w-3.5 text-zinc-400" />}
                rightIcon={<Square className="h-3.5 w-3.5 text-zinc-400 rounded" />}
                className="w-full"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
