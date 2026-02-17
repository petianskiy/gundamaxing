"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";
import { updatePrivacySettings } from "@/lib/actions/settings";
import { cn } from "@/lib/utils";
import { GripVertical, Eye, EyeOff } from "lucide-react";

type Props = {
  user: {
    isProfilePrivate: boolean;
    hiddenSections: string[];
    sectionOrder: string[];
  };
};

const sectionLabels: Record<string, string> = {
  featured: "settings.section.featured",
  gallery: "settings.section.gallery",
  wip: "settings.section.wip",
  workshop: "settings.section.workshop",
  achievements: "settings.section.achievements",
};

export function PrivacySettingsForm({ user }: Props) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [isPrivate, setIsPrivate] = useState(user.isProfilePrivate);
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set(user.hiddenSections));
  const [sectionOrder, setSectionOrder] = useState(user.sectionOrder);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  function toggleSection(section: string) {
    setHiddenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const newOrder = [...sectionOrder];
    const [moved] = newOrder.splice(dragIdx, 1);
    newOrder.splice(idx, 0, moved);
    setSectionOrder(newOrder);
    setDragIdx(idx);
  }

  function handleDragEnd() {
    setDragIdx(null);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await updatePrivacySettings({
        isProfilePrivate: isPrivate,
        hiddenSections: Array.from(hiddenSections),
        sectionOrder,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("settings.privacy.saved"));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("settings.privacy.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("settings.privacy.subtitle")}</p>
      </div>

      {/* Private profile toggle */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
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
            onClick={() => setIsPrivate(!isPrivate)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
              isPrivate ? "bg-gx-red" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform",
                isPrivate ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </div>

      {/* Section visibility */}
      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t("settings.privacy.sectionVisibility")}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {t("settings.privacy.sectionVisibilityDesc")}
          </p>
        </div>

        <div className="space-y-2">
          {sectionOrder.map((section, idx) => {
            const isHidden = hiddenSections.has(section);
            return (
              <div
                key={section}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors cursor-grab active:cursor-grabbing",
                  dragIdx === idx
                    ? "border-gx-red/50 bg-gx-red/5"
                    : "border-border/30 bg-muted/10 hover:bg-muted/20"
                )}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                <span className={cn(
                  "flex-1 text-sm font-medium",
                  isHidden ? "text-muted-foreground/40 line-through" : "text-foreground"
                )}>
                  {t(sectionLabels[section] ?? section)}
                </span>
                <button
                  type="button"
                  onClick={() => toggleSection(section)}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    isHidden
                      ? "text-muted-foreground/40 hover:text-muted-foreground"
                      : "text-foreground hover:text-gx-red"
                  )}
                >
                  {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} variant="primary">
          {saving ? t("settings.saving") : t("settings.save")}
        </Button>
      </div>
    </div>
  );
}
