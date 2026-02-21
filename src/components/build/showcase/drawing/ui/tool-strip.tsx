"use client";

import {
  Pen,
  Eraser,
  Move,
  SquareDashed,
  Pentagon,
  Pipette,
  PaintBucket,
  Blend,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolStripProps {
  activeTool: string;
  onSetTool: (tool: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

const tools = [
  { id: "brush", icon: Pen, label: "Brush", implemented: true },
  { id: "eraser", icon: Eraser, label: "Eraser", implemented: true },
  { id: "shape", icon: Pentagon, label: "Shape", implemented: true },
  { id: "eyedropper", icon: Pipette, label: "Eyedropper", implemented: true },
  { id: "fill", icon: PaintBucket, label: "Fill", implemented: true },
  { id: "smudge", icon: Blend, label: "Smudge", implemented: true },
  { id: "move", icon: Move, label: "Move", implemented: false },
  { id: "select", icon: SquareDashed, label: "Select", implemented: false },
];

export function ToolStrip({
  activeTool,
  onSetTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: ToolStripProps) {
  return (
    <>
      {/* Desktop: Vertical column */}
      <div className="hidden sm:flex fixed left-3 top-1/2 -translate-y-1/2 z-[10000] flex-col gap-1 bg-zinc-900 rounded-lg p-2 border border-zinc-800 shadow-xl">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => tool.implemented && onSetTool(tool.id)}
              disabled={!tool.implemented}
              title={tool.implemented ? tool.label : "Coming soon"}
              className={cn(
                "w-9 h-9 rounded flex items-center justify-center transition-all",
                "hover:bg-zinc-800 disabled:cursor-not-allowed",
                isActive && "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50",
                !isActive && tool.implemented && "text-zinc-400",
                !tool.implemented && "opacity-40"
              )}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}

        {/* Separator */}
        <div className="h-px bg-zinc-800 my-1" />

        {/* Undo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          className={cn(
            "w-9 h-9 rounded flex items-center justify-center transition-all",
            "hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40",
            canUndo ? "text-zinc-400" : "text-zinc-600"
          )}
        >
          <Undo className="w-5 h-5" />
        </button>

        {/* Redo */}
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          className={cn(
            "w-9 h-9 rounded flex items-center justify-center transition-all",
            "hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40",
            canRedo ? "text-zinc-400" : "text-zinc-600"
          )}
        >
          <Redo className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile: Horizontal row */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[10000] bg-zinc-900 border-t border-zinc-800 shadow-xl">
        <div className="flex items-center gap-1 p-2 overflow-x-auto">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;

            return (
              <button
                key={tool.id}
                onClick={() => tool.implemented && onSetTool(tool.id)}
                disabled={!tool.implemented}
                title={tool.implemented ? tool.label : "Coming soon"}
                className={cn(
                  "w-9 h-9 flex-shrink-0 rounded flex items-center justify-center transition-all",
                  "active:bg-zinc-800 disabled:cursor-not-allowed",
                  isActive && "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50",
                  !isActive && tool.implemented && "text-zinc-400",
                  !tool.implemented && "opacity-40"
                )}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}

          {/* Separator */}
          <div className="w-px h-6 bg-zinc-800 mx-1 flex-shrink-0" />

          {/* Undo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
            className={cn(
              "w-9 h-9 flex-shrink-0 rounded flex items-center justify-center transition-all",
              "active:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40",
              canUndo ? "text-zinc-400" : "text-zinc-600"
            )}
          >
            <Undo className="w-5 h-5" />
          </button>

          {/* Redo */}
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
            className={cn(
              "w-9 h-9 flex-shrink-0 rounded flex items-center justify-center transition-all",
              "active:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40",
              canRedo ? "text-zinc-400" : "text-zinc-600"
            )}
          >
            <Redo className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}
