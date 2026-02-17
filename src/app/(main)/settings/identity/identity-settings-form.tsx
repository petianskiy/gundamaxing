"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";
import { updateBuilderIdentity } from "@/lib/actions/settings";
import { filterConfig } from "@/lib/config/filters";
import { cn } from "@/lib/utils";

type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" | null;

interface IdentityData {
  country: string;
  skillLevel: SkillLevel;
  preferredGrades: string[];
  favoriteTimelines: string[];
  tools: string[];
  techniques: string[];
}

function ChipSelector({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  function toggle(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                isSelected
                  ? "bg-gx-red/20 border-gx-red/40 text-gx-red"
                  : "bg-gx-surface border-border/50 text-muted-foreground hover:border-gx-red/30 hover:text-foreground"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const SKILL_LEVELS: { value: SkillLevel; labelKey: string }[] = [
  { value: "BEGINNER", labelKey: "settings.identity.beginner" },
  { value: "INTERMEDIATE", labelKey: "settings.identity.intermediate" },
  { value: "ADVANCED", labelKey: "settings.identity.advanced" },
  { value: "EXPERT", labelKey: "settings.identity.expert" },
];

const TOOL_OPTIONS = [
  "Nipper", "Hobby Knife", "Sandpaper", "File Set", "Pin Vise",
  "Airbrush", "Compressor", "Paint Booth", "Cutting Mat",
  "Tweezers", "Masking Tape", "Putty", "Scribing Tools",
  "Panel Line Accent", "Topcoat Spray", "Mr. Color", "Tamiya Paints",
];

export function IdentitySettingsForm({ initialData }: { initialData: IdentityData }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialData);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const result = await updateBuilderIdentity({
      country: form.country || undefined,
      skillLevel: form.skillLevel,
      preferredGrades: form.preferredGrades,
      favoriteTimelines: form.favoriteTimelines,
      tools: form.tools,
      techniques: form.techniques,
    });

    setSaving(false);

    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success(t("settings.identity.saved"));
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">{t("settings.identity.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("settings.identity.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label={t("settings.identity.country")}
          value={form.country}
          onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
          placeholder="e.g. Japan, USA, Germany"
          maxLength={100}
        />

        {/* Skill Level */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("settings.identity.skillLevel")}
          </label>
          <div className="flex flex-wrap gap-2">
            {SKILL_LEVELS.map(({ value, labelKey }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, skillLevel: prev.skillLevel === value ? null : value }))}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                  form.skillLevel === value
                    ? "bg-gx-red/20 border-gx-red/40 text-gx-red"
                    : "bg-gx-surface border-border/50 text-muted-foreground hover:border-gx-red/30 hover:text-foreground"
                )}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>

        <ChipSelector
          label={t("settings.identity.preferredGrades")}
          options={filterConfig.grades}
          selected={form.preferredGrades}
          onChange={(v) => setForm((prev) => ({ ...prev, preferredGrades: v }))}
        />

        <ChipSelector
          label={t("settings.identity.favoriteTimelines")}
          options={filterConfig.timelines}
          selected={form.favoriteTimelines}
          onChange={(v) => setForm((prev) => ({ ...prev, favoriteTimelines: v }))}
        />

        <ChipSelector
          label={t("settings.identity.tools")}
          options={TOOL_OPTIONS}
          selected={form.tools}
          onChange={(v) => setForm((prev) => ({ ...prev, tools: v }))}
        />

        <ChipSelector
          label={t("settings.identity.techniques")}
          options={filterConfig.techniques}
          selected={form.techniques}
          onChange={(v) => setForm((prev) => ({ ...prev, techniques: v }))}
        />

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" loading={saving}>
            {saving ? t("settings.saving") : t("settings.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
