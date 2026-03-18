"use client";

import { useState, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEMPLATES, type LayoutTemplate } from "./panels/template-picker-panel";
import type { BuildImage, ShowcaseElement } from "@/lib/types";

// ---------------------------------------------------------------------------
// Clean SVG preview — white outlines on dark bg, NO fill, just strokes
// ---------------------------------------------------------------------------

function GridIcon({ template, selected }: { template: LayoutTemplate; selected: boolean }) {
  const stroke = selected ? "#f97316" : "#a1a1aa";
  return (
    <svg viewBox="0 0 100 100" className="w-full aspect-square">
      <rect x={1} y={1} width={98} height={98} fill="none" stroke={stroke} strokeWidth={1.5} rx={3} />
      {template.previewRects.map((r, i) => {
        // Diamond center gets special rendering
        if (template.id === "creative-diamond" && i === 0) {
          const cx = r.x + r.w / 2;
          const cy = r.y + r.h / 2;
          const hw = r.w / 2;
          const hh = r.h / 2;
          return (
            <polygon
              key={i}
              points={`${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`}
              fill="none"
              stroke={stroke}
              strokeWidth={1}
            />
          );
        }

        return (
          <rect
            key={i}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill="none"
            stroke={stroke}
            strokeWidth={1}
            rx={1}
          />
        );
      })}
      {/* Custom preview lines for diagonal templates */}
      {template.previewLines?.map((l, i) => (
        <line
          key={`line-${i}`}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke={stroke}
          strokeWidth={0.8}
          strokeDasharray="3 2"
        />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface TemplateChooserOverlayProps {
  buildImages: BuildImage[];
  onApply: (elements: ShowcaseElement[]) => void;
  onSkip: () => void;
}

export function TemplateChooserOverlay({ buildImages, onApply, onSkip }: TemplateChooserOverlayProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // All templates in a flat grid, 4 columns
  const allTemplates = TEMPLATES;
  const selected = selectedId ? allTemplates.find(t => t.id === selectedId) : null;

  const handleApply = () => {
    if (!selected) return;
    onApply(selected.generate(buildImages));
  };

  return (
    <div className="fixed inset-0 z-[800] bg-zinc-900 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button onClick={onSkip} className="text-zinc-400 hover:text-white p-2">
          <X className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium text-white">
          Choose Layout
        </span>
        <button
          onClick={handleApply}
          disabled={!selectedId}
          className={cn(
            "px-4 py-1.5 rounded-lg text-sm font-bold transition-colors",
            selectedId
              ? "bg-gx-red text-white hover:bg-red-500"
              : "text-zinc-600 cursor-not-allowed"
          )}
        >
          Apply
        </button>
      </div>

      {/* Template grid — 4 columns, scrollable */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 pb-20">
        <div className="grid grid-cols-4 gap-2.5 max-w-lg mx-auto py-4">
          {/* First item: FREE STYLE option */}
          <button
            onClick={onSkip}
            className="aspect-square rounded-lg border border-zinc-600 flex items-center justify-center hover:border-zinc-400 transition-colors"
          >
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center leading-tight">
              FREE<br />STYLE
            </span>
          </button>

          {allTemplates.map(template => (
            <button
              key={template.id}
              onClick={() => setSelectedId(template.id)}
              className={cn(
                "aspect-square rounded-lg transition-all",
                selectedId === template.id
                  ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-zinc-900"
                  : "hover:opacity-80"
              )}
            >
              <GridIcon template={template} selected={selectedId === template.id} />
            </button>
          ))}
        </div>
      </div>

      {/* Bottom: skip text */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-900 via-zinc-900/95 to-transparent pt-6 pb-5 px-4 pointer-events-none">
        <p className="text-center text-[10px] text-zinc-500 pointer-events-auto">
          <button onClick={onSkip} className="hover:text-zinc-300 transition-colors">
            Skip and start with blank canvas
          </button>
        </p>
      </div>
    </div>
  );
}
