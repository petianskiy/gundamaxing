"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";
import { updateBuilderIdentity } from "@/lib/actions/settings";
import { filterConfig } from "@/lib/config/filters";
import { cn } from "@/lib/utils";

type Props = {
  user: {
    country: string;
    skillLevel: string | null;
    preferredGrades: string[];
    favoriteTimelines: string[];
    tools: string[];
    techniques: string[];
  };
};

const skillLevels = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
  { value: "EXPERT", label: "Expert" },
];

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
              onClick={() =>
                onChange(
                  isSelected
                    ? selected.filter((s) => s !== option)
                    : [...selected, option]
                )
              }
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                isSelected
                  ? "bg-gx-red/20 text-gx-red border-gx-red/30"
                  : "bg-muted/20 text-muted-foreground border-border/30 hover:border-border/60 hover:text-foreground"
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

export function IdentitySettingsForm({ user }: Props) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [country, setCountry] = useState(user.country);
  const [skillLevel, setSkillLevel] = useState<string | null>(user.skillLevel);
  const [preferredGrades, setPreferredGrades] = useState(user.preferredGrades);
  const [favoriteTimelines, setFavoriteTimelines] = useState(user.favoriteTimelines);
  const [tools, setTools] = useState(user.tools);
  const [techniques, setTechniques] = useState(user.techniques);

  async function handleSave() {
    setSaving(true);
    try {
      const result = await updateBuilderIdentity({
        country: country || undefined,
        skillLevel: skillLevel || null,
        preferredGrades,
        favoriteTimelines,
        tools,
        techniques,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("settings.identity.saved"));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("settings.identity.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("settings.identity.subtitle")}</p>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-6">
        <Input
          label={t("settings.identity.country")}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Japan, USA, etc."
          maxLength={100}
        />

        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("settings.identity.skillLevel")}
          </label>
          <div className="flex flex-wrap gap-2">
            {skillLevels.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setSkillLevel(skillLevel === level.value ? null : level.value)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                  skillLevel === level.value
                    ? "bg-gx-red/20 text-gx-red border-gx-red/30"
                    : "bg-muted/20 text-muted-foreground border-border/30 hover:border-border/60 hover:text-foreground"
                )}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <ChipSelector
          label={t("settings.identity.preferredGrades")}
          options={filterConfig.grades}
          selected={preferredGrades}
          onChange={setPreferredGrades}
        />

        <ChipSelector
          label={t("settings.identity.favoriteTimelines")}
          options={filterConfig.timelines}
          selected={favoriteTimelines}
          onChange={setFavoriteTimelines}
        />

        <ChipSelector
          label={t("settings.identity.tools")}
          options={["Airbrush", "Compressor", "Hobby Knife", "Nippers", "Sanding Sticks", "Pin Vise", "Putty", "Masking Tape", "Panel Liner", "Topcoat Spray", "Paint Booth", "Cutting Mat"]}
          selected={tools}
          onChange={setTools}
        />

        <ChipSelector
          label={t("settings.identity.techniques")}
          options={filterConfig.techniques}
          selected={techniques}
          onChange={setTechniques}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} variant="primary">
          {saving ? t("settings.saving") : t("settings.save")}
        </Button>
      </div>
    </div>
  );
}
