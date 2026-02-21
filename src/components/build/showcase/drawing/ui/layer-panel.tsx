"use client";

import { useState } from "react";
import {
  X,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Merge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BLEND_MODES, type DrawingLayer, type BlendMode } from "../engine/layer-manager";

interface LayerPanelProps {
  layers: DrawingLayer[];
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onMergeDown: (id: string) => void;
  onMoveLayer: (id: string, direction: "up" | "down") => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onSetOpacity: (id: string, opacity: number) => void;
  onSetBlendMode: (id: string, mode: BlendMode) => void;
  onRenameLayer: (id: string, name: string) => void;
  onClose: () => void;
  maxLayers: number;
}

export function LayerPanel({
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onMergeDown,
  onMoveLayer,
  onToggleVisibility,
  onToggleLock,
  onSetOpacity,
  onSetBlendMode,
  onRenameLayer,
  onClose,
  maxLayers,
}: LayerPanelProps) {
  const [editingNameId, setEditingNameId] = useState<string | null>(null);

  // Display layers top-to-bottom (reversed from the internal bottom-to-top order)
  const displayLayers = [...layers].reverse();
  const activeLayer = layers.find((l) => l.id === activeLayerId);
  const atLimit = layers.length >= maxLayers;
  const activeIdx = layers.findIndex((l) => l.id === activeLayerId);

  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-20 sm:right-4 z-[500] w-full sm:w-64 bg-zinc-900 border-t sm:border border-zinc-700 sm:rounded-xl rounded-t-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <h3 className="text-sm font-semibold text-white">Layers</h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onAddLayer}
            disabled={atLimit}
            className={cn(
              "text-zinc-400 transition-colors",
              atLimit ? "opacity-40 cursor-not-allowed" : "hover:text-white"
            )}
            title={atLimit ? `Max ${maxLayers} layers` : "Add layer"}
          >
            <Plus className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Active layer blend mode + opacity */}
      {activeLayer && (
        <div className="px-4 py-2 border-b border-zinc-800 space-y-2">
          <select
            value={activeLayer.blendMode}
            onChange={(e) => onSetBlendMode(activeLayerId, e.target.value as BlendMode)}
            className="w-full bg-zinc-800 text-zinc-300 text-xs rounded-lg px-2 py-1.5 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {BLEND_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 w-10">Opacity</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(activeLayer.opacity * 100)}
              onChange={(e) => onSetOpacity(activeLayerId, parseInt(e.target.value) / 100)}
              className="flex-1 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
            />
            <span className="text-[10px] text-zinc-400 w-8 text-right">
              {Math.round(activeLayer.opacity * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Layer list */}
      <div className="max-h-[40vh] sm:max-h-[50vh] overflow-y-auto">
        {displayLayers.map((layer) => {
          const isActive = layer.id === activeLayerId;
          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-zinc-800/50 transition-colors",
                isActive
                  ? "bg-blue-500/10 border-l-2 border-l-blue-500"
                  : "hover:bg-zinc-800/50 border-l-2 border-l-transparent"
              )}
            >
              {/* Visibility toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(layer.id);
                }}
                className="text-zinc-400 hover:text-white transition-colors flex-shrink-0"
              >
                {layer.visible ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-zinc-600" />
                )}
              </button>

              {/* Layer thumbnail */}
              <div className="w-8 h-8 rounded border border-zinc-700 bg-zinc-800 overflow-hidden flex-shrink-0">
                <canvas
                  ref={(el) => {
                    if (el && layer.canvas) {
                      const ctx = el.getContext("2d");
                      if (ctx) {
                        el.width = 32;
                        el.height = 32;
                        ctx.drawImage(layer.canvas, 0, 0, 32, 32);
                      }
                    }
                  }}
                  className="w-full h-full"
                />
              </div>

              {/* Layer name */}
              <div className="flex-1 min-w-0">
                {editingNameId === layer.id ? (
                  <input
                    autoFocus
                    defaultValue={layer.name}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={(e) => {
                      onRenameLayer(layer.id, e.target.value || layer.name);
                      setEditingNameId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onRenameLayer(layer.id, (e.target as HTMLInputElement).value || layer.name);
                        setEditingNameId(null);
                      }
                      if (e.key === "Escape") setEditingNameId(null);
                    }}
                    className="w-full bg-zinc-800 text-xs text-white px-1 py-0.5 rounded border border-blue-500 focus:outline-none"
                  />
                ) : (
                  <span
                    className="text-xs text-zinc-300 truncate block"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingNameId(layer.id);
                    }}
                  >
                    {layer.name}
                  </span>
                )}
              </div>

              {/* Lock */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock(layer.id);
                }}
                className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
              >
                {layer.locked ? (
                  <Lock className="h-3 w-3 text-amber-500" />
                ) : (
                  <Unlock className="h-3 w-3" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-700">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMoveLayer(activeLayerId, "up")}
            disabled={activeIdx >= layers.length - 1}
            className={cn(
              "w-7 h-7 rounded flex items-center justify-center transition-colors",
              activeIdx >= layers.length - 1
                ? "text-zinc-700 cursor-not-allowed"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
            title="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onMoveLayer(activeLayerId, "down")}
            disabled={activeIdx <= 0}
            className={cn(
              "w-7 h-7 rounded flex items-center justify-center transition-colors",
              activeIdx <= 0
                ? "text-zinc-700 cursor-not-allowed"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
            title="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicateLayer(activeLayerId)}
            disabled={atLimit}
            className={cn(
              "w-7 h-7 rounded flex items-center justify-center transition-colors",
              atLimit
                ? "text-zinc-700 cursor-not-allowed"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
            title="Duplicate"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onMergeDown(activeLayerId)}
            disabled={activeIdx <= 0}
            className={cn(
              "w-7 h-7 rounded flex items-center justify-center transition-colors",
              activeIdx <= 0
                ? "text-zinc-700 cursor-not-allowed"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
            title="Merge down"
          >
            <Merge className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDeleteLayer(activeLayerId)}
            disabled={layers.length <= 1}
            className={cn(
              "w-7 h-7 rounded flex items-center justify-center transition-colors",
              layers.length <= 1
                ? "text-zinc-700 cursor-not-allowed"
                : "text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
            )}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
