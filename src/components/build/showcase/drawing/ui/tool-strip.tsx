"use client";

import { useState, useCallback } from "react";
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
  { id: "brush", icon: Pen, label: "Brush", shortcut: "B", implemented: true },
  { id: "eraser", icon: Eraser, label: "Eraser", shortcut: "E", implemented: true },
  { id: "shape", icon: Pentagon, label: "Shape", shortcut: "U", implemented: true },
  { id: "eyedropper", icon: Pipette, label: "Eyedropper", shortcut: "I", implemented: true },
  { id: "fill", icon: PaintBucket, label: "Fill", shortcut: "G", implemented: true },
  { id: "smudge", icon: Blend, label: "Smudge", shortcut: "R", implemented: true },
  { id: "move", icon: Move, label: "Move", shortcut: "V", implemented: false },
  { id: "select", icon: SquareDashed, label: "Select", shortcut: "M", implemented: false },
];

interface TooltipState {
  toolId: string;
  label: string;
  shortcut: string;
  rect: DOMRect;
}

function ToolTooltip({
  tooltip,
  position,
}: {
  tooltip: TooltipState;
  position: "right" | "top";
}) {
  if (position === "right") {
    return (
      <div
        className="fixed pointer-events-none z-[10002] px-2 py-1 rounded bg-zinc-800 border border-zinc-700 shadow-lg whitespace-nowrap"
        style={{
          left: tooltip.rect.right + 8,
          top: tooltip.rect.top + tooltip.rect.height / 2,
          transform: "translateY(-50%)",
        }}
      >
        <span className="text-[11px] text-zinc-200">{tooltip.label}</span>
        <span className="text-[10px] text-zinc-500 ml-1.5">({tooltip.shortcut})</span>
      </div>
    );
  }

  return (
    <div
      className="fixed pointer-events-none z-[10002] px-2 py-1 rounded bg-zinc-800 border border-zinc-700 shadow-lg whitespace-nowrap"
      style={{
        left: tooltip.rect.left + tooltip.rect.width / 2,
        top: tooltip.rect.top - 8,
        transform: "translate(-50%, -100%)",
      }}
    >
      <span className="text-[11px] text-zinc-200">{tooltip.label}</span>
      <span className="text-[10px] text-zinc-500 ml-1.5">({tooltip.shortcut})</span>
    </div>
  );
}

export function ToolStrip({
  activeTool,
  onSetTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: ToolStripProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const showTooltip = useCallback(
    (e: React.MouseEvent, toolId: string, label: string, shortcut: string) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setTooltip({ toolId, label, shortcut, rect });
    },
    []
  );

  const hideTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);
  const modKey = isMac ? "\u2318" : "Ctrl+";

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
              onMouseEnter={(e) =>
                tool.implemented && showTooltip(e, tool.id, tool.label, tool.shortcut)
              }
              onMouseLeave={hideTooltip}
              className={cn(
                "w-9 h-9 rounded flex items-center justify-center transition-all",
                "hover:bg-zinc-800 hover:scale-110 disabled:cursor-not-allowed",
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
          onMouseEnter={(e) =>
            showTooltip(e, "undo", "Undo", `${modKey}Z`)
          }
          onMouseLeave={hideTooltip}
          className={cn(
            "w-9 h-9 rounded flex items-center justify-center transition-all",
            "hover:bg-zinc-800 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40",
            canUndo ? "text-zinc-400" : "text-zinc-600"
          )}
        >
          <Undo className="w-5 h-5" />
        </button>

        {/* Redo */}
        <button
          onClick={onRedo}
          disabled={!canRedo}
          onMouseEnter={(e) =>
            showTooltip(e, "redo", "Redo", `${modKey}${isMac ? "\u21e7" : "Shift+"}Z`)
          }
          onMouseLeave={hideTooltip}
          className={cn(
            "w-9 h-9 rounded flex items-center justify-center transition-all",
            "hover:bg-zinc-800 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40",
            canRedo ? "text-zinc-400" : "text-zinc-600"
          )}
        >
          <Redo className="w-5 h-5" />
        </button>

        {/* Desktop tooltip */}
        {tooltip && <ToolTooltip tooltip={tooltip} position="right" />}
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
                onMouseEnter={(e) =>
                  tool.implemented && showTooltip(e, tool.id, tool.label, tool.shortcut)
                }
                onMouseLeave={hideTooltip}
                className={cn(
                  "w-9 h-9 flex-shrink-0 rounded flex items-center justify-center transition-all",
                  "active:scale-95 disabled:cursor-not-allowed",
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
            className={cn(
              "w-9 h-9 flex-shrink-0 rounded flex items-center justify-center transition-all",
              "active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
              canUndo ? "text-zinc-400" : "text-zinc-600"
            )}
          >
            <Undo className="w-5 h-5" />
          </button>

          {/* Redo */}
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={cn(
              "w-9 h-9 flex-shrink-0 rounded flex items-center justify-center transition-all",
              "active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
              canRedo ? "text-zinc-400" : "text-zinc-600"
            )}
          >
            <Redo className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile tooltip */}
        {tooltip && <ToolTooltip tooltip={tooltip} position="top" />}
      </div>
    </>
  );
}
