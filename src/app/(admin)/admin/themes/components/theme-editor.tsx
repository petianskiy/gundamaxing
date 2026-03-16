"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
  Film,
  Layers,
  Sparkles,
} from "lucide-react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { useUploadThing } from "@/lib/upload/uploadthing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { HangarThemeConfigUI } from "@/lib/data/admin-themes";

/* ─── Types ───────────────────────────────────────────────────────── */

export interface ThemeFormData {
  id?: string;
  name: string;
  badgeColor: string;
  unlockLevel: number;
  backgroundType: string;
  backgroundImages: string[] | null;
  backgroundVideoUrl: string | null;
  backgroundPosterUrl: string | null;
  carouselInterval: number;
  dimness: number;
  effects: { type: string; color: string; size: number; speed: number; density: number }[] | null;
  gridConfig: { topOffset: number; leftOffset: number; width: number; columns: number } | null;
}

interface ThemeEditorProps {
  initialData?: HangarThemeConfigUI;
  onSubmit: (data: ThemeFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const EFFECT_TYPES = [
  "Floating Embers",
  "Snow/Dust",
  "Sakura Petals",
  "Digital Rain",
  "Glowing Orbs",
  "Energy Sparks",
  "Smoke Wisps",
];

const BG_TYPES = [
  { value: "static", label: "Static Image", icon: ImageIcon },
  { value: "carousel", label: "Image Carousel", icon: Layers },
  { value: "video", label: "Video", icon: Film },
];

/* ─── Component ───────────────────────────────────────────────────── */

export function ThemeEditor({ initialData, onSubmit, onCancel, loading }: ThemeEditorProps) {
  const [form, setForm] = useState<ThemeFormData>({
    id: initialData?.id,
    name: initialData?.name ?? "",
    badgeColor: initialData?.badgeColor ?? "#dc2626",
    unlockLevel: initialData?.unlockLevel ?? 1,
    backgroundType: initialData?.backgroundType ?? "carousel",
    backgroundImages: initialData?.backgroundImages ?? [],
    backgroundVideoUrl: initialData?.backgroundVideoUrl ?? null,
    backgroundPosterUrl: initialData?.backgroundPosterUrl ?? null,
    carouselInterval: initialData?.carouselInterval ?? 8,
    dimness: initialData?.dimness ?? 0.6,
    effects: initialData?.effects ?? [],
    gridConfig: initialData?.gridConfig ?? { topOffset: 80, leftOffset: 5, width: 90, columns: 3 },
  });

  const [imageUrlInput, setImageUrlInput] = useState("");
  const [videoUrlInput, setVideoUrlInput] = useState(form.backgroundVideoUrl ?? "");
  const [posterUrlInput, setPosterUrlInput] = useState(form.backgroundPosterUrl ?? "");
  const [previewIdx, setPreviewIdx] = useState(0);

  const { startUpload: startImageUpload, isUploading: isUploadingImage } = useUploadThing("bannerUpload", {
    onClientUploadComplete: (res) => {
      if (res?.[0]?.ufsUrl) {
        if (form.backgroundType === "static") {
          setForm((prev) => ({ ...prev, backgroundImages: [res[0].ufsUrl] }));
        } else {
          setForm((prev) => ({
            ...prev,
            backgroundImages: [...(prev.backgroundImages ?? []), res[0].ufsUrl],
          }));
        }
        toast.success("Image uploaded");
      }
    },
    onUploadError: (err) => {
      toast.error(err.message || "Upload failed");
    },
  });

  // Preview carousel
  useEffect(() => {
    if (form.backgroundType !== "carousel" || !form.backgroundImages?.length) return;
    const interval = setInterval(() => {
      setPreviewIdx((prev) => (prev + 1) % (form.backgroundImages?.length ?? 1));
    }, (form.carouselInterval ?? 8) * 1000);
    return () => clearInterval(interval);
  }, [form.backgroundType, form.backgroundImages?.length, form.carouselInterval]);

  function addImageUrl() {
    if (!imageUrlInput.trim()) return;
    if (form.backgroundType === "static") {
      setForm((prev) => ({ ...prev, backgroundImages: [imageUrlInput.trim()] }));
    } else {
      setForm((prev) => ({
        ...prev,
        backgroundImages: [...(prev.backgroundImages ?? []), imageUrlInput.trim()],
      }));
    }
    setImageUrlInput("");
  }

  function removeImage(idx: number) {
    setForm((prev) => ({
      ...prev,
      backgroundImages: (prev.backgroundImages ?? []).filter((_, i) => i !== idx),
    }));
  }

  function addEffect() {
    setForm((prev) => ({
      ...prev,
      effects: [
        ...(prev.effects ?? []),
        { type: "Floating Embers", color: "#ff6b35", size: 3, speed: 1, density: 50 },
      ],
    }));
  }

  function updateEffect(idx: number, field: string, value: string | number) {
    setForm((prev) => ({
      ...prev,
      effects: (prev.effects ?? []).map((e, i) => (i === idx ? { ...e, [field]: value } : e)),
    }));
  }

  function removeEffect(idx: number) {
    setForm((prev) => ({
      ...prev,
      effects: (prev.effects ?? []).filter((_, i) => i !== idx),
    }));
  }

  function updateGrid(field: string, value: number) {
    setForm((prev) => ({
      ...prev,
      gridConfig: { ...(prev.gridConfig ?? { topOffset: 80, leftOffset: 5, width: 90, columns: 3 }), [field]: value },
    }));
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    // Update video/poster from inputs
    const data: ThemeFormData = {
      ...form,
      backgroundVideoUrl: form.backgroundType === "video" ? videoUrlInput.trim() || null : null,
      backgroundPosterUrl: form.backgroundType === "video" ? posterUrlInput.trim() || null : null,
      backgroundImages:
        form.backgroundType === "video"
          ? null
          : form.backgroundImages && form.backgroundImages.length > 0
            ? form.backgroundImages
            : null,
    };
    onSubmit(data);
  }

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await startImageUpload([file]);
      e.target.value = "";
    },
    [startImageUpload]
  );

