"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Sparkles, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { TEMPLATES, CATEGORIES, type LayoutTemplate } from "./panels/template-picker-panel";
import type { BuildImage } from "@/lib/types";

// ─── Helpers ────────────────────────────────────────────────────

function getImage(images: BuildImage[], index: number): BuildImage | null {
  if (images.length === 0) return null;
  return images[index % images.length] ?? null;
}

function getRecommended(templates: LayoutTemplate[], imageCount: number): LayoutTemplate[] {
  const exact = templates.filter((t) => t.imageCount === imageCount);
  const close = templates.filter((t) => Math.abs(t.imageCount - imageCount) === 1 && t.imageCount > 0);
  return [...exact.slice(0, 8), ...close.slice(0, 4)];
}

// Filter out broken diagonal templates — the canvas only supports rectangular elements
const SUPPORTED_TEMPLATES = TEMPLATES.filter((t) => t.category !== "Diagonal");
const SUPPORTED_CATEGORIES = CATEGORIES.filter((c) => c !== "Diagonal" && c !== "Custom");

// "Freestyle" pseudo-template — blank canvas, user places elements manually
const FREESTYLE_TEMPLATE: LayoutTemplate = {
  id: "__freestyle__",
  name: "Freestyle",
  category: "Basic",
  imageCount: 0,
  previewRects: [],
  generate: () => [],
};

// ─── Grid Icon ──────────────────────────────────────────────────

function GridIcon({ template, active }: { template: LayoutTemplate; active: boolean }) {
  const stroke = active ? "#dc2626" : "rgba(255,255,255,0.35)";
  const fill = active ? "rgba(249,115,22,0.08)" : "none";

  // Freestyle gets a special icon
  if (template.id === "__freestyle__") {
    return (
      <svg viewBox="0 0 100 100" className="w-full aspect-square">
        <rect x={1} y={1} width={98} height={98} fill={fill} stroke={stroke} strokeWidth={active ? 2 : 1} rx={4} />
        <rect x={15} y={20} width={30} height={25} fill="none" stroke={stroke} strokeWidth={0.8} rx={2} transform="rotate(-8 30 32)" />
        <rect x={55} y={15} width={28} height={22} fill="none" stroke={stroke} strokeWidth={0.8} rx={2} transform="rotate(5 69 26)" />
        <rect x={25} y={55} width={50} height={30} fill="none" stroke={stroke} strokeWidth={0.8} rx={2} transform="rotate(2 50 70)" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className="w-full aspect-square">
      <rect x={1} y={1} width={98} height={98} fill={fill} stroke={stroke} strokeWidth={active ? 2 : 1} rx={4} />
      {template.previewRects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke={stroke} strokeWidth={0.8} rx={1} />
      ))}
    </svg>
  );
}

// ─── Live Preview ───────────────────────────────────────────────

