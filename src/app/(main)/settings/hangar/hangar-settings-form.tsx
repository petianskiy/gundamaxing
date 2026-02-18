"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n/context";
import { updateHangarSettings } from "@/lib/actions/hangar";
import { Check, Grid3X3, Layout, BookOpen } from "lucide-react";

interface HangarFormData {
  hangarTheme: string;
  hangarLayout: string;
  manifesto: string;
}

const THEMES = [
  {
    value: "CYBER_BAY",
    labelKey: "hangar.theme.cyberBay",
    descKey: "hangar.theme.cyberBayDesc",
    colors: ["#0f172a", "#06b6d4", "#22d3ee", "#164e63"],
  },
  {
    value: "CLEAN_LAB",
    labelKey: "hangar.theme.cleanLab",
    descKey: "hangar.theme.cleanLabDesc",
    colors: ["#f8fafc", "#e2e8f0", "#94a3b8", "#cbd5e1"],
  },
  {
    value: "DESERT_BATTLEFIELD",
    labelKey: "hangar.theme.desertBattlefield",
    descKey: "hangar.theme.desertBattlefieldDesc",
    colors: ["#451a03", "#b45309", "#f59e0b", "#78350f"],
  },
  {
    value: "NEON_TOKYO",
    labelKey: "hangar.theme.neonTokyo",
    descKey: "hangar.theme.neonTokyoDesc",
    colors: ["#1a0025", "#d946ef", "#f0abfc", "#7c3aed"],
  },
] as const;

const LAYOUTS = [
  {
    value: "GALLERY",
    labelKey: "hangar.layout.gallery",
    descKey: "hangar.layout.galleryDesc",
    icon: Grid3X3,
  },
  {
    value: "BLUEPRINT",
    labelKey: "hangar.layout.blueprint",
    descKey: "hangar.layout.blueprintDesc",
    icon: Layout,
  },
  {
    value: "STORY",
    labelKey: "hangar.layout.story",
    descKey: "hangar.layout.storyDesc",
    icon: BookOpen,
  },
] as const;

export function HangarSettingsForm({ initialData }: { initialData: HangarFormData }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialData);

  function updateField<K extends keyof HangarFormData>(key: K, value: HangarFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const result = await updateHangarSettings({
      hangarTheme: form.hangarTheme,
      hangarLayout: form.hangarLayout,
      manifesto: form.manifesto,
    });

    setSaving(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("hangar.settings.saved"));
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">{t("hangar.settings.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("hangar.settings.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section A: Theme Picker */}
        <div className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("hangar.settings.theme")}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {THEMES.map((theme) => {
              const isActive = form.hangarTheme === theme.value;
              return (
                <motion.button
                  key={theme.value}
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => updateField("hangarTheme", theme.value)}
                  className={`relative flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                    isActive
                      ? "border-gx-red bg-gx-red/5"
                      : "border-border/50 bg-gx-surface hover:border-border"
                  }`}
                >
                  {/* Color preview */}
                  <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2">
                    {theme.colors.map((color, i) => (
                      <div key={i} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{t(theme.labelKey)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {t(theme.descKey)}
                    </p>
                  </div>
                  {isActive && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gx-red flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Section B: Layout Mode */}
        <div className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("hangar.settings.layout")}
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
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-colors ${
                    isActive
                      ? "border-gx-red bg-gx-red/5"
                      : "border-border/50 bg-gx-surface hover:border-border"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${isActive ? "text-gx-red" : "text-muted-foreground"}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t(layout.labelKey)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t(layout.descKey)}</p>
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
        </div>

        {/* Section C: Builder Manifesto */}
        <div className="space-y-1.5">
          <Textarea
            label={t("hangar.settings.manifesto")}
            value={form.manifesto}
            onChange={(e) => updateField("manifesto", e.target.value)}
            rows={4}
            maxLength={500}
            placeholder={t("hangar.settings.manifestoPlaceholder")}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground/60">{t("hangar.settings.manifestoHint")}</p>
            <p
              className={`text-xs ${
                form.manifesto.length > 450 ? "text-amber-400" : "text-muted-foreground/60"
              }`}
            >
              {form.manifesto.length}/500
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" loading={saving}>
            {saving ? t("settings.saving") : t("settings.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