  // Preview background
  const previewBg = form.backgroundType === "video"
    ? form.backgroundPosterUrl || videoUrlInput
    : form.backgroundImages?.[previewIdx] || null;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 space-y-8">
      {/* ── Section 1: Basic Settings ─────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Basic Settings
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Neon Tokyo"
              maxLength={50}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-gx-red/50"
            />
          </div>

          {/* Badge Color */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Badge Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.badgeColor}
                onChange={(e) => setForm((prev) => ({ ...prev, badgeColor: e.target.value }))}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
              />
              <input
                type="text"
                value={form.badgeColor}
                onChange={(e) => setForm((prev) => ({ ...prev, badgeColor: e.target.value }))}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-gx-red/50"
              />
            </div>
          </div>

          {/* Minimum Level */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Minimum Level</label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.unlockLevel}
              onChange={(e) => setForm((prev) => ({ ...prev, unlockLevel: parseInt(e.target.value) || 1 }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gx-red/50"
            />
          </div>
        </div>
      </section>

      {/* ── Section 2: Background ─────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Background
        </h3>

        {/* Type selector */}
        <div className="grid grid-cols-3 gap-2">
          {BG_TYPES.map((bgType) => {
            const isActive = form.backgroundType === bgType.value;
            const Icon = bgType.icon;
            return (
              <button
                key={bgType.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, backgroundType: bgType.value }))}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border text-left transition-colors",
                  isActive
                    ? "border-gx-red bg-gx-red/5"
                    : "border-border/50 bg-gx-surface hover:border-border"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-gx-red" : "text-muted-foreground")} />
                <span className="text-sm font-medium text-foreground">{bgType.label}</span>
              </button>
            );
          })}
        </div>