function LivePreview({ template, images, t }: { template: LayoutTemplate; images: BuildImage[]; t: (key: string) => string }) {
  // Freestyle preview — scattered images
  if (template.id === "__freestyle__") {
    return (
      <div className="relative w-full aspect-[4/5] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-700/50 flex items-center justify-center">
        <div className="text-center px-6">
          <LayoutGrid className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-xs text-zinc-500">{t("studio.freestyleDesc")}</p>
        </div>
      </div>
    );
  }

  const imageSlots = template.previewRects.filter((r) => r.type === "image");
  const textSlots = template.previewRects.filter((r) => r.type === "text" || r.type === "meta");

  return (
    <div className="relative w-full aspect-[4/5] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-700/50">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "10% 10%",
        }}
      />
      {imageSlots.map((slot, i) => {
        const img = getImage(images, i);
        return (
          <div
            key={i}
            className="absolute overflow-hidden rounded-sm"
            style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.w}%`, height: `${slot.h}%` }}
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
      {textSlots.map((slot, i) => (
        <div
          key={`t-${i}`}
          className="absolute flex items-center justify-center"
          style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.w}%`, height: `${slot.h}%` }}
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

// ─── Main Component ─────────────────────────────────────────────

const DISPLAY_CATEGORIES = ["Recommended", ...SUPPORTED_CATEGORIES] as const;

interface TemplateChooserOverlayProps {
  buildImages: BuildImage[];
  onApply: (templateId: string) => void;
  onSkip: () => void;
}

export function TemplateChooserOverlay({ buildImages, onApply, onSkip }: TemplateChooserOverlayProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("Recommended");
  const [visible, setVisible] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const recommended = useMemo(() => getRecommended(SUPPORTED_TEMPLATES, buildImages.length), [buildImages.length]);

  const displayTemplates = useMemo(() => {
    const base = activeCategory === "Recommended"
      ? recommended
      : SUPPORTED_TEMPLATES.filter((t) => t.category === activeCategory);
    // Prepend Freestyle as first option in every category
    return [FREESTYLE_TEMPLATE, ...base];
  }, [activeCategory, recommended]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    if (selectedId === "__freestyle__") return FREESTYLE_TEMPLATE;
    return SUPPORTED_TEMPLATES.find((t) => t.id === selectedId) ?? null;
  }, [selectedId]);

  // Auto-select first recommended template
  useEffect(() => {
    if (!selectedId && recommended.length > 0) {
      setSelectedId(recommended[0].id);
    }
  }, [recommended, selectedId]);

  const handleApply = useCallback(() => {
    if (!selected) return;
    if (selected.id === "__freestyle__") {
      onSkip();
      return;
    }
    onApply(selected.id);
  }, [selected, onApply, onSkip]);

  const scrollToSelected = useCallback((id: string) => {
    if (!railRef.current) return;
    const el = railRef.current.querySelector(`[data-template-id="${id}"]`);
    if (el) el.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    scrollToSelected(id);
  }, [scrollToSelected]);

  const scrollRail = useCallback((dir: "left" | "right") => {
    if (!railRef.current) return;
    const amount = railRef.current.clientWidth * 0.6;
    railRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }, []);

  // Translated category names
  const catLabel = (cat: string) => {
    const key = `studio.category.${cat.toLowerCase().replace(/ /g, "")}`;
    const translated = t(key);
    return translated !== key ? translated : cat;
  };

  // Photo count label
  const photoLabel = (template: LayoutTemplate): string => {
    if (template.id === "__freestyle__") return t("studio.freestyleHint");
    const count = template.imageCount;
    const textCount = template.previewRects.filter((r) => r.type === "text").length;
    const photoStr = count === 1 ? t("studio.photoSingular") : t("studio.photoPlural", { count: String(count) });
    if (textCount > 0) return `${photoStr} + ${t("studio.text")}`;
    return photoStr;
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[800] flex flex-col transition-all duration-500 ease-out",
        visible ? "opacity-100" : "opacity-0 translate-y-4",
      )}
      style={{ background: "#09090b" }}
    >
      {/* Background image + darken */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
        style={{ backgroundImage: "url('/images/builds-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/70 pointer-events-none" />

      {/* Subtle red accent glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gx-red/[0.04] blur-[120px] rounded-full" />
      </div>

      {/* ── Top Bar ── */}
      <div className="relative flex items-center justify-between px-4 shrink-0" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <button
          onClick={onSkip}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-xs min-w-[60px]"
        >
          <X className="h-4 w-4" />
          <span className="hidden sm:inline">{t("studio.skip")}</span>
        </button>

        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gx-red/70 font-medium">
            {t("studio.label")}
          </p>
          <h2 className="text-sm font-bold text-white font-rajdhani">
            {t("studio.title")}
          </h2>
        </div>

        <button
          onClick={handleApply}
          disabled={!selectedId}
          className={cn(
            "px-4 py-1.5 rounded-lg text-xs font-bold transition-all min-w-[60px]",
            selectedId
              ? "bg-gx-red text-white hover:bg-red-500 shadow-lg shadow-red-500/20"
              : "text-zinc-600 cursor-not-allowed",
          )}
        >
          {t("studio.apply")}
        </button>
      </div>

      {/* ── Main Content ── */}
      <div className="relative flex-1 flex flex-col min-h-0 px-4">
        {/* Live Preview */}
        <div className="flex-shrink-0 max-w-[280px] sm:max-w-[340px] mx-auto w-full mb-2">
          {selected ? (
            <LivePreview template={selected} images={buildImages} t={t} />
          ) : (
            <div className="w-full aspect-[4/5] bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-center">
              <p className="text-xs text-zinc-600">{t("studio.selectPrompt")}</p>
            </div>
          )}
        </div>

        {/* Template name + photo count */}
        {selected && (
          <div className="text-center mb-2">
            <p className="text-xs font-medium text-white">
              {selected.id === "__freestyle__" ? t("studio.freestyle") : selected.name}
            </p>
            <p className="text-[10px] text-zinc-500">{photoLabel(selected)}</p>
          </div>
        )}

        {/* Image Tray */}
        {buildImages.length > 0 && (
          <div className="max-w-[340px] mx-auto w-full mb-2">
            <ImageTray images={buildImages} />
          </div>
        )}

        {/* Category Pills */}
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
              {catLabel(cat)}
            </button>
          ))}
        </div>

        {/* Template Rail */}
        <div className="relative flex-1 min-h-0">
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
            {displayTemplates.map((template) => {
              const isActive = selectedId === template.id;
              return (
                <button
                  key={template.id}
                  data-template-id={template.id}
                  onClick={() => handleSelect(template.id)}
                  className={cn(
                    "w-16 shrink-0 transition-all",
                    isActive ? "scale-110" : "hover:scale-105",
                  )}
                  style={{ scrollSnapAlign: "center" }}
                >
                  <div
                    className={cn(
                      "aspect-square rounded-lg transition-all",
                      isActive ? "ring-2 ring-gx-red ring-offset-1 ring-offset-[#09090b]" : "",
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

      {/* Bottom skip link */}
      <div className="shrink-0 px-4 pb-4 pt-1 text-center" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <button onClick={onSkip} className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
          {t("studio.skipBlank")}
        </button>
      </div>
    </div>
  );
}
