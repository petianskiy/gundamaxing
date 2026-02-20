"use client";

import { X, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Image, Type, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShowcaseElement } from "@/lib/types";

interface LayersPanelProps {
  elements: ShowcaseElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (id: string, direction: "up" | "down" | "top" | "bottom") => void;
  onClose: () => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  image: <Image className="h-3.5 w-3.5" />,
  text: <Type className="h-3.5 w-3.5" />,
  metadata: <LayoutGrid className="h-3.5 w-3.5" />,
};

export function LayersPanel({ elements, selectedId, onSelect, onReorder, onClose }: LayersPanelProps) {
  const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-20 sm:right-4 z-[500] w-full sm:w-64 max-h-[50vh] sm:max-h-[60vh] bg-zinc-900 border-t sm:border border-zinc-700 sm:rounded-xl rounded-t-xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <h3 className="text-sm font-semibold text-white">Layers</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="overflow-y-auto max-h-[calc(50vh-3rem)] sm:max-h-[calc(60vh-3rem)]">
        {sorted.map((el) => {
          const isSelected = el.id === selectedId;
          const label = el.type === "image" ? "Image" : el.type === "text" ? (el as { content: string }).content.slice(0, 20) : "Info Card";

          return (
            <div
              key={el.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2 border-b border-zinc-800 cursor-pointer transition-colors",
                isSelected ? "bg-blue-500/10" : "hover:bg-zinc-800"
              )}
              onClick={() => onSelect(el.id)}
            >
              <span className="text-zinc-400">{typeIcons[el.type]}</span>
              <span className="flex-1 text-xs text-zinc-300 truncate">{label}</span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); onReorder(el.id, "top"); }}
                  className="p-0.5 text-zinc-500 hover:text-white transition-colors"
                  title="Bring to front"
                >
                  <ChevronsUp className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onReorder(el.id, "up"); }}
                  className="p-0.5 text-zinc-500 hover:text-white transition-colors"
                  title="Bring forward"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onReorder(el.id, "down"); }}
                  className="p-0.5 text-zinc-500 hover:text-white transition-colors"
                  title="Send backward"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onReorder(el.id, "bottom"); }}
                  className="p-0.5 text-zinc-500 hover:text-white transition-colors"
                  title="Send to back"
                >
                  <ChevronsDown className="h-3 w-3" />
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
