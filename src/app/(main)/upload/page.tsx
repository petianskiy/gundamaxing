"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Package,
  Paintbrush,
  Wrench,
  FileText,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { filterConfig } from "@/lib/config/filters";

function CollapsibleSection({
  title,
  description,
  icon: Icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full p-5 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold text-foreground text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 space-y-4 border-t border-border/30">
              <div className="pt-4">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FormField({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </label>
      {helper && <p className="text-[11px] text-muted-foreground/60 mb-2">{helper}</p>}
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-border/50 bg-gx-surface text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-gx-red/50 focus:ring-1 focus:ring-gx-red/20 transition-colors";

const selectClass =
  "w-full px-3 py-2.5 rounded-lg border border-border/50 bg-gx-surface text-foreground text-sm focus:outline-none focus:border-gx-red/50 focus:ring-1 focus:ring-gx-red/20 transition-colors appearance-none";

export default function UploadPage() {
  const { t } = useTranslation();
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const [status, setStatus] = useState<"WIP" | "Completed">("WIP");

  function toggleTechnique(tech: string) {
    setSelectedTechniques((prev) =>
      prev.includes(tech) ? prev.filter((item) => item !== tech) : [...prev, tech]
    );
  }

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("upload.title")}</h1>
          <p className="mt-1 text-muted-foreground">
            {t("upload.subtitle")}
          </p>
        </div>

        <div className="space-y-4">
          {/* Section 1: Essentials */}
          <CollapsibleSection
            title={t("upload.essentials")}
            description={t("upload.essentialsDesc")}
            icon={Package}
            defaultOpen={true}
          >
            <div className="space-y-4">
              <FormField label={t("upload.kitName")}>
                <input type="text" placeholder={t("upload.kitNamePlaceholder")} className={inputClass} />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label={t("upload.grade")}>
                  <select className={selectClass} defaultValue="">
                    <option value="" disabled>{t("upload.selectGrade")}</option>
                    {filterConfig.grades.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label={t("upload.scale")}>
                  <select className={selectClass} defaultValue="">
                    <option value="" disabled>{t("upload.selectScale")}</option>
                    {filterConfig.scales.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label={t("upload.timeline")}>
                <select className={selectClass} defaultValue="">
                  <option value="" disabled>{t("upload.selectTimeline")}</option>
                  {filterConfig.timelines.map((tl) => (
                    <option key={tl} value={tl}>{tl}</option>
                  ))}
                </select>
              </FormField>

              <FormField label={t("upload.status")}>
                <div className="flex gap-3">
                  {(["WIP", "Completed"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                        status === s
                          ? "border-gx-red/40 bg-gx-red/10 text-red-400"
                          : "border-border/50 bg-gx-surface text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label={t("upload.photos")}>
                <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-border transition-colors cursor-pointer">
                  <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {t("upload.dropImages")}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">
                    {t("upload.imageFormats")}
                  </p>
                </div>
              </FormField>
            </div>
          </CollapsibleSection>

          {/* Section 2: Techniques & Materials */}
          <CollapsibleSection
            title={t("upload.techniquesMaterials")}
            description={t("upload.techniquesMaterialsDesc")}
            icon={Paintbrush}
          >
            <div className="space-y-4">
              <FormField label={t("upload.techniques")} helper={t("upload.techniquesHelper")}>
                <div className="flex flex-wrap gap-2">
                  {filterConfig.techniques.map((tech) => (
                    <button
                      key={tech}
                      onClick={() => toggleTechnique(tech)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                        selectedTechniques.includes(tech)
                          ? "border-gx-red/40 bg-gx-red/10 text-red-400"
                          : "border-border/50 bg-gx-surface text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label={t("upload.paintSystem")} helper={t("upload.paintSystemHelper")}>
                <input type="text" placeholder={t("upload.paintSystemPlaceholder")} className={inputClass} />
              </FormField>

              <FormField label={t("upload.topcoat")} helper={t("upload.topcoatHelper")}>
                <input type="text" placeholder={t("upload.topcoatPlaceholder")} className={inputClass} />
              </FormField>
            </div>
          </CollapsibleSection>

          {/* Section 3: Advanced Detailing */}
          <CollapsibleSection
            title={t("upload.advancedDetailing")}
            description={t("upload.advancedDetailingDesc")}
            icon={Wrench}
          >
            <div className="space-y-4">
              <FormField label={t("upload.scribing")} helper={t("upload.scribingHelper")}>
                <textarea rows={3} placeholder={t("upload.scribingPlaceholder")} className={inputClass} />
              </FormField>

              <FormField label={t("upload.decals")} helper={t("upload.decalsHelper")}>
                <input type="text" placeholder={t("upload.decalsPlaceholder")} className={inputClass} />
              </FormField>

              <FormField label={t("upload.weathering")} helper={t("upload.weatheringHelper")}>
                <textarea rows={3} placeholder={t("upload.weatheringPlaceholder")} className={inputClass} />
              </FormField>

              <FormField label={t("upload.kitbash")} helper={t("upload.kitbashHelper")}>
                <textarea rows={3} placeholder={t("upload.kitbashPlaceholder")} className={inputClass} />
              </FormField>

              <FormField label={t("upload.ledElectronics")} helper={t("upload.ledHelper")}>
                <textarea rows={3} placeholder={t("upload.ledPlaceholder")} className={inputClass} />
              </FormField>
            </div>
          </CollapsibleSection>

          {/* Section 4: Build Context */}
          <CollapsibleSection
            title={t("upload.buildContext")}
            description={t("upload.buildContextDesc")}
            icon={FileText}
          >
            <div className="space-y-4">
              <FormField label={t("upload.toolsUsed")} helper={t("upload.toolsHelper")}>
                <input
                  type="text"
                  placeholder={t("upload.toolsPlaceholder")}
                  className={inputClass}
                />
              </FormField>

              <FormField label={t("upload.timeInvested")}>
                <input type="text" placeholder={t("upload.timePlaceholder")} className={inputClass} />
              </FormField>

              <FormField label={t("upload.intentStatement")} helper={t("upload.intentHelper")}>
                <textarea
                  rows={4}
                  placeholder={t("upload.intentPlaceholder")}
                  className={inputClass}
                />
              </FormField>

              <FormField label={t("upload.baseKitRef")} helper={t("upload.baseKitHelper")}>
                <input type="text" placeholder={t("upload.baseKitPlaceholder")} className={inputClass} />
              </FormField>

              <FormField label={t("upload.inspiredBy")} helper={t("upload.inspiredByHelper")}>
                <input type="text" placeholder={t("upload.inspiredByPlaceholder")} className={inputClass} />
              </FormField>
            </div>
          </CollapsibleSection>

          {/* Submit */}
          <div className="pt-4">
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gx-red text-white font-semibold text-sm opacity-50 cursor-not-allowed"
            >
              <Upload className="h-4 w-4" />
              {t("upload.createPassport")}
            </button>
            <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
              {t("upload.comingSoon")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
