"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { X, Lock, Unlock, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEMPLATES, CATEGORIES, type LayoutTemplate } from "./panels/template-picker-panel";
import type { BuildImage, ShowcaseElement } from "@/lib/types";

// ─── Helpers ────────────────────────────────────────────────────

function getImage(images: BuildImage[], index: number): BuildImage | null {
  if (images.length === 0) return null;
  return images[index % images.length] ?? null;
}

/** Group templates by image count for smart suggestions */
function getRecommended(templates: LayoutTemplate[], imageCount: number): LayoutTemplate[] {
  // Exact match first, then ±1, sorted by popularity (earlier = more popular)
  const exact = templates.filter((t) => t.imageCount === imageCount);
  const close = templates.filter((t) => Math.abs(t.imageCount - imageCount) === 1 && t.imageCount > 0);
  return [...exact.slice(0, 8), ...close.slice(0, 4)];
}

// ─── Compact Grid Icon ──────────────────────────────────────────

function GridIcon({ template, active }: { template: LayoutTemplate; active: boolean }) {
  const stroke = active ? "#f97316" : "rgba(255,255,255,0.35)";
  const fill = active ? "rgba(249,115,22,0.08)" : "none";
  return (
    <svg viewBox="0 0 100 100" className="w-full aspect-square">
      <rect x={1} y={1} width={98} height={98} fill={fill} stroke={stroke} strokeWidth={active ? 2 : 1} rx={4} />
      {template.previewRects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke={stroke} strokeWidth={0.8} rx={1} />
      ))}
      {template.previewLines?.map((l, i) => (
        <line key={`l-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={stroke} strokeWidth={0.6} strokeDasharray="3 2" />
      ))}
    </svg>
  );
}

// ─── Live Preview ───────────────────────────────────────────────

function LivePreview({
  template,
  images,
}: {
  template: LayoutTemplate;
  images: BuildImage[];
}) {
  const imageSlots = template.previewRects.filter((r) => r.type === "image");
  const textSlots = template.previewRects.filter((r) => r.type === "text" || r.type === "meta");

  return (
    <div className="relative w-full aspect-[4/5] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-700/50">
      {/* Grid lines faint background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "10% 10%",
        }}
      />

      {/* Image slots filled with actual images */}
      {imageSlots.map((slot, i) => {
        const img = getImage(images, i);
        return (
          <div
            key={i}
            className="absolute overflow-hidden rounded-sm"
            style={{
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              width: `${slot.w}%`,
              height: `${slot.h}%`,
            }}
          >
            {img ? (
              <img
                src={img.url}
                alt={img.alt || ""}
                className="w-full h-full object-cover"
                style={img.objectPosition ? { objectPosition: img.objectPosition } : undefined}
                draggable={false}
              />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <div className="w-6 h-6 rounded border border-dashed border-zinc-600" />
              </div>
            )}
          </div>
        );
      })}

      {/* Text/meta slot placeholders */}
      {textSlots.map((slot, i) => (
        <div
          key={`t-${i}`}
          className="absolute flex items-center justify-center"
          style={{
            left: `${slot.x}%`,
            top: `${slot.y}%`,
            width: `${slot.w}%`,
            height: `${slot.h}%`,
          }}
        >
          <div className="w-3/4 space-y-1">
            <div className="h-1.5 bg-zinc-700 rounded-full w-full" />
            <div className="h-1 bg-zinc-800 rounded-full w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Image Tray ─────────────────────────────────────────────────

function ImageTray({ images }: { images: BuildImage[] }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto py-2" style={{ scrollbarWidth: "none" }}>
      {images.map((img, i) => (
        <div key={i} className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-zinc-700/50">
          <img src={img.url} alt="" className="w-full h-full object-cover" draggable={false} />
          <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-black/70 text-[7px] font-bold text-white flex items-center justify-center">
            {i + 1}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Category Pills ─────────────────────────────────────────────

const DISPLAY_CATEGORIES = ["Recommended", ...CATEGORIES.filter((c) => c !== "Custom")] as const;

// ─── Main Component ─────────────────────────────────────────────

interface TemplateChooserOverlayProps {
  buildImages: BuildImage[];
  onApply: (elements: ShowcaseElement[], locked: boolean) => void;
  onSkip: () => void;
}

export function TemplateChooserOverlay({ buildImages, onApply, onSkip }: TemplateChooserOverlayProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("Recommended");
  const [locked, setLocked] = useState(true);
  const [visible, setVisible] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const recommended = useMemo(() => getRecommended(TEMPLATES, buildImages.length), [buildImages.length]);

  const displayTemplates = useMemo(() => {
    if (activeCategory === "Recommended") return recommended;
    return TEMPLATES.filter((t) => t.category === activeCategory);
  }, [activeCategory, recommended]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return TEMPLATES.find((t) => t.id === selectedId) ?? null;
  }, [selectedId]);

  // Auto-select first recommended template
  useEffect(() => {
    if (!selectedId && recommended.length > 0) {
      setSelectedId(recommended[0].id);
    }
  }, [recommended, selectedId]);

  const handleApply = useCallback(() => {
    if (!selected) return;
    onApply(selected.generate(buildImages), locked);
  }, [selected, buildImages, locked, onApply]);

  // Scroll template rail to selected item
  const scrollToSelected = useCallback((id: string) => {
    if (!railRef.current) return;
    const el = railRef.current.querySelector(`[data-template-id="${id}"]`);
    if (el) el.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    scrollToSelected(id);
  }, [scrollToSelected]);

  // Nav arrows for template rail
  const scrollRail = useCallback((dir: "left" | "right") => {
    if (!railRef.current) return;
    const amount = railRef.current.clientWidth * 0.6;
    railRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[800] flex flex-col transition-all duration-500 ease-out",
        visible ? "opacity-100" : "opacity-0 translate-y-4",
      )}
      style={{ background: "linear-gradient(180deg, #0a0a0f 0%, #111118 50%, #0d0d14 100%)" }}
    >
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gx-red/[0.03] blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[200px] bg-blue-500/[0.02] blur-[80px] rounded-full" />
      </div>

      {/* ── Top Bar ── */}
      <div className="relative flex items-center justify-between px-4 py-3 shrink-0">
        <button
          onClick={onSkip}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-xs"
        >
          <X className="h-4 w-4" />
          <span className="hidden sm:inline">Skip</span>
        </button>

        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gx-red/70 font-medium">Design Studio</p>
          <h2 className="text-sm font-bold text-white font-rajdhani">Choose Your Layout</h2>
        </div>

        <button
          onClick={handleApply}
          disabled={!selectedId}
          className={cn(
            "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
            selectedId
              ? "bg-gx-red text-white hover:bg-red-500 shadow-lg shadow-red-500/20"
              : "text-zinc-600 cursor-not-allowed",
          )}
        >
          Apply
        </button>
      </div>

      {/* ── Main Content ── */}
      <div className="relative flex-1 flex flex-col min-h-0 px-4">
        {/* Live Preview Area */}
        <div className="flex-shrink-0 max-w-[320px] sm:max-w-[360px] mx-auto w-full mb-3">
          {selected ? (
            <LivePreview template={selected} images={buildImages} />
          ) : (
            <div className="w-full aspect-[4/5] bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-center">
              <p className="text-xs text-zinc-600">Select a layout below</p>
            </div>
          )}
        </div>

        {/* Template info + lock toggle */}
        {selected && (
          <div className="flex items-center justify-between mb-2 max-w-[360px] mx-auto w-full">
            <div>
              <p className="text-xs font-medium text-white">{selected.name}</p>
              <p className="text-[10px] text-zinc-500">
                {selected.imageCount} {selected.imageCount === 1 ? "photo" : "photos"}
                {selected.previewRects.filter((r) => r.type === "text").length > 0 && " + text"}
              </p>
            </div>
            <button
              onClick={() => setLocked(!locked)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors",
                locked
                  ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  : "bg-orange-500/15 text-orange-400 border border-orange-500/30",
              )}
              title={locked ? "Layout frames are locked. Images can be repositioned inside frames." : "Layout is unlocked. Frames can be moved freely."}
            >
              {locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
              {locked ? "Locked" : "Unlocked"}
            </button>
          </div>
        )}

        {/* Image Tray */}
        {buildImages.length > 0 && (
          <div className="max-w-[360px] mx-auto w-full mb-3">
            <ImageTray images={buildImages} />
          </div>
        )}

        {/* ── Category Pills ── */}
        <div className="flex gap-1.5 mb-2 overflow-x-auto shrink-0" style={{ scrollbarWidth: "none" }}>
          {DISPLAY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-medium shrink-0 transition-all border",
                activeCategory === cat
                  ? "bg-white/10 text-white border-white/20"
                  : "text-zinc-500 border-transparent hover:text-zinc-300",
              )}
            >
              {cat === "Recommended" && <Sparkles className="h-2.5 w-2.5 inline mr-1 -mt-px" />}
              {cat}
            </button>
          ))}
        </div>

        {/* ── Template Rail ── */}
        <div className="relative flex-1 min-h-0">
          {/* Desktop nav arrows */}
          <button
            onClick={() => scrollRail("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors backdrop-blur-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollRail("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors backdrop-blur-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div
            ref={railRef}
            className="flex gap-2 overflow-x-auto pb-3 h-full items-start sm:px-8"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch", scrollSnapType: "x proximity" }}
          >
            {/* Free Style option */}
            <button
              onClick={onSkip}
              className="w-16 shrink-0 scroll-snap-align-center"
            >
              <div className="aspect-square rounded-lg border border-zinc-700 flex items-center justify-center hover:border-zinc-500 transition-colors bg-zinc-900/50">
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider text-center leading-tight">
                  Free<br />Style
                </span>
              </div>
            </button>

            {displayTemplates.map((template) => {
              const isActive = selectedId === template.id;
              return (
                <button
                  key={template.id}
                  data-template-id={template.id}
                  onClick={() => handleSelect(template.id)}
                  className={cn(
                    "w-16 shrink-0 scroll-snap-align-center transition-all",
                    isActive ? "scale-110" : "hover:scale-105",
                  )}
                >
                  <div
                    className={cn(
                      "aspect-square rounded-lg transition-all",
                      isActive
                        ? "ring-2 ring-orange-500 ring-offset-1 ring-offset-[#0d0d14]"
                        : "",
                    )}
                  >
                    <GridIcon template={template} active={isActive} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom safe area + skip */}
      <div className="shrink-0 px-4 pb-4 pt-1 text-center" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <button
          onClick={onSkip}
          className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Skip — start with blank canvas
        </button>
      </div>
    </div>
  );
}
