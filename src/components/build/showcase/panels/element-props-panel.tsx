"use client";

import { X, RotateCw, Square, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ElasticSlider } from "@/components/ui/elastic-slider";
import type { ShowcaseElement, ShowcaseFontFamily } from "@/lib/types";

interface ElementPropsPanelProps {
  element: ShowcaseElement;
  onUpdate: (updates: Partial<ShowcaseElement>) => void;
  onClose: () => void;
}

export function ElementPropsPanel({ element, onUpdate, onClose }: ElementPropsPanelProps) {
  return (
    <div className="fixed top-20 left-4 z-40 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <h3 className="text-sm font-semibold text-white capitalize">{element.type} Properties</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        {/* Common: Rotation */}
        <div>
          <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 flex justify-between">
            <span>Rotation</span>
            <span className="text-zinc-500">{element.rotation}°</span>
          </label>
          <ElasticSlider
            defaultValue={element.rotation + 45}
            startingValue={0}
            maxValue={90}
            onChange={(val) => onUpdate({ rotation: Math.round(val - 45) })}
            leftIcon={<RotateCw className="h-3.5 w-3.5 text-zinc-400" />}
            rightIcon={<RotateCw className="h-3.5 w-3.5 text-zinc-400" />}
            className="w-full"
          />
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
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">Font Size</label>
              <select
                value={element.fontSize}
                onChange={(e) => onUpdate({ fontSize: e.target.value as ShowcaseElement["type"] extends "text" ? typeof element.fontSize : never })}
                className="w-full px-3 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {["sm", "base", "lg", "xl", "2xl", "3xl"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">Weight</label>
              <select
                value={element.fontWeight}
                onChange={(e) => onUpdate({ fontWeight: e.target.value as "normal" | "medium" | "semibold" | "bold" })}
                className="w-full px-3 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {["normal", "medium", "semibold", "bold"].map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
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
      </div>
    </div>
  );
}
