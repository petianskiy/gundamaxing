"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { motion, Reorder } from "framer-motion";
import { updateHangarSettings } from "@/lib/actions/hangar";
import {
  Check,
  Grid3X3,
  Globe,
  BookOpen,
  Lock,
  Star,
  Pin,
  GripVertical,
  Palette,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ───────────────────────────────────────────────────────── */

interface BuildItem {
  id: string;
  title: string;
  kitName: string;
  thumbnail: string | null;
}

interface HangarFormData {
  hangarTheme: string;
  hangarLayout: string;
  manifesto: string;
  accentColor: string;
  pinnedBuildIds: string[];
  featuredBuildId: string | null;
}

interface HangarSettingsFormProps {
  initialData: HangarFormData;
  userLevel: number;
  builds: BuildItem[];
}

/* ─── Config ──────────────────────────────────────────────────────── */

const THEMES = [
  { value: "CYBER_BAY", label: "Cyber Bay", desc: "Neon-lit industrial hangar with holographic displays", colors: ["#0f172a", "#06b6d4", "#22d3ee", "#164e63"], unlockLevel: 3 },
  { value: "CLEAN_LAB", label: "Clean Lab", desc: "Pristine white workshop with clinical precision", colors: ["#f8fafc", "#e2e8f0", "#94a3b8", "#cbd5e1"], unlockLevel: 9 },
  { value: "DESERT_BATTLEFIELD", label: "Desert Battlefield", desc: "Sun-scorched warzone with sand-worn aesthetic", colors: ["#451a03", "#b45309", "#f59e0b", "#78350f"], unlockLevel: 15 },
  { value: "NEON_TOKYO", label: "Neon Tokyo", desc: "Cyberpunk cityscape dripping with neon glow", colors: ["#1a0025", "#d946ef", "#f0abfc", "#7c3aed"], unlockLevel: 20 },
] as const;

const LAYOUTS = [
  { value: "GALLERY", label: "Gallery", desc: "Clean grid of cards", icon: Grid3X3 },
  { value: "DOME_GALLERY", label: "Dome Gallery", desc: "3D spherical gallery with drag interaction", icon: Globe },
  { value: "STORY", label: "Story", desc: "Cinematic timeline scroll", icon: BookOpen },
] as const;

const ACCENT_COLORS = [
  "#dc2626", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#d946ef", "#ec4899", "#f8fafc",
];

/* ─── Component ───────────────────────────────────────────────────── */

export function HangarSettingsForm({ initialData, userLevel, builds }: HangarSettingsFormProps) {
  const [form, setForm] = useState<HangarFormData>(initialData);
  const [savingField, setSavingField] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save a partial update immediately
  const autoSave = useCallback(async (patch: Partial<HangarFormData>, fieldName: string) => {
    setSavingField(fieldName);
    const result = await updateHangarSettings({
      hangarTheme: patch.hangarTheme,
      hangarLayout: patch.hangarLayout,
      manifesto: patch.manifesto,
      accentColor: patch.accentColor,
      pinnedBuildIds: patch.pinnedBuildIds,
      featuredBuildId: patch.featuredBuildId,
    });
    setSavingField(null);
    if (result.error) {
      toast.error(result.error);
    }
  }, []);

  // Debounced save for text fields
  const debouncedSave = useCallback((patch: Partial<HangarFormData>, fieldName: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => autoSave(patch, fieldName), 800);
  }, [autoSave]);

  // Instant save for click-based fields
  function updateAndSave<K extends keyof HangarFormData>(key: K, value: HangarFormData[K]) {
    const next = { ...form, [key]: value };
    setForm(next);
    autoSave({ [key]: value }, key);
  }

  // Debounced save for text
  function updateAndDebounceSave<K extends keyof HangarFormData>(key: K, value: HangarFormData[K]) {
    const next = { ...form, [key]: value };
    setForm(next);
    debouncedSave({ [key]: value }, key);
  }

  const pinnedBuilds = form.pinnedBuildIds
    .map((id) => builds.find((b) => b.id === id))
    .filter(Boolean) as BuildItem[];

  const unpinnedBuilds = builds.filter((b) => !form.pinnedBuildIds.includes(b.id));

  const togglePin = useCallback(
    (buildId: string) => {
      setForm((prev) => {
        const isPinned = prev.pinnedBuildIds.includes(buildId);
        let next: string[];
        if (isPinned) {
          next = prev.pinnedBuildIds.filter((id) => id !== buildId);
        } else {
          if (prev.pinnedBuildIds.length >= 6) {
            toast.error("Maximum 6 pinned builds");
            return prev;
          }
          next = [...prev.pinnedBuildIds, buildId];
        }
        // Auto-save pinned builds
        autoSave({ pinnedBuildIds: next }, "pinnedBuildIds");
        return { ...prev, pinnedBuildIds: next };
      });
    },
    [autoSave]
  );

  function SavingIndicator({ field }: { field: string }) {
    if (savingField !== field) return null;
    return <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Hangar Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Changes save automatically when you click
        </p>
      </div>

      <div className="space-y-10">
        {/* ── Section: Theme Effects ────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Theme Effects
            </label>
            <SavingIndicator field="hangarTheme" />
          </div>
          <p className="text-xs text-muted-foreground/60">
            Unlock themes as you level up. Your current level: {userLevel}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {THEMES.map((theme) => {
              const isActive = form.hangarTheme === theme.value;
              const isLocked = userLevel < theme.unlockLevel;
              return (
                <motion.button
                  key={theme.value}
                  type="button"
                  whileHover={isLocked ? {} : { scale: 1.01 }}
                  whileTap={isLocked ? {} : { scale: 0.99 }}
                  onClick={() => {
                    if (isLocked) {
                      toast.error(`Reach level ${theme.unlockLevel} to unlock ${theme.label}`);
                      return;
                    }
                    updateAndSave("hangarTheme", theme.value);
                  }}
                  className={cn(
                    "relative flex items-start gap-3 p-3 rounded-xl border text-left transition-colors",
                    isLocked
                      ? "border-border/30 bg-muted/30 opacity-60 cursor-not-allowed"
                      : isActive
                        ? "border-gx-red bg-gx-red/5"
                        : "border-border/50 bg-gx-surface hover:border-border"
                  )}
                >
                  <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2 relative">
                    {theme.colors.map((color, i) => (
                      <div key={i} style={{ backgroundColor: color }} />
                    ))}
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Lock className="h-4 w-4 text-zinc-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-foreground">{theme.label}</p>
                      {isLocked && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400">
                          LVL {theme.unlockLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{theme.desc}</p>
                  </div>
                  {isActive && !isLocked && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gx-red flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* ── Section: Layout Mode ─────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Display Layout
            </label>
            <SavingIndicator field="hangarLayout" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {LAYOUTS.map((layout) => {
              const isActive = form.hangarLayout === layout.value;
              const Icon = layout.icon;
              return (
                <motion.button
                  key={layout.value}
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => updateAndSave("hangarLayout", layout.value)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-colors",
                    isActive
                      ? "border-gx-red bg-gx-red/5"
                      : "border-border/50 bg-gx-surface hover:border-border"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "text-gx-red" : "text-muted-foreground")} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{layout.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{layout.desc}</p>
                  </div>
                  {isActive && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-gx-red flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* ── Section: Accent Color ────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Accent Color
            </label>
            <SavingIndicator field="accentColor" />
          </div>
          <p className="text-xs text-muted-foreground/60">
            Tints your hangar&apos;s highlights, pinned build borders, and timeline accents
          </p>
          <div className="flex flex-wrap gap-2">
            {ACCENT_COLORS.map((color) => {
              const isActive = form.accentColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => updateAndSave("accentColor", color)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center",
                    isActive ? "border-foreground scale-110" : "border-transparent hover:border-border hover:scale-105"
                  )}
                  style={{ backgroundColor: color }}
                >
                  {isActive && (
                    <Check className={cn("h-3.5 w-3.5", color === "#f8fafc" ? "text-zinc-900" : "text-white")} />
                  )}
                </button>
              );
            })}
            <label
              className={cn(
                "w-8 h-8 rounded-full border-2 border-dashed border-border cursor-pointer flex items-center justify-center hover:border-foreground transition-colors",
                !ACCENT_COLORS.includes(form.accentColor) && "border-foreground scale-110"
              )}
              title="Custom color"
            >
              <Palette className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="color"
                value={form.accentColor}
                onChange={(e) => updateAndSave("accentColor", e.target.value)}
                className="sr-only"
              />
            </label>
          </div>
          {/* Live preview */}
          <div className="flex items-center gap-3 mt-2 p-3 rounded-lg border border-border/30 bg-gx-surface">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: form.accentColor }} />
            <span className="text-xs text-muted-foreground">Preview:</span>
            <span className="text-xs font-medium" style={{ color: form.accentColor }}>
              Your accent color
            </span>
            <div className="h-4 w-px bg-border/50" />
            <div className="px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ backgroundColor: form.accentColor }}>
              Pinned
            </div>
          </div>
        </section>

        {/* ── Section: Featured Build ──────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Featured Build
            </label>
            <SavingIndicator field="featuredBuildId" />
          </div>
          <p className="text-xs text-muted-foreground/60">
            Spotlight one build at the top of your hangar
          </p>
          {builds.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Upload builds first to feature one here</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {builds.map((build) => {
                const isActive = form.featuredBuildId === build.id;
                return (
                  <button
                    key={build.id}
                    type="button"
                    onClick={() => updateAndSave("featuredBuildId", isActive ? null : build.id)}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all",
                      isActive
                        ? "border-amber-500/70 bg-amber-500/10"
                        : "border-border/50 bg-gx-surface hover:border-border"
                    )}
                  >
                    <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted shrink-0">
                      {build.thumbnail ? (
                        <Image src={build.thumbnail} alt={build.title} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">N/A</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{build.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{build.kitName}</p>
                    </div>
                    {isActive && <Star className="h-4 w-4 text-amber-500 shrink-0 fill-amber-500" />}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Section: Pinned Builds ───────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Pinned Builds
            </label>
            <SavingIndicator field="pinnedBuildIds" />
          </div>
          <p className="text-xs text-muted-foreground/60">
            Pin up to 6 builds to always show first. Drag to reorder.
          </p>

          {pinnedBuilds.length > 0 && (
            <Reorder.Group
              axis="y"
              values={form.pinnedBuildIds}
              onReorder={(newOrder) => {
                setForm((prev) => ({ ...prev, pinnedBuildIds: newOrder }));
                autoSave({ pinnedBuildIds: newOrder }, "pinnedBuildIds");
              }}
              className="space-y-1.5"
            >
              {pinnedBuilds.map((build) => (
                <Reorder.Item
                  key={build.id}
                  value={build.id}
                  className="flex items-center gap-2 p-2 rounded-lg border border-gx-red/30 bg-gx-red/5 cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
                    {build.thumbnail ? (
                      <Image src={build.thumbnail} alt={build.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">N/A</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{build.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{build.kitName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePin(build.id)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Unpin"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}

          {unpinnedBuilds.length > 0 && (
            <div className="space-y-1.5">
              {pinnedBuilds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3 mb-1">Other builds</p>
              )}
              {unpinnedBuilds.map((build) => (
                <div
                  key={build.id}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-gx-surface"
                >
                  <div className="w-4 shrink-0" />
                  <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
                    {build.thumbnail ? (
                      <Image src={build.thumbnail} alt={build.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">N/A</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{build.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{build.kitName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePin(build.id)}
                    className="p-1.5 rounded-md hover:bg-gx-red/10 text-muted-foreground hover:text-gx-red transition-colors"
                    title="Pin build"
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {builds.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No builds to pin yet</p>
          )}
        </section>

        {/* ── Section: Builder Manifesto ────────────────────────────── */}
        <section className="space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Builder Manifesto
            </label>
            <SavingIndicator field="manifesto" />
          </div>
          <textarea
            value={form.manifesto}
            onChange={(e) => updateAndDebounceSave("manifesto", e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Share your building philosophy, favorite techniques, or what Gunpla means to you..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-red/50 resize-y"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground/60">Displayed on your hangar page</p>
            <p className={cn("text-xs", form.manifesto.length > 450 ? "text-amber-400" : "text-muted-foreground/60")}>
              {form.manifesto.length}/500
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
