"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  BrushPreset,
  BrushCategory,
  RenderMode,
} from "../../engine/brush-types";
import { flatDynamics, pressureDynamics } from "../../engine/brush-types";
import { BrushStudioHeader } from "./brush-studio-header";
import { BrushPreviewCanvas } from "./brush-preview-canvas";
import { StampPicker } from "./stamp-picker";
import { GrainPicker } from "./grain-picker";
import { DynamicsEditor } from "./dynamics-editor";
import { TaperEditor } from "./taper-editor";
import { ScatterJitterEditor } from "./scatter-jitter-editor";
import { RenderModePicker } from "./render-mode-picker";
import { BrushFolderManager } from "./brush-folder-manager";

// ─── Types ──────────────────────────────────────────────────────

interface BrushStudioPanelProps {
  /** The preset being edited (undefined = creating new) */
  initialPreset?: BrushPreset;
  /** Current brush color for preview */
  color: string;
  /** Current brush size */
  size: number;
  /** Called when saving a new or edited preset */
  onSave: (preset: BrushPreset) => void;
  /** Called when deleting an existing preset */
  onDelete?: (presetId: string) => void;
  /** Close the studio */
  onClose: () => void;
}

type AccordionSection =
  | "tip"
  | "grain"
  | "dynamics"
  | "taper"
  | "scatter"
  | "rendering";

// ─── Defaults ───────────────────────────────────────────────────

function createDefaultPreset(): BrushPreset {
  return {
    id: crypto.randomUUID(),
    name: "",
    category: "custom" as BrushCategory,
    shape: "circle" as const,
    hardness: 0.8,
    roundness: 1,
    angle: 0,
    grainScale: 1,
    grainBlendMode: "multiply" as const,
    grainIntensity: 0,
    grainMovement: "static" as const,
    spacing: 15,
    sizeDynamics: pressureDynamics(0.3, 1),
    opacityDynamics: flatDynamics(1),
    flowDynamics: flatDynamics(1),
    angleDynamics: flatDynamics(0),
    taperStart: 0,
    taperEnd: 0,
    taperSizeMin: 0.1,
    scatter: 0,
    jitterSize: 0,
    jitterOpacity: 0,
    jitterRotation: 0,
    stabilization: 20,
    blendMode: "source-over" as GlobalCompositeOperation,
    isEraser: false,
    renderMode: "normal" as RenderMode,
    smudgeStrength: 0,
  };
}

// ─── Accordion Section Component ────────────────────────────────

function AccordionItem({
  label,
  isOpen,
  onToggle,
  children,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-zinc-800">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800/50"
      >
        <span>{label}</span>
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-zinc-500 transition-transform duration-150",
            isOpen && "rotate-90"
          )}
        />
      </button>
      {isOpen && <div className="space-y-3 px-4 py-3">{children}</div>}
    </div>
  );
}

// ─── Slider helper ──────────────────────────────────────────────

