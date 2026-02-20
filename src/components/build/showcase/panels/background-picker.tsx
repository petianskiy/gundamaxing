"use client";

import Image from "next/image";
import {
  X,
  Palette,
  ImageIcon,
  Sparkles,
  Upload,
  Loader2,
  Sun,
  Droplets,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BuildImage } from "@/lib/types";
import { ElasticSlider } from "@/components/ui/elastic-slider";
import { useUploadThing } from "@/lib/upload/uploadthing";
import { addBuildImage } from "@/lib/actions/build";
import { useState, useCallback } from "react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────

type Tab = "colors" | "images" | "hangar" | "upload";

interface BackgroundPickerProps {
  images: BuildImage[];
  buildId: string;
  currentBackground: {
    backgroundImageUrl: string | null;
    backgroundColor: string | null;
    backgroundOpacity: number;
    backgroundBlur: number;
  };
  onUpdate: (bg: {
    backgroundImageUrl?: string | null;
    backgroundColor?: string | null;
    backgroundOpacity?: number;
    backgroundBlur?: number;
  }) => void;
  onClose: () => void;
}

// ─── Constants ───────────────────────────────────────────────────

const COLOR_PRESETS = [
  { value: "#000000", label: "Black" },
  { value: "#0f0f12", label: "Near Black" },
  { value: "#18181b", label: "Zinc 900" },
  { value: "#27272a", label: "Zinc 800" },
  { value: "#3f3f46", label: "Zinc 700" },
  { value: "#ffffff", label: "White" },
  { value: "#dc2626", label: "GX Red" },
  { value: "#1d4ed8", label: "Blue" },
  { value: "#059669", label: "Green" },
  { value: "#7c3aed", label: "Purple" },
];

const EFFECT_PRESETS = [
  { value: "preset:noise", label: "Noise", gradient: "bg-zinc-800" },
  { value: "preset:grid", label: "Grid", gradient: "bg-zinc-900" },
  {
    value: "preset:gradient-dark",
    label: "Dark Fade",
    gradient: "bg-gradient-to-br from-zinc-900 to-zinc-950",
  },
  {
    value: "preset:gradient-red",
    label: "Red Fade",
    gradient: "bg-gradient-to-br from-red-950 to-zinc-950",
  },
];

const HANGAR_BACKGROUNDS = Array.from({ length: 10 }, (_, i) => {
  const num = String(i + 1).padStart(2, "0");
  return `/hangar/backgrounds/bg-${num}.jpg`;
});

const TABS: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: "colors", icon: Palette, label: "Colors" },
  { id: "images", icon: ImageIcon, label: "Images" },
  { id: "hangar", icon: Sparkles, label: "Hangar" },
  { id: "upload", icon: Upload, label: "Upload" },
];

// ─── Component ───────────────────────────────────────────────────

