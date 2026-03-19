"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { X, Sparkles, LayoutGrid } from "lucide-react";
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
  return [...exact.slice(0, 12), ...close.slice(0, 4)];
}

// Filter out unsupported diagonal templates
const SUPPORTED_TEMPLATES = TEMPLATES.filter((t) => t.category !== "Diagonal");
const SUPPORTED_CATEGORIES = CATEGORIES.filter((c) => c !== "Diagonal" && c !== "Custom");

// "Freestyle" pseudo-template
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
  const stroke = active ? "#dc2626" : "rgba(255,255,255,0.4)";

  if (template.id === "__freestyle__") {
    return (
      <svg viewBox="0 0 100 100" className="w-full aspect-square">
        <rect x={2} y={2} width={96} height={96} fill="none" stroke={stroke} strokeWidth={active ? 2.5 : 1.5} rx={5} />
        <rect x={18} y={22} width={28} height={22} fill="none" stroke={stroke} strokeWidth={1} rx={2} transform="rotate(-6 32 33)" />
        <rect x={54} y={18} width={26} height={20} fill="none" stroke={stroke} strokeWidth={1} rx={2} transform="rotate(4 67 28)" />
        <rect x={26} y={56} width={48} height={28} fill="none" stroke={stroke} strokeWidth={1} rx={2} transform="rotate(1.5 50 70)" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className="w-full aspect-square">
      <rect x={2} y={2} width={96} height={96} fill="none" stroke={stroke} strokeWidth={active ? 2.5 : 1.5} rx={5} />
      {template.previewRects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke={stroke} strokeWidth={1} rx={1.5} />
      ))}
    </svg>
  );
}

// ─── Live Preview ───────────────────────────────────────────────

function LivePreview({ template, images, t }: { template: LayoutTemplate; images: BuildImage[]; t: (key: string) => string }) {
  if (template.id === "__freestyle__") {
    return (
      <div className="relative w-full aspect-[4/5] bg-zinc-950/80 rounded-2xl overflow-hidden border border-zinc-700/30 flex items-center justify-center backdrop-blur-sm">
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
    <div className="relative w-full aspect-[4/5] bg-zinc-950/80 rounded-2xl overflow-hidden border border-zinc-700/30 backdrop-blur-sm">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "10% 10%",
        }}
      />
      {imageSlots.map((slot, i) => {
        const img = getImage(images, i);
        return (
          <div key={i} className="absolute overflow-hidden rounded-sm" style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.w}%`, height: `${slot.h}%` }}>
            {img ? (
              <img src={img.url} alt={img.alt || ""} className="w-full h-full object-cover" style={img.objectPosition ? { objectPosition: img.objectPosition } : undefined} draggable={false} />
            ) : (
              <div className="w-full h-full bg-zinc-800/60 flex items-center justify-center">
                <div className="w-5 h-5 rounded border border-dashed border-zinc-600" />
              </div>
            )}
          </div>
        );
      })}
      {textSlots.map((slot, i) => (
        <div key={`t-${i}`} className="absolute flex items-center justify-center" style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.w}%`, height: `${slot.h}%` }}>
          <div className="w-3/4 space-y-1">
            <div className="h-1.5 bg-zinc-700/60 rounded-full w-full" />
            <div className="h-1 bg-zinc-800/60 rounded-full w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Image Tray ─────────────────────────────────────────────────

function ImageTray({ images }: { images: BuildImage[] }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto py-1.5" style={{ scrollbarWidth: "none" }}>
      {images.map((img, i) => (
        <div key={i} className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
          <img src={img.url} alt="" className="w-full h-full object-cover" draggable={false} />
          <div className="absolute top-0 right-0 w-3.5 h-3.5 rounded-bl bg-black/70 text-[7px] font-bold text-white flex items-center justify-center">
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

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const recommended = useMemo(() => getRecommended(SUPPORTED_TEMPLATES, buildImages.length), [buildImages.length]);

  const displayTemplates = useMemo(() => {
    const base = activeCategory === "Recommended"
      ? recommended
      : SUPPORTED_TEMPLATES.filter((t) => t.category === activeCategory);
    return [FREESTYLE_TEMPLATE, ...base];
  }, [activeCategory, recommended]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    if (selectedId === "__freestyle__") return FREESTYLE_TEMPLATE;
    return SUPPORTED_TEMPLATES.find((t) => t.id === selectedId) ?? null;
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId && recommended.length > 0) {
      setSelectedId(recommended[0].id);
    }
  }, [recommended, selectedId]);

  const handleApply = useCallback(() => {
    if (!selected) return;
    if (selected.id === "__freestyle__") { onSkip(); return; }
    onApply(selected.id);
  }, [selected, onApply, onSkip]);

  const catLabel = (cat: string) => {
    const key = `studio.category.${cat.toLowerCase().replace(/ /g, "")}`;
    const translated = t(key);
    return translated !== key ? translated : cat;
  };

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
      {/* Background image + heavy darken */}
      <div className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none" style={{ backgroundImage: "url('/images/studio-bg.jpg')" }} />
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

      {/* ── Top Bar ── */}
      <div className="relative flex items-center justify-between px-4 pb-2 shrink-0" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <button onClick={onSkip} className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors text-xs min-w-[56px]">
          <X className="h-4 w-4" />
          <span className="hidden sm:inline">{t("studio.skip")}</span>
        </button>
        <div className="text-center">
          <p className="text-[9px] uppercase tracking-[0.25em] text-gx-red/80 font-medium">{t("studio.label")}</p>
          <h2 className="text-sm font-bold text-white font-rajdhani">{t("studio.title")}</h2>
        </div>
        <button
          onClick={handleApply}
          disabled={!selectedId}
          className={cn(
            "px-4 py-1.5 rounded-lg text-xs font-bold transition-all min-w-[56px]",
            selectedId ? "bg-gx-red text-white hover:bg-red-500" : "text-zinc-600 cursor-not-allowed",
          )}
        >
          {t("studio.apply")}
        </button>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="relative flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: "none" }}>
        <div className="px-4 max-w-lg mx-auto">
          {/* Live Preview */}
          <div className="max-w-[260px] sm:max-w-[300px] mx-auto mb-3">
            {selected ? (
              <LivePreview template={selected} images={buildImages} t={t} />
            ) : (
              <div className="w-full aspect-[4/5] bg-zinc-950/60 rounded-2xl border border-zinc-800/50 flex items-center justify-center backdrop-blur-sm">
                <p className="text-xs text-zinc-600">{t("studio.selectPrompt")}</p>
              </div>
            )}
          </div>

          {/* Template info */}
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
            <div className="mb-3">
              <ImageTray images={buildImages} />
            </div>
          )}

          {/* Category Pills */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
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

          {/* ── Template Grid (4 columns, wrapping) ── */}
          <div className="grid grid-cols-4 gap-2.5 pb-20">
            {displayTemplates.map((template) => {
              const isActive = selectedId === template.id;
              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedId(template.id)}
                  className={cn(
                    "aspect-square rounded-lg border-2 transition-colors duration-150",
                    isActive
                      ? "border-gx-red bg-gx-red/[0.06]"
                      : "border-transparent hover:border-white/15",
                  )}
                >
                  <GridIcon template={template} active={isActive} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom skip + safe area */}
      <div className="relative shrink-0 text-center px-4 py-2" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
        <button onClick={onSkip} className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">
          {t("studio.skipBlank")}
        </button>
      </div>
    </div>
  );
}
