"use client";

import { X, ChevronUp, ChevronDown, GripVertical, Image as ImageIcon, Type, LayoutGrid, Film, Zap, Pentagon, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShowcaseElement } from "@/lib/types";

interface LayersPanelProps {
  elements: ShowcaseElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (id: string, direction: "up" | "down" | "top" | "bottom") => void;
  onClose: () => void;
  lockedIds?: Set<string>;
  onToggleLock?: (id: string) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  image: <ImageIcon className="h-3.5 w-3.5" />,
  text: <Type className="h-3.5 w-3.5" />,
  metadata: <LayoutGrid className="h-3.5 w-3.5" />,
  video: <Film className="h-3.5 w-3.5" />,
  effect: <Zap className="h-3.5 w-3.5" />,
  shape: <Pentagon className="h-3.5 w-3.5" />,
};

const typeColorBg: Record<string, string> = {
  image: "bg-emerald-500/15 text-emerald-400",
  text: "bg-blue-500/15 text-blue-400",
  metadata: "bg-purple-500/15 text-purple-400",
  video: "bg-red-500/15 text-red-400",
  effect: "bg-amber-500/15 text-amber-400",
  shape: "bg-cyan-500/15 text-cyan-400",
};

const typeLabels: Record<string, string> = {
  image: "Image",
  text: "Text",
  metadata: "Info Card",
  video: "Video",
  effect: "Effect",
  shape: "Shape",
};

function getLayerLabel(el: ShowcaseElement, index: number): string {
  const base = typeLabels[el.type] || el.type;
  if (el.type === "text") {
    const content = (el as { content: string }).content;
    const preview = content.slice(0, 18);
    return preview.length < content.length ? `${preview}...` : preview;
  }
  return `${base} ${index}`;
}

export function LayersPanel({ elements, selectedId, onSelect, onReorder, onClose, lockedIds, onToggleLock }: LayersPanelProps) {
  const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  // Build numbering per type
  const typeCounts: Record<string, number> = {};
  const typeIndices = new Map<string, number>();
  // Process in zIndex ascending order for numbering
  const ascending = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  for (const el of ascending) {
    typeCounts[el.type] = (typeCounts[el.type] || 0) + 1;
    typeIndices.set(el.id, typeCounts[el.type]);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-20 sm:right-4 z-[500] w-full sm:w-80 max-h-[50vh] sm:max-h-[60vh] bg-zinc-900 border-t sm:border border-zinc-700 sm:rounded-xl rounded-t-xl shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 shrink-0">
        <h3 className="text-sm font-semibold text-white">Layers</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Quick actions for selected layer */}
      {selectedId && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-800/50 shrink-0">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Selected:</span>
          <button
            onClick={() => onReorder(selectedId, "top")}
            className="px-2.5 py-1 rounded text-[10px] font-medium text-zinc-300 bg-zinc-700 hover:bg-zinc-600 transition-colors"
          >
            Front
          </button>
          <button
            onClick={() => onReorder(selectedId, "bottom")}
            className="px-2.5 py-1 rounded text-[10px] font-medium text-zinc-300 bg-zinc-700 hover:bg-zinc-600 transition-colors"
          >
            Back
          </button>
        </div>
      )}

      {/* Layer list */}
      <div className="overflow-y-auto flex-1">
        {sorted.map((el, sortedIdx) => {
          const isSelected = el.id === selectedId;
          const layerNum = sorted.length - sortedIdx;
          const label = getLayerLabel(el, typeIndices.get(el.id) || 1);
          const isLocked = lockedIds?.has(el.id) ?? false;

          return (
            <div
              key={el.id}
              className={cn(
                "flex items-center gap-2 px-3 py-3 border-b border-zinc-800/50 cursor-pointer transition-colors",
                isSelected ? "bg-blue-500/10" : "hover:bg-zinc-800/30"
              )}
              onClick={() => onSelect(el.id)}
            >
              {/* Drag handle (visual only) */}
              <GripVertical className="h-4 w-4 text-zinc-600 shrink-0" />

              {/* Type icon with color indicator */}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                typeColorBg[el.type] || "bg-zinc-700/50 text-zinc-400"
              )}>
                {typeIcons[el.type] || <LayoutGrid className="h-3.5 w-3.5" />}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <span className="text-xs text-zinc-200 truncate block">{label}</span>
                <span className="text-[10px] text-zinc-500">{typeLabels[el.type] || el.type} &middot; Layer {layerNum}</span>
              </div>

              {/* Lock toggle */}
              {onToggleLock && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleLock(el.id); }}
                  className={cn(
                    "min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    isLocked
                      ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                      : "text-zinc-600 bg-zinc-800/50 hover:bg-zinc-700/50 hover:text-zinc-400"
                  )}
                  title={isLocked ? "Unlock layer" : "Lock layer"}
                >
                  {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                </button>
              )}

              {/* Up/Down reorder buttons */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onReorder(el.id, "up"); }}
                  disabled={sortedIdx === 0}
                  className={cn(
                    "w-8 h-5 rounded flex items-center justify-center transition-colors",
                    sortedIdx === 0
                      ? "text-zinc-700 cursor-not-allowed"
                      : "text-zinc-500 hover:text-white hover:bg-zinc-700"
                  )}
                  title="Move up"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onReorder(el.id, "down"); }}
                  disabled={sortedIdx === sorted.length - 1}
                  className={cn(
                    "w-8 h-5 rounded flex items-center justify-center transition-colors",
                    sortedIdx === sorted.length - 1
                      ? "text-zinc-700 cursor-not-allowed"
                      : "text-zinc-500 hover:text-white hover:bg-zinc-700"
                  )}
                  title="Move down"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        {elements.length === 0 && (
          <p className="text-zinc-500 text-xs text-center py-8">No elements yet</p>
        )}
      </div>
    </div>
  );
}