export function BackgroundPicker({
  images,
  buildId,
  currentBackground,
  onUpdate,
  onClose,
}: BackgroundPickerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("colors");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload } = useUploadThing("buildImageUpload");

  // ── Upload handler ──────────────────────────────────────────

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const file = files[0];
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file.");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error("Image must be under 8MB.");
        return;
      }

      setIsUploading(true);
      try {
        const result = await startUpload([file]);
        if (!result || result.length === 0) {
          toast.error("Upload failed. Please try again.");
          setIsUploading(false);
          return;
        }

        const uploadedUrl = result[0].ufsUrl;

        // Register as build image
        const formData = new FormData();
        formData.set("buildId", buildId);
        formData.set("url", uploadedUrl);
        await addBuildImage(formData);

        // Set as background
        onUpdate({ backgroundImageUrl: uploadedUrl, backgroundColor: null });
        toast.success("Background uploaded!");
      } catch {
        toast.error("Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [buildId, onUpdate, startUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // ── Render helpers ──────────────────────────────────────────

  const isColorSelected = (color: string) =>
    currentBackground.backgroundColor === color &&
    !currentBackground.backgroundImageUrl;

  const isImageSelected = (url: string) =>
    currentBackground.backgroundImageUrl === url;

  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-20 sm:right-4 z-[500] w-full sm:w-80 max-h-[60vh] sm:max-h-[80vh] bg-zinc-900 border-t sm:border border-zinc-700 sm:rounded-xl rounded-t-xl shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 shrink-0">
        <h3 className="text-sm font-semibold text-white">Background</h3>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-800 shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800",
              )}
              title={tab.label}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4 space-y-4">
          {/* ── Tab: Colors ───────────────────────────────────── */}
          {activeTab === "colors" && (
            <div className="space-y-4">
              {/* Preset swatches */}
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">
                  Presets
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() =>
                        onUpdate({
                          backgroundColor: color.value,
                          backgroundImageUrl: null,
                        })
                      }
                      className={cn(
                        "aspect-square rounded-lg border-2 transition-all hover:scale-110",
                        isColorSelected(color.value)
                          ? "border-blue-500 ring-2 ring-blue-500/30"
                          : "border-zinc-600 hover:border-zinc-400",
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* Custom color */}
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">
                  Custom Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={currentBackground.backgroundColor || "#000000"}
                    onChange={(e) =>
                      onUpdate({
                        backgroundColor: e.target.value,
                        backgroundImageUrl: null,
                      })
                    }
                    className="h-9 w-9 rounded-lg border border-zinc-600 bg-transparent cursor-pointer [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
                  />
                  <span className="text-xs text-zinc-500 font-mono">
                    {currentBackground.backgroundColor || "#000000"}
                  </span>
                </div>
              </div>

              {/* Effect presets */}
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">
                  Effects
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {EFFECT_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() =>
                        onUpdate({
                          backgroundImageUrl: preset.value,
                          backgroundColor: null,
                        })
                      }
                      className={cn(
                        "aspect-square rounded-lg border-2 transition-all relative overflow-hidden group",
                        isImageSelected(preset.value)
                          ? "border-blue-500 ring-2 ring-blue-500/30"
                          : "border-zinc-600 hover:border-zinc-400",
                      )}
                    >
                      <div className={cn("absolute inset-0", preset.gradient)}>
                        {preset.value === "preset:noise" && (
                          <div
                            className="absolute inset-0 opacity-60"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                            }}
                          />
                        )}
                        {preset.value === "preset:grid" && (
                          <div
                            className="absolute inset-0 opacity-30"
                            style={{
                              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                              backgroundSize: "8px 8px",
                            }}
                          />
                        )}
                      </div>
                      <span className="absolute bottom-0 inset-x-0 text-[8px] text-zinc-300 text-center pb-0.5 bg-gradient-to-t from-black/60 to-transparent pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Build Images ─────────────────────────────── */}
          {activeTab === "images" && (
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">
                Build Images
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() =>
                    onUpdate({
                      backgroundImageUrl: null,
                      backgroundColor: null,
                    })
                  }
                  className={cn(
                    "aspect-square rounded-md border text-[10px] text-zinc-500 flex items-center justify-center transition-colors",
                    !currentBackground.backgroundImageUrl &&
                      !currentBackground.backgroundColor
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-zinc-700 hover:border-zinc-500",
                  )}
                >
                  None
                </button>
                {images.map((img) => (
                  <button
                    key={img.id || img.url}
                    onClick={() =>
                      onUpdate({
                        backgroundImageUrl: img.url,
                        backgroundColor: null,
                      })
                    }
                    className={cn(
                      "relative aspect-square rounded-md overflow-hidden border transition-colors",
                      isImageSelected(img.url)
                        ? "border-blue-500 ring-2 ring-blue-500/30"
                        : "border-zinc-700 hover:border-zinc-500",
                    )}
                  >
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
              {images.length === 0 && (
                <p className="text-xs text-zinc-500 text-center mt-3">
                  No images in this build yet.
                </p>
              )}
            </div>
          )}

          {/* ── Tab: Hangar Backgrounds ───────────────────────── */}
          {activeTab === "hangar" && (
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">
                Hangar Backgrounds
              </label>
              <div className="grid grid-cols-3 gap-2">
                {HANGAR_BACKGROUNDS.map((url) => (
                  <button
                    key={url}
                    onClick={() =>
                      onUpdate({
                        backgroundImageUrl: url,
                        backgroundColor: null,
                      })
                    }
                    className={cn(
                      "relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all",
                      isImageSelected(url)
                        ? "border-blue-500 ring-2 ring-blue-500/30"
                        : "border-zinc-700 hover:border-zinc-500",
                    )}
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Tab: Upload ───────────────────────────────────── */}
          {activeTab === "upload" && (
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">
                Upload Background
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
                  isDragging
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-600 hover:border-zinc-400 bg-zinc-800/50",
                  isUploading && "pointer-events-none opacity-60",
                )}
                onClick={() => {
                  if (isUploading) return;
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.files) {
                      handleFiles(Array.from(target.files));
                    }
                  };
                  input.click();
                }}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-6 w-6 text-blue-400 animate-spin mb-2" />
                    <span className="text-xs text-zinc-400">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-zinc-500 mb-2" />
                    <span className="text-xs text-zinc-400 text-center">
                      Drop an image here or click to browse
                    </span>
                    <span className="text-[10px] text-zinc-600 mt-1">
                      Max 8MB
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Sliders (always visible) ──────────────────────── */}
        <div className="px-4 pb-4 space-y-3 border-t border-zinc-800 pt-3">
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 flex justify-between">
              <span>Opacity</span>
              <span className="text-zinc-500 tabular-nums">
                {Math.round(currentBackground.backgroundOpacity * 100)}%
              </span>
            </label>
            <ElasticSlider
              startingValue={0}
              maxValue={100}
              defaultValue={Math.round(
                currentBackground.backgroundOpacity * 100,
              )}
              isStepped
              stepSize={1}
              leftIcon={<Sun className="h-3 w-3" />}
              rightIcon={<Sun className="h-5 w-5" />}
              onChange={(val) => onUpdate({ backgroundOpacity: val / 100 })}
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 flex justify-between">
              <span>Blur</span>
              <span className="text-zinc-500 tabular-nums">
                {currentBackground.backgroundBlur}px
              </span>
            </label>
            <ElasticSlider
              startingValue={0}
              maxValue={20}
              defaultValue={currentBackground.backgroundBlur}
              isStepped
              stepSize={1}
              leftIcon={<Droplets className="h-3 w-3" />}
              rightIcon={<Droplets className="h-5 w-5" />}
              onChange={(val) => onUpdate({ backgroundBlur: val })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
