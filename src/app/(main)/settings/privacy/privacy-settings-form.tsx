"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";
import { updatePrivacySettings } from "@/lib/actions/settings";
import { ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_SECTIONS = ["featured", "gallery", "wip", "workshop", "achievements"];

interface PrivacyData {
  isProfilePrivate: boolean;
  hiddenSections: string[];
  sectionOrder: string[];
}

export function PrivacySettingsForm({ initialData }: { initialData: PrivacyData }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialData);

  function toggleSection(section: string) {
    setForm((prev) => ({
      ...prev,
      hiddenSections: prev.hiddenSections.includes(section)
        ? prev.hiddenSections.filter((s) => s !== section)
        : [...prev.hiddenSections, section],
    }));
  }

  function moveSection(index: number, direction: "up" | "down") {
    const newOrder = [...form.sectionOrder];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setForm((prev) => ({ ...prev, sectionOrder: newOrder }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const result = await updatePrivacySettings({
      isProfilePrivate: form.isProfilePrivate,
      hiddenSections: form.hiddenSections,
      sectionOrder: form.sectionOrder,
    });

    setSaving(false);

    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success(t("settings.privacy.saved"));
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">{t("settings.privacy.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("settings.privacy.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Private Profile Toggle */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {t("settings.privacy.privateProfile")}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                {t("settings.privacy.privateProfileDesc")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, isProfilePrivate: !prev.isProfilePrivate }))}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer",
                form.isProfilePrivate ? "bg-gx-red" : "bg-zinc-700"
              )}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
                  form.isProfilePrivate ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>

        {/* Section Visibility */}
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {t("settings.privacy.sectionVisibility")}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t("settings.privacy.sectionVisibilityDesc")}
            </p>
          </div>
          <div className="space-y-2">
            {ALL_SECTIONS.map((section) => {
              const isHidden = form.hiddenSections.includes(section);
              return (
                <button
                  key={section}
                  type="button"
                  onClick={() => toggleSection(section)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                    isHidden
                      ? "text-muted-foreground/50 bg-transparent"
                      : "text-foreground bg-muted/30"
                  )}
                >
                  {isHidden ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground/50" />
                  ) : (
                    <Eye className="h-4 w-4 text-gx-red" />
                  )}
                  {t(`settings.privacy.section.${section}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section Order */}
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {t("settings.privacy.sectionOrder")}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t("settings.privacy.sectionOrderDesc")}
            </p>
          </div>
          <div className="space-y-1">
            {form.sectionOrder.map((section, index) => (
              <div
                key={section}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/20 border border-border/30"
              >
                <span className="text-xs text-muted-foreground font-mono w-5">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm text-foreground">
                  {t(`settings.privacy.section.${section}`)}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveSection(index, "up")}
                    disabled={index === 0}
                    className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(index, "down")}
                    disabled={index === form.sectionOrder.length - 1}
                    className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
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
