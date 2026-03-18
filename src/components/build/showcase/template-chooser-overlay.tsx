"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { TEMPLATES, CATEGORIES, type LayoutTemplate } from "./panels/template-picker-panel";
import type { BuildImage, ShowcaseElement } from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POPULAR_IDS = [
  "basic-single",
  "basic-2x2",
  "mag-hero-2",
  "creative-staircase",
  "mag-editorial-5",
  "text-fullbleed-overlay",
];

const CHOOSER_CATEGORIES = ["Popular", ...CATEGORIES.filter((c) => c !== "Custom")] as const;

// ---------------------------------------------------------------------------
// SVG Preview
// ---------------------------------------------------------------------------

function TemplatePreview({ template, isSelected }: { template: LayoutTemplate; isSelected: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full aspect-square rounded-lg">
      <rect x={0} y={0} width={100} height={100} fill="#18181b" rx={4} />
      {template.previewRects.map((r, i) => {
        let fillColor: string;
        let strokeColor: string;
        if (r.type === "image") {
          fillColor = isSelected ? "#3b1010" : "#3f3f46";
          strokeColor = isSelected ? "#dc2626" : "#52525b";
        } else if (r.type === "text") {
          fillColor = isSelected ? "#2a1010" : "#52525b";
          strokeColor = isSelected ? "#b91c1c" : "#71717a";
        } else {
          fillColor = isSelected ? "#2a1a1a" : "#71717a";
          strokeColor = isSelected ? "#991b1b" : "#a1a1aa";
        }

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
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={0.5}
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
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={0.5}
            rx={1.5}
          />
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Photo count label
// ---------------------------------------------------------------------------

function photoLabel(template: LayoutTemplate): string {
  const textCount = template.previewRects.filter((r) => r.type === "text").length;
  const imgLabel = template.imageCount === 1 ? "1 photo" : `${template.imageCount} photos`;
  if (textCount > 0) {
    return `${imgLabel} + ${textCount === 1 ? "text" : `${textCount} text`}`;
  }
  return imgLabel;
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
  const [activeCategory, setActiveCategory] = useState<string>("Popular");
  const [visible, setVisible] = useState(false);

  // Entrance animation
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const filteredTemplates =
    activeCategory === "Popular"
      ? TEMPLATES.filter((t) => POPULAR_IDS.includes(t.id))
      : TEMPLATES.filter((t) => t.category === activeCategory);

  const selectedTemplate = selectedId ? TEMPLATES.find((t) => t.id === selectedId) : null;

  const handleApply = () => {
    if (!selectedTemplate) return;
    const elements = selectedTemplate.generate(buildImages);
    onApply(elements);
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[800] bg-black/95 flex flex-col transition-all duration-500",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            animationDuration: "8s",
            background:
              "radial-gradient(ellipse at 30% 50%, rgba(220,38,38,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(59,130,246,0.1) 0%, transparent 50%)",
          }}
        />
      </div>

      <div
        className={cn(
          "relative flex flex-col flex-1 overflow-hidden transition-transform duration-500 ease-out",
          visible ? "translate-y-0" : "translate-y-8",
        )}
      >
        {/* Header */}
        <div className="text-center pt-8 pb-4 px-4 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500 mb-2">
            レイアウトを選択
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-rajdhani">
            Choose Your Layout
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto">
            Select a template to get started, or skip to build from scratch
          </p>
        </div>

        {/* Category tabs */}
        <div
          className="flex gap-2 px-4 pb-3 overflow-x-auto shrink-0"
          style={{ scrollbarWidth: "none" }}
        >
          {CHOOSER_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setSelectedId(null);
              }}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors",
                activeCategory === cat
                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                  : "text-zinc-400 border border-zinc-700 hover:border-zinc-500",
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-28">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {filteredTemplates.map((template) => {
              const isSelected = selectedId === template.id;
              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedId(template.id)}
                  className={cn(
                    "rounded-xl border-2 p-2 transition-all text-left",
                    isSelected
                      ? "border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)] bg-zinc-800/50"
                      : "border-zinc-700/50 hover:border-zinc-500 bg-zinc-900/50",
                  )}
                >
                  <TemplatePreview template={template} isSelected={isSelected} />
                  <p className="text-xs font-medium text-white mt-2 truncate">{template.name}</p>
                  <p className="text-[10px] text-zinc-500">{photoLabel(template)}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent pt-8 pb-6 px-4 pointer-events-none">
          <div className="flex flex-col items-center gap-3 max-w-md mx-auto pointer-events-auto">
            <button
              onClick={handleApply}
              disabled={!selectedId}
              className="w-full py-3 rounded-xl bg-red-600 text-white font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-500 transition-colors"
            >
              Apply Layout
            </button>
            <button
              onClick={onSkip}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1"
            >
              Skip — Start with blank canvas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