function SliderControl({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  displayValue,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  displayValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[10px] text-zinc-400">
        <span>{label}</span>
        <span className="tabular-nums">{displayValue ?? value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 accent-blue-500"
      />
    </label>
  );
}

// ─── Main Panel ─────────────────────────────────────────────────

export function BrushStudioPanel({
  initialPreset,
  color,
  size,
  onSave,
  onDelete,
  onClose,
}: BrushStudioPanelProps) {
  const isEditing = !!initialPreset;

  // ── Preset state ────────────────────────────────────────
  const defaults = useMemo(
    () => initialPreset ?? createDefaultPreset(),
    [initialPreset]
  );

  const [preset, setPreset] = useState<BrushPreset>(() => ({ ...defaults }));
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // ── Accordion state ─────────────────────────────────────
  const [openSections, setOpenSections] = useState<Set<AccordionSection>>(
    () => new Set(["tip"])
  );

  const toggleSection = useCallback((section: AccordionSection) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  // ── Updater helpers ─────────────────────────────────────
  const update = useCallback(
    <K extends keyof BrushPreset>(key: K, value: BrushPreset[K]) => {
      setPreset((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updatePartial = useCallback((patch: Partial<BrushPreset>) => {
    setPreset((prev) => ({ ...prev, ...patch }));
  }, []);

  // ── Actions ─────────────────────────────────────────────
  const handleSave = useCallback(() => {
    setIsSaving(true);
    // Give the UI a frame to show saving state
    requestAnimationFrame(() => {
      onSave(preset);
      setIsSaving(false);
    });
  }, [onSave, preset]);

  const handleSaveAs = useCallback(() => {
    setIsSaving(true);
    const copy: BrushPreset = {
      ...preset,
      id: crypto.randomUUID(),
      name: preset.name ? `${preset.name} (copy)` : "",
    };
    requestAnimationFrame(() => {
      onSave(copy);
      setIsSaving(false);
    });
  }, [onSave, preset]);

  const handleReset = useCallback(() => {
    setPreset({ ...defaults });
    setConfirmDelete(false);
  }, [defaults]);

  const handleDelete = useCallback(() => {
    if (!onDelete || !initialPreset) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(initialPreset.id);
    setConfirmDelete(false);
  }, [onDelete, initialPreset, confirmDelete]);

  // ── Render ──────────────────────────────────────────────
  return (
    <div
      className={cn(
        "fixed top-0 right-0 bottom-0 z-[10002] flex w-80 flex-col",
        "border-l border-zinc-700 bg-zinc-900 shadow-2xl"
      )}
    >
      {/* ── Panel header ──────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-700 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-100">Brush Studio</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          aria-label="Close brush studio"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Scrollable body ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto [scrollbar-color:theme(--color-zinc-700)_transparent] [scrollbar-width:thin]">
        {/* Header: name, category, actions */}
        <div className="border-b border-zinc-800 px-4 py-3">
          <BrushStudioHeader
            name={preset.name}
            category={preset.category}
            folder={preset.folder}
            tags={tags}
            isNew={!isEditing}
            isSaving={isSaving}
            onNameChange={(name) => update("name", name)}
            onCategoryChange={(category) => update("category", category)}
            onFolderChange={(folder) => update("folder", folder)}
            onTagsChange={setTags}
            onSave={handleSave}
            onSaveAs={isEditing ? handleSaveAs : () => {}}
            onReset={handleReset}
            onCancel={onClose}
            onDelete={isEditing && onDelete ? () => onDelete(preset.id) : undefined}
          />
        </div>

        {/* Folder organization */}
        <div className="border-b border-zinc-800 px-4 py-3">
          <BrushFolderManager
            folders={folders}
            currentFolder={preset.folder}
            onSelectFolder={(folder) => update("folder", folder)}
            onCreateFolder={(name) => setFolders((prev) => [...prev, name])}
            onRenameFolder={(oldName, newName) => {
              setFolders((prev) => prev.map((f) => (f === oldName ? newName : f)));
              if (preset.folder === oldName) update("folder", newName);
            }}
            onDeleteFolder={(name) => {
              setFolders((prev) => prev.filter((f) => f !== name));
              if (preset.folder === name) update("folder", undefined);
            }}
          />
        </div>

        {/* Live preview */}
        <div className="border-b border-zinc-800 px-4 py-3">
          <BrushPreviewCanvas preset={preset} color={color} size={size} />
        </div>

        {/* ── Tip Shape ────────────────────────────────── */}
        <AccordionItem
          label="Tip Shape"
          isOpen={openSections.has("tip")}
          onToggle={() => toggleSection("tip")}
        >
          <StampPicker
            value={preset.stampUrl}
            onChange={(stampUrl) => update("stampUrl", stampUrl)}
          />

          {!preset.stampUrl && (
            <>
              <SliderControl
                label="Hardness"
                value={preset.hardness}
                onChange={(v) => update("hardness", v)}
              />

              {/* Shape toggle: circle / square */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400">Shape</span>
                <div className="flex gap-1">
                  {(["circle", "square"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => update("shape", s)}
                      className={cn(
                        "rounded px-2 py-0.5 text-[10px] capitalize transition-colors",
                        preset.shape === s
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <SliderControl
            label="Roundness"
            value={preset.roundness}
            onChange={(v) => update("roundness", v)}
          />
          <SliderControl
            label="Angle"
            value={preset.angle}
            onChange={(v) => update("angle", v)}
            min={0}
            max={360}
            step={1}
            displayValue={`${Math.round(preset.angle)}°`}
          />
          <SliderControl
            label="Spacing"
            value={preset.spacing}
            onChange={(v) => update("spacing", v)}
            min={1}
            max={500}
            step={1}
            displayValue={`${Math.round(preset.spacing)}%`}
          />
        </AccordionItem>

        {/* ── Texture / Grain ──────────────────────────── */}
        <AccordionItem
          label="Texture / Grain"
          isOpen={openSections.has("grain")}
          onToggle={() => toggleSection("grain")}
        >
          <GrainPicker
            value={preset.grainUrl}
            onChange={(grainUrl) => update("grainUrl", grainUrl)}
          />

          <SliderControl
            label="Scale"
            value={preset.grainScale}
            onChange={(v) => update("grainScale", v)}
            min={0.1}
            max={10}
            step={0.1}
            displayValue={preset.grainScale.toFixed(1)}
          />
          <SliderControl
            label="Intensity"
            value={preset.grainIntensity}
            onChange={(v) => update("grainIntensity", v)}
          />

          {/* Blend Mode */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400">Blend</span>
            <div className="flex gap-1">
              {(["multiply", "screen", "overlay"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => update("grainBlendMode", mode)}
                  className={cn(
                    "rounded px-2 py-0.5 text-[10px] capitalize transition-colors",
                    preset.grainBlendMode === mode
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Movement */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400">Movement</span>
            <div className="flex gap-1">
              {(["static", "rolling", "random"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => update("grainMovement", m)}
                  className={cn(
                    "rounded px-2 py-0.5 text-[10px] capitalize transition-colors",
                    preset.grainMovement === m
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </AccordionItem>

        {/* ── Dynamics ─────────────────────────────────── */}
        <AccordionItem
          label="Dynamics"
          isOpen={openSections.has("dynamics")}
          onToggle={() => toggleSection("dynamics")}
        >
          <DynamicsEditor
            label="Size"
            value={preset.sizeDynamics}
            onChange={(value) => update("sizeDynamics", value)}
          />
          <DynamicsEditor
            label="Opacity"
            value={preset.opacityDynamics}
            onChange={(value) => update("opacityDynamics", value)}
          />
          <DynamicsEditor
            label="Flow"
            value={preset.flowDynamics}
            onChange={(value) => update("flowDynamics", value)}
          />
          <DynamicsEditor
            label="Angle"
            value={preset.angleDynamics}
            onChange={(value) => update("angleDynamics", value)}
          />
        </AccordionItem>

        {/* ── Taper ────────────────────────────────────── */}
        <AccordionItem
          label="Taper"
          isOpen={openSections.has("taper")}
          onToggle={() => toggleSection("taper")}
        >
          <TaperEditor
            taperStart={preset.taperStart}
            taperEnd={preset.taperEnd}
            taperSizeMin={preset.taperSizeMin}
            onChange={(patch) => updatePartial(patch)}
          />
        </AccordionItem>

        {/* ── Scatter & Jitter ─────────────────────────── */}
        <AccordionItem
          label="Scatter & Jitter"
          isOpen={openSections.has("scatter")}
          onToggle={() => toggleSection("scatter")}
        >
          <ScatterJitterEditor
            scatter={preset.scatter}
            jitterSize={preset.jitterSize}
            jitterOpacity={preset.jitterOpacity}
            jitterRotation={preset.jitterRotation}
            onChange={(patch) => updatePartial(patch)}
          />
        </AccordionItem>

        {/* ── Rendering ────────────────────────────────── */}
        <AccordionItem
          label="Rendering"
          isOpen={openSections.has("rendering")}
          onToggle={() => toggleSection("rendering")}
        >
          <RenderModePicker
            renderMode={preset.renderMode ?? "normal"}
            smudgeStrength={preset.smudgeStrength ?? 0}
            blendMode={preset.blendMode}
            stabilization={preset.stabilization}
            isEraser={preset.isEraser}
            onChange={(patch) => updatePartial(patch)}
          />
        </AccordionItem>
      </div>

      {/* ── Footer actions ────────────────────────────── */}
      <div className="shrink-0 border-t border-zinc-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "flex-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors",
              "hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            {isSaving ? "Saving..." : isEditing ? "Save" : "Create"}
          </button>

          {isEditing && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                confirmDelete
                  ? "bg-red-600 text-white hover:bg-red-500"
                  : "bg-zinc-800 text-red-400 hover:bg-zinc-700"
              )}
            >
              {confirmDelete ? "Are you sure?" : "Delete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
