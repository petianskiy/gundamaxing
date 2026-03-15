"use client";

import { X, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Image as ImageIcon, Type, LayoutGrid, Film, Zap, Pentagon, Lock, Unlock } from "lucide-react";
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
    <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-20 sm:right-4 z-[500] w-full sm:w-72 max-h-[50vh] sm:max-h-[60vh] bg-zinc-900 border-t sm:border border-zinc-700 sm:rounded-xl rounded-t-xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <h3 className="text-sm font-semibold text-white">Layers</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="overflow-y-auto max-h-[calc(50vh-3rem)] sm:max-h-[calc(60vh-3rem)]">
        {sorted.map((el, sortedIdx) => {
          const isSelected = el.id === selectedId;
          const layerNum = sorted.length - sortedIdx;
          const label = getLayerLabel(el, typeIndices.get(el.id) || 1);
          const isLocked = lockedIds?.has(el.id) ?? false;

          return (
            <div
              key={el.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800 cursor-pointer transition-colors",
                isSelected ? "bg-blue-500/10 border-l-2 border-l-blue-500" : "hover:bg-zinc-800/50"
              )}
              onClick={() => onSelect(el.id)}
            >
              {/* Layer number */}
              <span className="text-[10px] text-zinc-600 w-4 text-right tabular-nums flex-shrink-0">
                {layerNum}
              </span>
              {/* Type icon */}
              <span className={cn("flex-shrink-0", isSelected ? "text-blue-400" : "text-zinc-500")}>
                {typeIcons[el.type] || <LayoutGrid className="h-3.5 w-3.5" />}
              </span>
              {/* Label */}
              <span className="flex-1 text-xs text-zinc-300 truncate min-w-0">{label}</span>
              {/* Lock toggle */}
              {onToggleLock && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleLock(el.id); }}
                  className={cn(
                    "p-1.5 rounded transition-colors flex-shrink-0",
                    isLocked ? "text-amber-400 hover:text-amber-300" : "text-zinc-600 hover:text-zinc-400"
                  )}
                  title={isLocked ? "Unlock layer" : "Lock layer"}
                >
                  {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                </button>
              )}
              {/* Reorder buttons */}
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onReorder(el.id, "top"); }}
                  className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-700/50 transition-colors"
                  title="Bring to front"
                >
                  <ChevronsUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onReorder(el.id, "up"); }}
                  className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-700/50 transition-colors"
                  title="Bring forward"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onReorder(el.id, "down"); }}
                  className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-700/50 transition-colors"
                  title="Send backward"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onReorder(el.id, "bottom"); }}
                  className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-700/50 transition-colors"
                  title="Send to back"
                >
                  <ChevronsDown className="h-3.5 w-3.5" />
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
