"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  X,
  Star,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { filterConfig } from "@/lib/config/filters";
import { useR2Upload } from "@/lib/upload/use-r2-upload";
import { createBuild } from "@/lib/actions/build";

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

interface Preview {
  file: File;
  url: string;
}

export function UploadForm() {
  const { t } = useTranslation();
  const router = useRouter();

  // Image state
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [kitName, setKitName] = useState("");
  const [grade, setGrade] = useState("");
  const [scale, setScale] = useState("");
  const [timeline, setTimeline] = useState("");
  const [status, setStatus] = useState<"WIP" | "Completed" | "Abandoned">("WIP");
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const [paintSystem, setPaintSystem] = useState("");
  const [topcoat, setTopcoat] = useState("");
  const [timeInvested, setTimeInvested] = useState("");
  const [tools, setTools] = useState("");
  const [intentStatement, setIntentStatement] = useState("");

  // Submit state
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { uploadMultiple, isUploading: uploading2 } = useR2Upload({ type: "image" });

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    setPreviews((prev) => {
      const remaining = 15 - prev.length;
      const toAdd = fileArray.slice(0, remaining);
      const newPreviews = toAdd.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));
      return [...prev, ...newPreviews];
    });
  }, []);

  function removeImage(index: number) {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].url);
      const next = prev.filter((_, i) => i !== index);
      return next;
    });
    setPrimaryIndex((prev) => {
      if (index === prev) return 0;
      if (index < prev) return prev - 1;
      return prev;
    });
  }

  function toggleTechnique(tech: string) {
    setSelectedTechniques((prev) =>
      prev.includes(tech) ? prev.filter((item) => item !== tech) : [...prev, tech]
    );
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
  }

  const canSubmit = previews.length > 0 && title.trim() && kitName.trim() && grade;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);

    try {
      // Step 1: Upload images
      setUploading(true);
      const files = previews.map((p) => p.file);
      const uploadResult = await uploadMultiple(files);
      setUploading(false);

      if (!uploadResult || uploadResult.length === 0) {
        setError("Image upload failed. Please try again.");
        return;
      }

      const imageUrls = uploadResult.map((r) => r.url);

      // Step 2: Create build
      setSubmitting(true);
      const formData = new FormData();
      formData.set("title", title);
      formData.set("kitName", kitName);
      formData.set("grade", grade);
      if (scale) formData.set("scale", scale);
      if (timeline) formData.set("timeline", timeline);
      formData.set("status", status);
      if (selectedTechniques.length > 0) {
        formData.set("techniques", JSON.stringify(selectedTechniques));
      }
      if (paintSystem) formData.set("paintSystem", paintSystem);
      if (topcoat) formData.set("topcoat", topcoat);
      if (timeInvested) formData.set("timeInvested", timeInvested);
      if (tools.trim()) {
        formData.set("tools", JSON.stringify(tools.split(",").map((t) => t.trim()).filter(Boolean)));
      }
      if (intentStatement) formData.set("intentStatement", intentStatement);
      formData.set("imageUrls", JSON.stringify(imageUrls));
      formData.set("primaryIndex", String(primaryIndex));

      const result = await createBuild(formData);
      setSubmitting(false);

      if ("error" in result) {
        setError(result.error ?? "Failed to create build.");
        return;
      }

      const guideParam = result.isFirstBuild ? "&guide=1" : "";
      router.push(`/builds/${result.slug}?edit=1${guideParam}`);
    } catch (err) {
      setUploading(false);
      setSubmitting(false);
      setError("An unexpected error occurred.");
      console.error(err);
    }
  }

  return (
    <div className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      {/* Background image */}
      <div className="fixed inset-0 -z-10 bg-[#09090b]">
        <Image
          src="/upload-bg.jpg"
          alt=""
          fill
          className="object-cover object-center"
          priority
          unoptimized
        />
      </div>
      <div className="fixed inset-0 bg-black/75 -z-10" />

      <div className="mx-auto max-w-2xl relative">
        {/* Header */}
        <div className="mb-8 text-center">
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
              <FormField label={t("upload.buildTitle")}>
                <input
                  type="text"
                  placeholder={t("upload.buildTitlePlaceholder")}
                  className={inputClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormField>

              <FormField label={t("upload.kitName")}>
                <input
                  type="text"
                  placeholder={t("upload.kitNamePlaceholder")}
                  className={inputClass}
                  value={kitName}
                  onChange={(e) => setKitName(e.target.value)}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label={t("upload.grade")}>
                  <select
                    className={selectClass}
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                  >
                    <option value="" disabled>{t("upload.selectGrade")}</option>
                    {filterConfig.grades.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label={t("upload.scale")}>
                  <select
                    className={selectClass}
                    value={scale}
                    onChange={(e) => setScale(e.target.value)}
                  >
                    <option value="" disabled>{t("upload.selectScale")}</option>
                    {filterConfig.scales.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label={t("upload.timeline")}>
                <select
                  className={selectClass}
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                >
                  <option value="" disabled>{t("upload.selectTimeline")}</option>
                  {filterConfig.timelines.map((tl) => (
                    <option key={tl} value={tl}>{tl}</option>
                  ))}
                </select>
              </FormField>

              <FormField label={t("upload.status")}>
                <div className="flex gap-3">
                  {(["WIP", "Completed", "Abandoned"] as const).map((s) => (
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
                {/* Drop zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                    dragging
                      ? "border-gx-red bg-gx-red/5"
                      : "border-border/50 hover:border-border"
                  )}
                >
                  <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {t("upload.dropImages")}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">
                    {t("upload.imageFormats")}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>

                {/* Image preview grid */}
                {previews.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      {previews.length} / 15 images
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {previews.map((preview, i) => (
                        <div
                          key={preview.url}
                          className="group/thumb relative aspect-square rounded-lg overflow-hidden border-2 border-transparent"
                        >
                          <img
                            src={preview.url}
                            alt={`Preview ${i + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Primary badge */}
                          {i === primaryIndex && (
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-gx-red text-white">
                              {t("upload.primaryBadge")}
                            </div>
                          )}

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                            {i !== primaryIndex && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPrimaryIndex(i);
                                }}
                                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-white/20 text-white hover:bg-white/30 transition-colors"
                              >
                                <Star className="h-3 w-3" />
                                {t("upload.setPrimary")}
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(i);
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-red-500/30 text-white hover:bg-red-500/50 transition-colors"
                            >
                              <X className="h-3 w-3" />
                              {t("upload.removeImage")}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                <input
                  type="text"
                  placeholder={t("upload.paintSystemPlaceholder")}
                  className={inputClass}
                  value={paintSystem}
                  onChange={(e) => setPaintSystem(e.target.value)}
                />
              </FormField>

              <FormField label={t("upload.topcoat")} helper={t("upload.topcoatHelper")}>
                <input
                  type="text"
                  placeholder={t("upload.topcoatPlaceholder")}
                  className={inputClass}
                  value={topcoat}
                  onChange={(e) => setTopcoat(e.target.value)}
                />
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
                  value={tools}
                  onChange={(e) => setTools(e.target.value)}
                />
              </FormField>

              <FormField label={t("upload.timeInvested")}>
                <input
                  type="text"
                  placeholder={t("upload.timePlaceholder")}
                  className={inputClass}
                  value={timeInvested}
                  onChange={(e) => setTimeInvested(e.target.value)}
                />
              </FormField>

              <FormField label={t("upload.intentStatement")} helper={t("upload.intentHelper")}>
                <textarea
                  rows={4}
                  placeholder={t("upload.intentPlaceholder")}
                  className={inputClass}
                  value={intentStatement}
                  onChange={(e) => setIntentStatement(e.target.value)}
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

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="pt-4">
            <button
              disabled={!canSubmit || uploading || submitting}
              onClick={handleSubmit}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-semibold text-sm transition-colors",
                canSubmit && !uploading && !submitting
                  ? "bg-gx-red hover:bg-gx-red/90 cursor-pointer"
                  : "bg-gx-red/50 cursor-not-allowed"
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("upload.uploading")}
                </>
              ) : submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("upload.submitting")}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {t("upload.createPassport")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
