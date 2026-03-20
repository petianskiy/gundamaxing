"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Package,
  Paintbrush,
  FileText,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { filterConfig } from "@/lib/config/filters";
import { SupplyCombobox, type SelectedSupply } from "@/components/supply/supply-combobox";
import { useR2Upload } from "@/lib/upload/use-r2-upload";
import { createBuild } from "@/lib/actions/build";
import { TemplateChooserOverlay } from "@/components/build/showcase/template-chooser-overlay";
import type { BuildImage } from "@/lib/types";

function CollapsibleSection({
  title,
  description,
  icon: Icon,
  defaultOpen = false,
  badge,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  badge?: string;
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
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground text-sm">{title}</h3>
              {badge && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground/60">
                  {badge}
                </span>
              )}
            </div>
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

// ─── Display Crop Modal ──────────────────────────────────────────

function CropModal({
  imageUrl,
  initialPosition,
  onKeep,
  onCancel,
  onReset,
}: {
  imageUrl: string;
  initialPosition: string;
  onKeep: (position: string) => void;
  onCancel: () => void;
  onReset: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [cropY, setCropY] = useState(() => {
    const parts = initialPosition.split(" ");
    return parseInt(parts[1] || "50", 10);
  });
  const startYRef = useRef(0);
  const startCropYRef = useRef(0);

  // The crop box represents a 4:3 window on the full image
  // User drags it vertically to choose which part of the image is visible on the card
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    startYRef.current = e.clientY;
    startCropYRef.current = cropY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !containerRef.current) return;
    const containerH = containerRef.current.getBoundingClientRect().height;
    const dy = e.clientY - startYRef.current;
    const pctChange = (dy / containerH) * 100;
    const newY = Math.max(0, Math.min(100, startCropYRef.current + pctChange));
    setCropY(Math.round(newY));
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  return (
    <div className="fixed inset-0 z-[900] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 overflow-hidden max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
          <span className="text-sm font-medium text-white">Display crop</span>
          <button onClick={onCancel} className="text-zinc-400 hover:text-white p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Image with crop overlay */}
        <div
          ref={containerRef}
          className="relative cursor-ns-resize select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ touchAction: "none" }}
        >
          <img
            src={imageUrl}
            alt="Crop preview"
            className="w-full"
            draggable={false}
          />

          {/* Dimmed areas outside crop */}
          <div
            className="absolute inset-x-0 top-0 bg-black/50 pointer-events-none transition-all"
            style={{ height: `${Math.max(0, cropY - 20)}%` }}
          />
          <div
            className="absolute inset-x-0 bottom-0 bg-black/50 pointer-events-none transition-all"
            style={{ height: `${Math.max(0, 100 - cropY - 20)}%` }}
          />

          {/* Crop rectangle with grid lines */}
          <div
            className="absolute inset-x-0 border-2 border-white/70 pointer-events-none transition-all"
            style={{ top: `${Math.max(0, cropY - 20)}%`, bottom: `${Math.max(0, 100 - cropY - 20)}%` }}
          >
            {/* Rule of thirds grid */}
            <div className="absolute inset-0">
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
            </div>

            {/* Corner handles */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white" />

            {/* Drag handle dots */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-0.5 w-1 h-6 rounded-full bg-white/80" />
            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-0.5 w-1 h-6 rounded-full bg-white/80" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 w-6 h-1 rounded-full bg-white/80" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-0.5 w-6 h-1 rounded-full bg-white/80" />
          </div>

          {/* Crosshair cursor indicator */}
          <div
            className="absolute w-4 h-4 pointer-events-none z-10"
            style={{
              left: "50%",
              top: `${cropY}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="w-full h-px bg-white/50 absolute top-1/2" />
            <div className="h-full w-px bg-white/50 absolute left-1/2" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-zinc-700">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <span className="text-sm">↺</span> return
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded-lg text-xs font-medium border border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
          >
            cancel
          </button>
          <button
            onClick={() => onKeep(`50% ${cropY}%`)}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors"
          >
            keep
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  helper,
  required,
  children,
}: {
  label: string;
  helper?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
        {required ? (
          <span className="text-gx-red ml-1">*</span>
        ) : (
          <span className="ml-1.5 text-[10px] font-normal normal-case tracking-normal text-muted-foreground/40">{t("upload.optional")}</span>
        )}
      </label>
      {helper && <p className="text-[11px] text-muted-foreground/60 mb-2">{helper}</p>}
      {children}
    </div>
  );
}

const GRADE_SCALE_MAP: Record<string, string> = {
  HG: "1/144",
  RG: "1/144",
  EG: "1/144",
  MG: "1/100",
  MGEX: "1/100",
  FM: "1/100",
  HiRM: "1/100",
  "RE/100": "1/60",
  PG: "1/60",
  SD: "Non-scale",
};

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
  const [focalPoints, setFocalPoints] = useState<Record<number, string>>({});
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
  const [selectedSupplies, setSelectedSupplies] = useState<SelectedSupply[]>([]);
  const [description, setDescription] = useState("");
  const [intentStatement, setIntentStatement] = useState("");

  // Submit state
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Design Studio step
  const [step, setStep] = useState<"form" | "design-studio">("form");
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateLocked, setTemplateLocked] = useState(true);

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

  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);
  const [cropIndex, setCropIndex] = useState<number | null>(null);

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
    setFocalPoints((prev) => {
      const next: Record<number, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        const ki = Number(k);
        if (ki === index) continue;
        next[ki < index ? ki : ki - 1] = v;
      }
      return next;
    });
    setConfirmDeleteIndex(null);
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

  // Step 1: Upload images, then show Design Studio
  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);

    try {
      setUploading(true);
      const files = previews.map((p) => p.file);
      const uploadResult = await uploadMultiple(files);
      setUploading(false);

      if (!uploadResult || uploadResult.length === 0) {
        setError(t("upload.imageUploadFailed"));
        return;
      }

      setUploadedUrls(uploadResult.map((r) => r.url));
      // Show the Design Studio step instead of immediately creating the build
      setStep("design-studio");
    } catch (err) {
      setUploading(false);
      setError(t("upload.unexpectedError"));
      console.error(err);
    }
  }

  // Step 2: After template selection, create the build
  async function finalizeUpload(templateId: string | null, locked: boolean) {
    try {
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
      if (description) formData.set("description", description);
      if (paintSystem) formData.set("paintSystem", paintSystem);
      if (topcoat) formData.set("topcoat", topcoat);
      if (timeInvested) formData.set("timeInvested", timeInvested);
      if (tools.trim()) {
        formData.set("tools", JSON.stringify(tools.split(",").map((t) => t.trim()).filter(Boolean)));
      }
      if (selectedSupplies.length > 0) {
        formData.set("supplyIds", JSON.stringify(selectedSupplies.map((s) => s.id)));
      }
      if (intentStatement) formData.set("intentStatement", intentStatement);
      formData.set("imageUrls", JSON.stringify(uploadedUrls));
      formData.set("primaryIndex", String(primaryIndex));

      const objectPositions: Record<number, string> = {};
      for (const [idx, pos] of Object.entries(focalPoints)) {
        objectPositions[Number(idx)] = pos;
      }
      if (Object.keys(objectPositions).length > 0) {
        formData.set("objectPositions", JSON.stringify(objectPositions));
      }

      // Pass selected template info
      if (templateId) {
        formData.set("templateId", templateId);
        formData.set("templateLocked", locked ? "1" : "0");
      }

      const result = await createBuild(formData);
      setSubmitting(false);

      if ("error" in result) {
        setError(result.error ?? t("upload.createFailed"));
        setStep("form");
        return;
      }

      const guideParam = result.isFirstBuild ? "&guide=1" : "";
      const tplParam = templateId ? `&tpl=${encodeURIComponent(templateId)}` : "";
      router.push(`/builds/${result.slug}?edit=1${guideParam}${tplParam}`);
    } catch (err) {
      setSubmitting(false);
      setError(t("upload.unexpectedError"));
      setStep("form");
      console.error(err);
    }
  }

  // ─── Design Studio Step (after image upload, before build creation) ──
  if (step === "design-studio") {
    const buildImagesForChooser: BuildImage[] = uploadedUrls.map((url, i) => ({
      id: `upload-${i}`,
      url,
      alt: `Image ${i + 1}`,
      isPrimary: i === primaryIndex,
      objectPosition: focalPoints[i] || undefined,
    }));

    return (
      <>
        <TemplateChooserOverlay
          buildImages={buildImagesForChooser}
          onApply={(templateId) => {
            finalizeUpload(templateId, false);
          }}
          onSkip={() => {
            finalizeUpload(null, false);
          }}
        />
        {submitting && (
          <div className="fixed inset-0 z-[900] bg-black/80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-gx-red" />
              <p className="text-sm text-white font-medium">{t("upload.submitting")}</p>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      {/* Background image */}
      <div
        className="fixed inset-0 -z-10 bg-[#09090b] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/upload-bg.jpg')" }}
      />
      <div className="fixed inset-0 bg-black/75 -z-10" />

      <div className="mx-auto max-w-2xl relative">
        {/* Header */}
        <div className="animate-page-header mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Upload className="h-5 w-5 text-gx-red" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
              投稿 · New Build
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">{t("upload.title")}</h1>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            {t("upload.subtitle")}
          </p>
        </div>

        <div className="animate-page-content space-y-4">
          {/* Section 1: Essentials */}
          <CollapsibleSection
            title={t("upload.essentials")}
            description={t("upload.essentialsDesc")}
            icon={Package}
            defaultOpen={true}
          >
            <div className="space-y-4">
              <FormField label={t("upload.buildTitle")} required>
                <input
                  type="text"
                  placeholder={t("upload.buildTitlePlaceholder")}
                  className={inputClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormField>

              <FormField label={t("upload.kitName")} required>
                <input
                  type="text"
                  placeholder={t("upload.kitNamePlaceholder")}
                  className={inputClass}
                  value={kitName}
                  onChange={(e) => setKitName(e.target.value)}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label={t("upload.grade")} required>
                  <select
                    className={selectClass}
                    value={grade}
                    onChange={(e) => {
                      const newGrade = e.target.value;
                      setGrade(newGrade);
                      const autoScale = GRADE_SCALE_MAP[newGrade];
                      if (autoScale) setScale(autoScale);
                    }}
                  >
                    <option value="" disabled>{t("upload.selectGrade")}</option>
                    {filterConfig.grades.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label={t("upload.scale")}>
                  <select
                    className={cn(selectClass, !!GRADE_SCALE_MAP[grade] && "opacity-60 cursor-not-allowed")}
                    value={scale}
                    onChange={(e) => setScale(e.target.value)}
                    disabled={!!GRADE_SCALE_MAP[grade]}
                  >
                    <option value="" disabled>{t("upload.selectScale")}</option>
                    {filterConfig.scales.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {!!GRADE_SCALE_MAP[grade] && (
                    <p className="text-[10px] text-muted-foreground/50 mt-1">Auto-set from grade</p>
                  )}
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
                      {t(`upload.status.${s}`)}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label={t("upload.description")} helper={t("upload.descriptionHelper")}>
                <textarea
                  rows={4}
                  placeholder={t("upload.descriptionPlaceholder")}
                  className={inputClass}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={5000}
                />
              </FormField>

              <FormField label={t("upload.photos")} required>
                {/* Drop zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-4 sm:p-8 text-center transition-colors cursor-pointer",
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
                    <p className="text-xs text-muted-foreground mb-3">
                      {previews.length} / 15 {t("upload.photos").toLowerCase()}
                      <span className="ml-2 text-muted-foreground/50">— Tap to set as cover, long-press to crop</span>
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {previews.map((preview, i) => (
                        <div
                          key={preview.url}
                          className={cn(
                            "relative aspect-square rounded-lg overflow-hidden border-2 group transition-all cursor-pointer",
                            i === primaryIndex
                              ? "border-gx-red shadow-[0_0_10px_rgba(220,38,38,0.3)]"
                              : "border-zinc-700/50 hover:border-zinc-500"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrimaryIndex(i);
                          }}
                        >
                          <img
                            src={preview.url}
                            alt={`Preview ${i + 1}`}
                            className="w-full h-full object-cover"
                            style={{ objectPosition: focalPoints[i] || "50% 50%" }}
                          />

                          {/* Crop indicator */}
                          {focalPoints[i] && focalPoints[i] !== "50% 50%" && (
                            <div className="absolute bottom-1 left-1 px-1 py-0.5 rounded text-[7px] font-medium bg-blue-500/80 text-white">
                              Cropped
                            </div>
                          )}

                          {/* COVER badge */}
                          {i === primaryIndex && (
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-gx-red text-white">
                              Cover
                            </div>
                          )}

                          {/* Number */}
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/60 text-[8px] font-bold text-white flex items-center justify-center">
                            {i + 1}
                          </div>

                          {/* Action buttons on hover */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCropIndex(i);
                              }}
                              className="px-2 py-1 rounded text-[9px] font-bold bg-white/90 text-black hover:bg-white"
                            >
                              Crop
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirmDeleteIndex === i) {
                                  removeImage(i);
                                } else {
                                  setConfirmDeleteIndex(i);
                                  setTimeout(() => setConfirmDeleteIndex(null), 2000);
                                }
                              }}
                              className={cn(
                                "px-2 py-1 rounded text-[9px] font-bold",
                                confirmDeleteIndex === i
                                  ? "bg-red-600 text-white"
                                  : "bg-white/90 text-black hover:bg-white"
                              )}
                            >
                              {confirmDeleteIndex === i ? "Confirm" : "Delete"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Card Preview */}
                    {primaryIndex !== null && previews[primaryIndex] && (
                      <div className="mt-4 flex items-start gap-3">
                        <div className="w-36 shrink-0">
                          <p className="text-[10px] text-muted-foreground mb-1.5">Card Preview</p>
                          <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
                            <div className="aspect-[4/3] overflow-hidden">
                              <img
                                src={previews[primaryIndex].url}
                                alt="Card preview"
                                className="w-full h-full object-cover"
                                style={{ objectPosition: focalPoints[primaryIndex] || "50% 50%" }}
                              />
                            </div>
                            <div className="p-1.5">
                              <p className="text-[9px] font-medium text-foreground truncate">{title || "Build Title"}</p>
                              <p className="text-[8px] text-muted-foreground truncate">{kitName || "Kit Name"}</p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setCropIndex(primaryIndex)}
                          className="mt-6 px-3 py-1.5 rounded-lg border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                        >
                          Adjust crop
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Display Crop Modal */}
                {cropIndex !== null && previews[cropIndex] && (
                  <CropModal
                    imageUrl={previews[cropIndex].url}
                    initialPosition={focalPoints[cropIndex] || "50% 50%"}
                    onKeep={(pos) => {
                      setFocalPoints((prev) => ({ ...prev, [cropIndex!]: pos }));
                      setCropIndex(null);
                    }}
                    onCancel={() => setCropIndex(null)}
                    onReset={() => {
                      setFocalPoints((prev) => {
                        const next = { ...prev };
                        delete next[cropIndex!];
                        return next;
                      });
                      setCropIndex(null);
                    }}
                  />
                )}
              </FormField>
            </div>
          </CollapsibleSection>

          {/* Section 2: Techniques & Materials */}
          <CollapsibleSection
            title={t("upload.techniquesMaterials")}
            description={t("upload.techniquesMaterialsDesc")}
            icon={Paintbrush}
            badge={t("upload.optionalBadge")}
            defaultOpen={true}
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

              <FormField label={t("upload.toolsUsed")} helper={t("supply.searchHelper")}>
                <SupplyCombobox
                  selected={selectedSupplies}
                  freeText={tools}
                  onSelectedChange={setSelectedSupplies}
                  onFreeTextChange={setTools}
                />
              </FormField>
            </div>
          </CollapsibleSection>

          {/* Section 3: Build Context */}
          <CollapsibleSection
            title={t("upload.buildContext")}
            description={t("upload.buildContextDesc")}
            icon={FileText}
            badge={t("upload.optionalBadge")}
          >
            <div className="space-y-4">
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
