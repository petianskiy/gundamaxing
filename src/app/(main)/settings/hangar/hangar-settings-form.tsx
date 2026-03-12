"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { motion, Reorder } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n/context";
import { updateHangarSettings } from "@/lib/actions/hangar";
import {
  Check,
  Grid3X3,
  Layout,
  BookOpen,
  Lock,
  Star,
  Pin,
  PinOff,
  GripVertical,
  Palette,
  X,
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
  {
    value: "CYBER_BAY",
    label: "Cyber Bay",
    desc: "Neon-lit industrial hangar with holographic displays",
    colors: ["#0f172a", "#06b6d4", "#22d3ee", "#164e63"],
    unlockLevel: 3,
  },
  {
    value: "CLEAN_LAB",
    label: "Clean Lab",
    desc: "Pristine white workshop with clinical precision",
    colors: ["#f8fafc", "#e2e8f0", "#94a3b8", "#cbd5e1"],
    unlockLevel: 9,
  },
  {
    value: "DESERT_BATTLEFIELD",
    label: "Desert Battlefield",
    desc: "Sun-scorched warzone with sand-worn aesthetic",
    colors: ["#451a03", "#b45309", "#f59e0b", "#78350f"],
    unlockLevel: 15,
  },
  {
    value: "NEON_TOKYO",
    label: "Neon Tokyo",
    desc: "Cyberpunk cityscape dripping with neon glow",
    colors: ["#1a0025", "#d946ef", "#f0abfc", "#7c3aed"],
    unlockLevel: 20,
  },
] as const;

const LAYOUTS = [
  {
    value: "GALLERY",
    label: "Gallery",
    desc: "Clean grid layout",
    icon: Grid3X3,
  },
  {
    value: "BLUEPRINT",
    label: "Blueprint",
    desc: "Technical blueprint view",
    icon: Layout,
  },
  {
    value: "STORY",
    label: "Story",
    desc: "Narrative scroll layout",
    icon: BookOpen,
  },
] as const;

const ACCENT_COLORS = [
  "#dc2626", // red (default / gx-red)
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f8fafc", // white
];

/* ─── Component ───────────────────────────────────────────────────── */

export function HangarSettingsForm({ initialData, userLevel, builds }: HangarSettingsFormProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<HangarFormData>(initialData);

  function updateField<K extends keyof HangarFormData>(key: K, value: HangarFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const pinnedBuilds = form.pinnedBuildIds
    .map((id) => builds.find((b) => b.id === id))
    .filter(Boolean) as BuildItem[];

  const unpinnedBuilds = builds.filter((b) => !form.pinnedBuildIds.includes(b.id));

  const togglePin = useCallback(
    (buildId: string) => {
      setForm((prev) => {
        const isPinned = prev.pinnedBuildIds.includes(buildId);
        if (isPinned) {
          return { ...prev, pinnedBuildIds: prev.pinnedBuildIds.filter((id) => id !== buildId) };
        }
        if (prev.pinnedBuildIds.length >= 6) {
          toast.error("Maximum 6 pinned builds");
          return prev;
        }
        return { ...prev, pinnedBuildIds: [...prev.pinnedBuildIds, buildId] };
      });
    },
    []
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const result = await updateHangarSettings({
      hangarTheme: form.hangarTheme,
      hangarLayout: form.hangarLayout,
      manifesto: form.manifesto,
      accentColor: form.accentColor,
      pinnedBuildIds: form.pinnedBuildIds,
      featuredBuildId: form.featuredBuildId,
    });

    setSaving(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Hangar settings saved!");
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Hangar Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize how your hangar looks and organize your builds
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* ── Section: Theme Effects ────────────────────────────────── */}
        <section className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Theme Effects
            </label>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Unlock themes as you level up. Your current level: {userLevel}
            </p>
          </div>
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
                    updateField("hangarTheme", theme.value);
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
                  {/* Color preview */}
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
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {theme.desc}
                    </p>
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
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Display Layout
          </label>
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
                  onClick={() => updateField("hangarLayout", layout.value)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-colors",
                    isActive
                      ? "border-gx-red bg-gx-red/5"
                      : "border-border/50 bg-gx-surface hover:border-border"
                  )}
                >
                  <Icon
                    className={cn("h-5 w-5", isActive ? "text-gx-red" : "text-muted-foreground")}
                  />
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
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Accent Color
            </label>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Tints your hangar&apos;s highlights, borders, and buttons
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ACCENT_COLORS.map((color) => {
              const isActive = form.accentColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => updateField("accentColor", color)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center",
                    isActive
                      ? "border-foreground scale-110"
                      : "border-transparent hover:border-border hover:scale-105"
                  )}
                  style={{ backgroundColor: color }}
                >
                  {isActive && (
                    <Check
                      className={cn(
                        "h-3.5 w-3.5",
                        color === "#f8fafc" ? "text-zinc-900" : "text-white"
                      )}
                    />
                  )}
                </button>
              );
            })}
            {/* Custom color input */}
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
                onChange={(e) => updateField("accentColor", e.target.value)}
                className="sr-only"
              />
            </label>
          </div>
        </section>

        {/* ── Section: Featured Build ──────────────────────────────── */}
        <section className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Featured Build
            </label>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Spotlight one build at the top of your hangar
            </p>
          </div>
          {builds.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Upload builds first to feature one here
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {builds.map((build) => {
                const isActive = form.featuredBuildId === build.id;
                return (
                  <button
                    key={build.id}
                    type="button"
                    onClick={() =>
                      updateField("featuredBuildId", isActive ? null : build.id)
                    }
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all",
                      isActive
                        ? "border-amber-500/70 bg-amber-500/10"
                        : "border-border/50 bg-gx-surface hover:border-border"
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted shrink-0">
                      {build.thumbnail ? (
                        <Image
                          src={build.thumbnail}
                          alt={build.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">
                          N/A
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{build.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{build.kitName}</p>
                    </div>
                    {isActive && (
                      <Star className="h-4 w-4 text-amber-500 shrink-0 fill-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Section: Pinned Builds ───────────────────────────────── */}
        <section className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Pinned Builds
            </label>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Pin up to 6 builds to always show first. Drag to reorder.
            </p>
          </div>

          {/* Pinned list — reorderable */}
          {pinnedBuilds.length > 0 && (
            <Reorder.Group
              axis="y"
              values={form.pinnedBuildIds}
              onReorder={(newOrder) => updateField("pinnedBuildIds", newOrder)}
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
                      <Image
                        src={build.thumbnail}
                        alt={build.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">
                        N/A
                      </div>
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

          {/* Unpinned builds */}
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
                  <div className="w-4 shrink-0" /> {/* spacer for alignment */}
                  <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
                    {build.thumbnail ? (
                      <Image
                        src={build.thumbnail}
                        alt={build.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">
                        N/A
                      </div>
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
            <p className="text-sm text-muted-foreground italic">
              No builds to pin yet
            </p>
          )}
        </section>

        {/* ── Section: Builder Manifesto ────────────────────────────── */}
        <section className="space-y-1.5">
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Builder Manifesto
          </label>
          <Textarea
            value={form.manifesto}
            onChange={(e) => updateField("manifesto", e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Share your building philosophy, favorite techniques, or what Gunpla means to you..."
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground/60">Displayed on your hangar page</p>
            <p
              className={cn(
                "text-xs",
                form.manifesto.length > 450 ? "text-amber-400" : "text-muted-foreground/60"
              )}
            >
              {form.manifesto.length}/500
            </p>
          </div>
        </section>

        {/* ── Save Button ──────────────────────────────────────────── */}
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" loading={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