        {/* Static / Carousel images */}
        {(form.backgroundType === "static" || form.backgroundType === "carousel") && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Paste image URL..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-gx-red/50"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImageUrl())}
              />
              <button
                type="button"
                onClick={addImageUrl}
                className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                Add
              </button>
              <label className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="sr-only"
                />
              </label>
              {isUploadingImage && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>

            {/* Image list */}
            {form.backgroundImages && form.backgroundImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {form.backgroundImages.map((url, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-border/50 aspect-video bg-muted">
                    <Image src={url} alt="" fill className="object-cover" sizes="200px" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px]">
                      {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Carousel interval */}
            {form.backgroundType === "carousel" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Carousel Interval</label>
                  <span className="text-xs text-muted-foreground">{form.carouselInterval}s</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={20}
                  step={1}
                  value={form.carouselInterval}
                  onChange={(e) => setForm((prev) => ({ ...prev, carouselInterval: parseInt(e.target.value) }))}
                  className="w-full accent-gx-red h-1"
                />
              </div>
            )}
          </div>
        )}

        {/* Video */}
        {form.backgroundType === "video" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Video URL</label>
              <input
                type="text"
                value={videoUrlInput}
                onChange={(e) => {
                  setVideoUrlInput(e.target.value);
                  setForm((prev) => ({ ...prev, backgroundVideoUrl: e.target.value || null }));
                }}
                placeholder="https://..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-gx-red/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Poster Image URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={posterUrlInput}
                  onChange={(e) => {
                    setPosterUrlInput(e.target.value);
                    setForm((prev) => ({ ...prev, backgroundPosterUrl: e.target.value || null }));
                  }}
                  placeholder="Fallback image while video loads..."
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-gx-red/50"
                />
                <label className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const res = await startImageUpload([file]);
                      if (res?.[0]?.ufsUrl) {
                        setPosterUrlInput(res[0].ufsUrl);
                        setForm((prev) => ({ ...prev, backgroundPosterUrl: res[0].ufsUrl }));
                      }
                      e.target.value = "";
                    }}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Dimness */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Dimness</label>
            <span className="text-xs text-muted-foreground">{Math.round(form.dimness * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={0.8}
            step={0.05}
            value={form.dimness}
            onChange={(e) => setForm((prev) => ({ ...prev, dimness: parseFloat(e.target.value) }))}
            className="w-full accent-gx-red h-1"
          />
        </div>
      </section>

      {/* ── Section 3: Effects ────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Effects
          </h3>
          <button
            type="button"
            onClick={addEffect}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/50 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Effect
          </button>
        </div>

        {form.effects && form.effects.length > 0 ? (
          <div className="space-y-3">
            {form.effects.map((effect, idx) => (
              <div key={idx} className="rounded-lg border border-border/50 bg-gx-surface p-3 space-y-3">
                <div className="flex items-center gap-3">
                  {/* Type */}
                  <select
                    value={effect.type}
                    onChange={(e) => updateEffect(idx, "type", e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gx-red/50"
                  >
                    {EFFECT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  {/* Color */}
                  <input
                    type="color"
                    value={effect.color}
                    onChange={(e) => updateEffect(idx, "color", e.target.value)}
                    className="w-8 h-8 rounded border border-border cursor-pointer"
                  />

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeEffect(idx)}
                    className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Size */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-muted-foreground">Size</label>
                      <span className="text-[10px] text-muted-foreground">{effect.size}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={0.5}
                      value={effect.size}
                      onChange={(e) => updateEffect(idx, "size", parseFloat(e.target.value))}
                      className="w-full accent-gx-red h-1"
                    />
                  </div>

                  {/* Speed */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-muted-foreground">Speed</label>
                      <span className="text-[10px] text-muted-foreground">{effect.speed}</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={5}
                      step={0.1}
                      value={effect.speed}
                      onChange={(e) => updateEffect(idx, "speed", parseFloat(e.target.value))}
                      className="w-full accent-gx-red h-1"
                    />
                  </div>

                  {/* Density */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-muted-foreground">Density</label>
                      <span className="text-[10px] text-muted-foreground">{effect.density}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={100}
                      step={1}
                      value={effect.density}
                      onChange={(e) => updateEffect(idx, "density", parseInt(e.target.value))}
                      className="w-full accent-gx-red h-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No effects added. Click &quot;Add Effect&quot; to add particle effects.</p>
        )}
      </section>

      {/* ── Section 4: Grid Layout ────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Grid Layout
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Top offset */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Top Offset</label>
              <span className="text-xs text-muted-foreground">{form.gridConfig?.topOffset ?? 80}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={200}
              step={5}
              value={form.gridConfig?.topOffset ?? 80}
              onChange={(e) => updateGrid("topOffset", parseInt(e.target.value))}
              className="w-full accent-gx-red h-1"
            />
          </div>

          {/* Left offset */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Left Offset</label>
              <span className="text-xs text-muted-foreground">{form.gridConfig?.leftOffset ?? 5}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={form.gridConfig?.leftOffset ?? 5}
              onChange={(e) => updateGrid("leftOffset", parseInt(e.target.value))}
              className="w-full accent-gx-red h-1"
            />
          </div>

          {/* Width */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Width</label>
              <span className="text-xs text-muted-foreground">{form.gridConfig?.width ?? 90}%</span>
            </div>
            <input
              type="range"
              min={60}
              max={100}
              step={1}
              value={form.gridConfig?.width ?? 90}
              onChange={(e) => updateGrid("width", parseInt(e.target.value))}
              className="w-full accent-gx-red h-1"
            />
          </div>

          {/* Columns */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Columns</label>
              <span className="text-xs text-muted-foreground">{form.gridConfig?.columns ?? 3}</span>
            </div>
            <input
              type="range"
              min={2}
              max={6}
              step={1}
              value={form.gridConfig?.columns ?? 3}
              onChange={(e) => updateGrid("columns", parseInt(e.target.value))}
              className="w-full accent-gx-red h-1"
            />
          </div>
        </div>
      </section>

      {/* ── Section 5: Preview ────────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Preview
        </h3>

        <div className="relative rounded-xl overflow-hidden border border-border/50 aspect-video bg-zinc-950">
          {/* Background */}
          {previewBg && (
            <Image
              src={previewBg}
              alt="Preview background"
              fill
              className="object-cover"
              sizes="600px"
            />
          )}

          {/* Dimness overlay */}
          <div
            className="absolute inset-0 z-[1]"
            style={{ backgroundColor: `rgba(0, 0, 0, ${form.dimness})` }}
          />

          {/* Grid preview */}
          <div
            className="absolute z-[2]"
            style={{
              top: `${((form.gridConfig?.topOffset ?? 80) / 400) * 100}%`,
              left: `${form.gridConfig?.leftOffset ?? 5}%`,
              width: `${form.gridConfig?.width ?? 90}%`,
            }}
          >
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${form.gridConfig?.columns ?? 3}, 1fr)`,
              }}
            >
              {Array.from({ length: (form.gridConfig?.columns ?? 3) * 2 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] rounded bg-white/10 border border-white/5"
                />
              ))}
            </div>
          </div>

          {/* Theme name badge */}
          <div className="absolute top-3 left-3 z-[3]">
            <span
              className="px-2 py-1 rounded text-xs font-bold text-white"
              style={{ backgroundColor: form.badgeColor }}
            >
              {form.name || "Theme Name"}
            </span>
          </div>

          {/* Effect indicators */}
          {form.effects && form.effects.length > 0 && (
            <div className="absolute top-3 right-3 z-[3] flex items-center gap-1">
              {form.effects.map((effect, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 rounded text-[9px] text-white/80 bg-white/10 backdrop-blur-sm"
                >
                  {effect.type}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Actions ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/30">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gx-red text-white text-sm font-medium hover:bg-gx-red/90 disabled:opacity-50 transition-colors"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {initialData ? "Save Changes" : "Create Theme"}
        </button>
      </div>
    </div>
  );
}
