"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Pen,
  Highlighter,
  Eraser,
  X,
  Check,
  Trash2,
  Undo2,
  Redo2,
  Pencil,
  PenTool,
  Brush,
  Wind,
  Sword,
  Flame,
  Minus,
  Plus,
  Paintbrush,
  Layers,
  Square,
  Circle,
  Triangle,
  Star,
  Hexagon,
  Blend,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BRUSH_PRESETS, getBrushPreset } from "./brushes";
import type { BrushPreset, DabParams, DirtyRect } from "./engine/brush-types";
import { lerp, clamp } from "./engine/brush-types";
import { LayerManager, type BlendMode } from "./engine/layer-manager";
import { Compositor } from "./engine/compositor";
import { renderDab, preloadPresetAssets, preloadCategoryAssets } from "./engine/stamp-renderer";
import { LayerPanel } from "./ui/layer-panel";
import { BrushSettingsPanel } from "./ui/brush-settings-panel";
import { BrushStudioPanel } from "./ui/brush-studio/brush-studio-panel";
import { ToolStrip } from "./ui/tool-strip";
import { EditableValue } from "./ui/editable-value";
import { sampleColor } from "./tools/eyedropper-tool";
import { floodFill } from "./tools/fill-tool";
import {
  beginShape,
  updateShape,
  renderShapePreview,
  commitShape,
  endShape,
} from "./tools/shape-tool";
import { createShapeState } from "./tools/tool-types";
import type { ShapeType } from "./tools/tool-types";
import { beginSmudge, continueSmudge, endSmudge } from "./tools/smudge-tool";
import type { SmudgeState } from "./engine/smudge-engine";

// ─── Helpers ─────────────────────────────────────────────────────

/** Build a DabParams struct for renderDab() */
function makeDab(
  x: number,
  y: number,
  size: number,
  opacity: number,
  flow: number,
  rotation: number,
  strokePosition: number
): DabParams {
  return { x, y, size, opacity, flow, rotation, strokePosition };
}

/** Perceptual opacity curve: softens high opacity values for more natural feel */
const perceptualOpacity = (v: number) => Math.pow(v, 1.5);

/** Tool shortcut key map */
const TOOL_SHORTCUTS: Record<string, string> = {
  b: "brush",
  e: "eraser",
  u: "shape",
  i: "eyedropper",
  g: "fill",
  r: "smudge",
};

// ─── Brush icon mapping ──────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  pencils: Pencil,
  inks: PenTool,
  paints: Brush,
  airbrush: Wind,
  markers: Highlighter,
  textures: Paintbrush,
  fx: Flame,
  mecha: Sword,
  erasers: Eraser,
};

function getBrushIcon(preset: BrushPreset): React.ElementType {
  return CATEGORY_ICONS[preset.category] ?? Pen;
}

// ─── Types ───────────────────────────────────────────────────────

export interface DrawingBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DrawingOverlayProps {
  canvasWidth: number;
  canvasHeight: number;
  onComplete: (blob: Blob, bounds: DrawingBounds) => void;
  onCancel: () => void;
}

interface StrokeInfo {
  lastX: number;
  lastY: number;
  /** Distance since last placed dab */
  distanceRemainder: number;
  /** Previous pressure for interpolation */
  lastPressure: number;
}

interface UndoSnapshot {
  layerId: string;
  imageData: ImageData;
}

const MAX_LAYERS = 12;

// ─── Component ───────────────────────────────────────────────────

export function DrawingOverlay({
  canvasWidth,
  canvasHeight,
  onComplete,
  onCancel,
}: DrawingOverlayProps) {
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const layerManagerRef = useRef<LayerManager | null>(null);
  const compositorRef = useRef<Compositor | null>(null);
  const undoStackRef = useRef<UndoSnapshot[]>([]);
  const redoStackRef = useRef<UndoSnapshot[]>([]);

  const [activeBrushId, setActiveBrushId] = useState("pencil-hb");
  const [activeTool, setActiveTool] = useState<string>("brush");
  const [brushColor, setBrushColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(8);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [showBrushPicker, setShowBrushPicker] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showBrushStudio, setShowBrushStudio] = useState(false);
  const [studioEditPreset, setStudioEditPreset] = useState<BrushPreset | undefined>(undefined);

  // Shape tool state
  const [shapeType, setShapeType] = useState<ShapeType>("rect");
  const [shapeFilled, setShapeFilled] = useState(false);
  const shapeStateRef = useRef(createShapeState());

  // Track last non-eraser brush for switching back from eraser tool
  const lastBrushIdRef = useRef("pencil-hb");

  // Smudge tool state
  const smudgeStateRef = useRef<SmudgeState | null>(null);

  // Stroke position counter for taper / grain rolling
  const strokePositionRef = useRef(0);
  const strokeLengthRef = useRef(0);

  // rAF batching for compositing during strokes
  const rafIdRef = useRef<number>(0);
  const needsRecompositeRef = useRef(false);
  const strokeBoundsRef = useRef<DirtyRect | null>(null);

  // Stable refs for event handler values (prevents useEffect re-registration)
  const activeBrushIdRef = useRef(activeBrushId);
  const activeToolRef = useRef(activeTool);
  const brushColorRef = useRef(brushColor);
  const brushSizeRef = useRef(brushSize);
  const brushOpacityRef = useRef(brushOpacity);
  const shapeTypeRef = useRef(shapeType);
  const shapeFilledRef = useRef(shapeFilled);

  // Pending pointer events for rAF-deferred dab rendering
  const pendingPointsRef = useRef<Array<{x: number; y: number; pressure: number}>>([]);
  const processDabsRef = useRef<(() => void) | null>(null);
  const canvasRectRef = useRef<DOMRect | null>(null);

  // Drawing state
  const isDrawingRef = useRef(false);
  const strokeInfoRef = useRef<StrokeInfo | null>(null);
  const pendingUndoRef = useRef<UndoSnapshot | null>(null);

  // Asset loading gate
  const [assetsReady, setAssetsReady] = useState(false);
  const assetsReadyRef = useRef(false);

  // Portal mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync refs with state for stable event handlers
  useEffect(() => { activeBrushIdRef.current = activeBrushId; }, [activeBrushId]);
  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { brushColorRef.current = brushColor; }, [brushColor]);
  useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);
  useEffect(() => { brushOpacityRef.current = brushOpacity; }, [brushOpacity]);
  useEffect(() => { shapeTypeRef.current = shapeType; }, [shapeType]);
  useEffect(() => { shapeFilledRef.current = shapeFilled; }, [shapeFilled]);
  useEffect(() => { assetsReadyRef.current = assetsReady; }, [assetsReady]);

  // Layer state (mirrored for React rendering)
  const [layerState, setLayerState] = useState<{
    layers: LayerManager["layers"];
    activeLayerId: string;
  }>({ layers: [], activeLayerId: "" });

  const [canUndoDraw, setCanUndoDraw] = useState(false);
  const [canRedoDraw, setCanRedoDraw] = useState(false);

  const syncState = useCallback(() => {
    const lm = layerManagerRef.current;
    if (lm) {
      setLayerState({
        layers: [...lm.layers],
        activeLayerId: lm.activeLayerId,
      });
    }
    setCanUndoDraw(undoStackRef.current.length > 0);
    setCanRedoDraw(redoStackRef.current.length > 0);
  }, []);

  const recomposite = useCallback((dirtyRect?: DirtyRect | null) => {
    const c = compositorRef.current;
    const lm = layerManagerRef.current;
    if (c && lm) {
      if (dirtyRect) {
        // Partial update: skip markDirty() to use dirty-rect path
        c.composite(lm.layers, dirtyRect);
      } else {
        // Full update
        c.markDirty();
        c.composite(lm.layers);
      }
    }
  }, []);

  // Initialize layer system
  useEffect(() => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const lm = new LayerManager(canvasWidth, canvasHeight);
    const comp = new Compositor(canvas);

    layerManagerRef.current = lm;
    compositorRef.current = comp;
    undoStackRef.current = [];
    redoStackRef.current = [];

    comp.composite(lm.layers);
    syncState();
  }, [canvasWidth, canvasHeight, syncState]);

  // ─── Preload all brush assets on mount ──────────────────────────
  useEffect(() => {
    preloadCategoryAssets(BRUSH_PRESETS)
      .then(() => setAssetsReady(true))
      .catch(() => setAssetsReady(true));
  }, []);

  // ─── Preload brush assets when brush changes ──────────────────
  useEffect(() => {
    const preset = getBrushPreset(activeBrushId);
    if (preset) {
      preloadPresetAssets(preset).catch(() => {});
    }
  }, [activeBrushId]);

  // ─── rAF-batched recomposite for stroke rendering ─────────────
  const scheduleRecomposite = useCallback(() => {
    needsRecompositeRef.current = true;
    if (rafIdRef.current) return; // already scheduled
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = 0;
      // Render pending dabs first (deferred from pointerMove for smooth 60fps)
      if (processDabsRef.current) processDabsRef.current();
      if (needsRecompositeRef.current) {
        needsRecompositeRef.current = false;
        const bounds = strokeBoundsRef.current;
        strokeBoundsRef.current = null; // Reset per-frame for efficient dirty rects
        recomposite(bounds);
      }
    });
  }, [recomposite]);

  // Clean up rAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
    };
  }, []);

  // ─── Tool switching ────────────────────────────────────────────

  const handleSetTool = useCallback(
    (tool: string) => {
      setActiveTool(tool);

      if (tool === "eraser") {
        const currentPreset = getBrushPreset(activeBrushId);
        if (currentPreset && !currentPreset.isEraser) {
          lastBrushIdRef.current = activeBrushId;
        }
        setActiveBrushId("eraser-hard");
      } else if (tool === "brush") {
        const currentPreset = getBrushPreset(activeBrushId);
        if (currentPreset?.isEraser) {
          setActiveBrushId(lastBrushIdRef.current);
        }
      }
    },
    [activeBrushId]
  );

  // ─── Canvas coordinate conversion ────────────────────────────

  const getCanvasPoint = useCallback(
    (e: PointerEvent): { x: number; y: number; pressure: number } => {
      const canvas = displayCanvasRef.current;
      if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
      // Use cached rect to avoid layout thrashing during strokes
      if (!canvasRectRef.current) {
        canvasRectRef.current = canvas.getBoundingClientRect();
      }
      const rect = canvasRectRef.current;
      return {
        x: ((e.clientX - rect.left) / rect.width) * canvas.width,
        y: ((e.clientY - rect.top) / rect.height) * canvas.height,
        pressure: e.pressure || 0.5,
      };
    },
    []
  );

  // ─── Canvas event handling ─────────────────────────────────────
  // Stamp-based brush rendering: places dabs along the stroke path
  // at intervals controlled by the preset's spacing property.
  // Each dab uses hardness for edge softness, sizeDynamics for
  // pressure→size, opacityDynamics for pressure→opacity, flow for
  // per-dab opacity, scatter for random offset, and jitter for
  // random size/opacity variation.

  useEffect(() => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return;

    function saveUndoSnapshot(): void {
      const lm = layerManagerRef.current;
      if (!lm) return;
      const activeLayer = lm.getActiveLayer();
      if (!activeLayer) return;
      const ctx = activeLayer.canvas.getContext("2d");
      if (!ctx) return;
      try {
        const data = ctx.getImageData(
          0,
          0,
          activeLayer.canvas.width,
          activeLayer.canvas.height
        );
        pendingUndoRef.current = {
          layerId: activeLayer.id,
          imageData: data,
        };
      } catch {
        pendingUndoRef.current = null;
      }
    }

    function pushUndo(): void {
      if (pendingUndoRef.current) {
        undoStackRef.current.push(pendingUndoRef.current);
        if (undoStackRef.current.length > 30) undoStackRef.current.shift();
        redoStackRef.current = [];
        pendingUndoRef.current = null;
      }
    }

    // ─── Deferred dab renderer (called from rAF) ──────────────────
    // Drains the pending pointer queue and renders all dabs in one batch.
    // This is the KEY performance fix: dab rendering is capped to 60fps
    // instead of running synchronously on every pointer event.
    function processPendingDabs(): void {
      const points = pendingPointsRef.current;
      if (points.length === 0) return;
      pendingPointsRef.current = [];

      const stroke = strokeInfoRef.current;
      if (!stroke) return;

      const lm = layerManagerRef.current;
      if (!lm) return;
      const activeLayer = lm.getActiveLayer();
      if (!activeLayer) return;
      const ctx = activeLayer.canvas.getContext("2d");
      if (!ctx) return;

      const preset = getBrushPreset(activeBrushIdRef.current) ?? BRUSH_PRESETS[0];

      for (let pi = 0; pi < points.length; pi++) {
        const { x, y, pressure } = points[pi];

        const dx = x - stroke.lastX;
        const dy = y - stroke.lastY;
        const segDist = Math.sqrt(dx * dx + dy * dy);

        if (segDist < 0.1) continue;

        strokeLengthRef.current += segDist;

        const avgPressure = (stroke.lastPressure + pressure) / 2;
        const avgSizeMult = lerp(
          preset.sizeDynamics.pressureMin,
          preset.sizeDynamics.pressureMax,
          avgPressure
        );
        const avgSize = brushSizeRef.current * avgSizeMult;
        const spacing = Math.max(
          2,
          avgSize * (Math.max(preset.spacing, 1) / 100)
        );

        let d = spacing - stroke.distanceRemainder;

        while (d <= segDist) {
          const t = d / segDist;

          let dabX = stroke.lastX + dx * t;
          let dabY = stroke.lastY + dy * t;
          const p = stroke.lastPressure + (pressure - stroke.lastPressure) * t;

          const sizeMult = lerp(
            preset.sizeDynamics.pressureMin,
            preset.sizeDynamics.pressureMax,
            p
          );
          let dabSize = brushSizeRef.current * sizeMult;

          if (preset.jitterSize > 0) {
            const jNorm =
              preset.jitterSize > 1
                ? preset.jitterSize / 100
                : preset.jitterSize;
            dabSize *= 1 + (Math.random() - 0.5) * jNorm;
          }
          dabSize = Math.max(0.5, dabSize);

          const opMult = lerp(
            preset.opacityDynamics.pressureMin,
            preset.opacityDynamics.pressureMax,
            p
          );
          const flowMult = lerp(
            preset.flowDynamics.pressureMin,
            preset.flowDynamics.pressureMax,
            p
          );
          let dabOpacity = perceptualOpacity(brushOpacityRef.current) * opMult;

          if (preset.jitterOpacity > 0) {
            const jNorm =
              preset.jitterOpacity > 1
                ? preset.jitterOpacity / 100
                : preset.jitterOpacity;
            dabOpacity *= 1 + (Math.random() - 0.5) * jNorm;
          }

          if (preset.scatter > 0) {
            const scNorm =
              preset.scatter > 1
                ? preset.scatter / 100
                : preset.scatter;
            const scatterAmt = dabSize * scNorm;
            dabX += (Math.random() - 0.5) * scatterAmt * 2;
            dabY += (Math.random() - 0.5) * scatterAmt * 2;
          }

          let dabRotation = 0;
          if (preset.jitterRotation > 0) {
            dabRotation = (Math.random() - 0.5) * preset.jitterRotation;
          }

          strokePositionRef.current += spacing;
          const strokePos = strokeLengthRef.current > 0
            ? clamp(strokePositionRef.current / Math.max(strokeLengthRef.current, 1), 0, 1)
            : 0;

          const dab = makeDab(dabX, dabY, dabSize, dabOpacity, flowMult, dabRotation, strokePos);
          renderDab(ctx, dab, brushColorRef.current, preset);

          const halfDab = dabSize / 2 + 2;
          const dabMinX = dabX - halfDab;
          const dabMinY = dabY - halfDab;
          const dabMaxX = dabX + halfDab;
          const dabMaxY = dabY + halfDab;
          const bounds = strokeBoundsRef.current;
          if (bounds) {
            const bMaxX = bounds.x + bounds.width;
            const bMaxY = bounds.y + bounds.height;
            const nx = Math.min(bounds.x, dabMinX);
            const ny = Math.min(bounds.y, dabMinY);
            strokeBoundsRef.current = {
              x: nx,
              y: ny,
              width: Math.max(bMaxX, dabMaxX) - nx,
              height: Math.max(bMaxY, dabMaxY) - ny,
            };
          } else {
            strokeBoundsRef.current = {
              x: dabMinX,
              y: dabMinY,
              width: dabSize + 4,
              height: dabSize + 4,
            };
          }

          d += spacing;
        }

        stroke.distanceRemainder = segDist - (d - spacing);
        stroke.lastX = x;
        stroke.lastY = y;
        stroke.lastPressure = pressure;
      }
    }

    processDabsRef.current = processPendingDabs;

    function onPointerDown(e: PointerEvent) {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      e.preventDefault();
      e.stopPropagation(); // Prevent showcase editor marquee selection

      // Refresh cached canvas rect on stroke start
      canvasRectRef.current = canvas!.getBoundingClientRect();

      try {
        canvas!.setPointerCapture(e.pointerId);
      } catch {}

      const lm = layerManagerRef.current;
      if (!lm) return;

      const { x, y, pressure } = getCanvasPoint(e);

      // ── Eyedropper tool ──
      if (activeToolRef.current === "eyedropper") {
        const hex = sampleColor(canvas!, x, y);
        setBrushColor(hex);
        setActiveTool("brush");
        return;
      }

      const activeLayer = lm.getActiveLayer();
      if (!activeLayer || activeLayer.locked || !activeLayer.visible) return;

      const ctx = activeLayer.canvas.getContext("2d");
      if (!ctx) return;

      // ── Fill tool ──
      if (activeToolRef.current === "fill") {
        saveUndoSnapshot();
        floodFill(ctx, x, y, brushColorRef.current, 32);
        pushUndo();
        recomposite();
        syncState();
        return;
      }

      // ── Shape tool ──
      if (activeToolRef.current === "shape") {
        const ss = shapeStateRef.current;
        ss.type = shapeTypeRef.current;
        ss.filled = shapeFilledRef.current;
        ss.strokeWidth = brushSizeRef.current;
        ss.opacity = brushOpacityRef.current;
        beginShape(ss, x, y);
        isDrawingRef.current = true;
        saveUndoSnapshot();
        return;
      }

      // ── Smudge tool ──
      if (activeToolRef.current === "smudge") {
        isDrawingRef.current = true;
        saveUndoSnapshot();
        const preset = getBrushPreset(activeBrushIdRef.current) ?? BRUSH_PRESETS[0];
        const strength = preset.smudgeStrength ?? 0.5;
        smudgeStateRef.current = beginSmudge(ctx, x, y, brushSizeRef.current, strength);
        strokeInfoRef.current = {
          lastX: x,
          lastY: y,
          distanceRemainder: 0,
          lastPressure: pressure,
        };
        return;
      }

      // ── Brush / Eraser ──
      // Gate drawing on asset readiness
      if (!assetsReadyRef.current) return;

      isDrawingRef.current = true;
      saveUndoSnapshot();

      const preset = getBrushPreset(activeBrushIdRef.current) ?? BRUSH_PRESETS[0];

      // Reset stroke position tracking
      strokePositionRef.current = 0;
      strokeLengthRef.current = 0;
      strokeBoundsRef.current = null;

      // Calculate first dab
      const sizeMult = lerp(
        preset.sizeDynamics.pressureMin,
        preset.sizeDynamics.pressureMax,
        pressure
      );
      const dabSize = Math.max(0.5, brushSizeRef.current * sizeMult);
      const opMult = lerp(
        preset.opacityDynamics.pressureMin,
        preset.opacityDynamics.pressureMax,
        pressure
      );
      const flowMult = lerp(
        preset.flowDynamics.pressureMin,
        preset.flowDynamics.pressureMax,
        pressure
      );
      const dabOpacity = perceptualOpacity(brushOpacityRef.current) * opMult;

      const dab = makeDab(x, y, dabSize, dabOpacity, flowMult, 0, 0);
      renderDab(ctx, dab, brushColorRef.current, preset);

      strokeInfoRef.current = {
        lastX: x,
        lastY: y,
        distanceRemainder: 0,
        lastPressure: pressure,
      };

      // Immediate recomposite for first dab feedback
      recomposite();
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      const { x, y, pressure } = getCanvasPoint(e);

      // ── Shape preview ──
      if (activeToolRef.current === "shape") {
        const ss = shapeStateRef.current;
        updateShape(ss, x, y);
        recomposite();
        const displayCtx = canvas!.getContext("2d");
        if (displayCtx) {
          renderShapePreview(ss, displayCtx, brushColorRef.current);
        }
        return;
      }

      // ── Smudge tool ──
      if (activeToolRef.current === "smudge") {
        const stroke = strokeInfoRef.current;
        const smState = smudgeStateRef.current;
        if (!stroke || !smState) return;

        const lm = layerManagerRef.current;
        if (!lm) return;
        const activeLayer = lm.getActiveLayer();
        if (!activeLayer) return;
        const ctx = activeLayer.canvas.getContext("2d");
        if (!ctx) return;

        continueSmudge(ctx, smState, x, y, brushSizeRef.current, brushOpacityRef.current);

        stroke.lastX = x;
        stroke.lastY = y;
        stroke.lastPressure = pressure;
        recomposite();
        return;
      }

      // ── Brush / Eraser ── defer dab rendering to rAF for smooth 60fps
      pendingPointsRef.current.push({ x, y, pressure });
      scheduleRecomposite();
    }

    function onPointerUp(e: PointerEvent) {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      isDrawingRef.current = false;

      // ── Shape commit ──
      if (activeToolRef.current === "shape") {
        const ss = shapeStateRef.current;
        const lm = layerManagerRef.current;
        if (lm && ss.start && ss.end) {
          const activeLayer = lm.getActiveLayer();
          if (activeLayer) {
            const ctx = activeLayer.canvas.getContext("2d");
            if (ctx) {
              commitShape(ss, ctx, brushColorRef.current, brushSizeRef.current);
            }
          }
        }
        endShape(ss);
        pushUndo();
        recomposite();
        syncState();
        return;
      }

      // ── Smudge tool ──
      if (activeToolRef.current === "smudge" && smudgeStateRef.current) {
        endSmudge(smudgeStateRef.current);
        smudgeStateRef.current = null;
        strokeInfoRef.current = null;
        pushUndo();
        recomposite();
        syncState();
        return;
      }

      // ── Brush / Eraser ──
      // Cancel pending rAF and process remaining dabs before final composite
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
        needsRecompositeRef.current = false;
      }
      processPendingDabs();
      pendingPointsRef.current = [];
      strokeInfoRef.current = null;
      strokePositionRef.current = 0;
      strokeLengthRef.current = 0;
      strokeBoundsRef.current = null;
      pushUndo();
      recomposite(); // full recomposite on stroke end
      syncState();
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);

    return () => {
      processDabsRef.current = null;
      pendingPointsRef.current = [];
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
    };
  }, [getCanvasPoint, syncState, recomposite, scheduleRecomposite]);

  // ─── Layer operations ─────────────────────────────────────────

  const handleAddLayer = useCallback(() => {
    const lm = layerManagerRef.current;
    if (!lm || lm.layers.length >= MAX_LAYERS) return;
    lm.addLayer();
    recomposite();
    syncState();
  }, [recomposite, syncState]);

  const handleDeleteLayer = useCallback(
    (id: string) => {
      const lm = layerManagerRef.current;
      if (!lm) return;
      lm.deleteLayer(id);
      recomposite();
      syncState();
    },
    [recomposite, syncState]
  );

  const handleDuplicateLayer = useCallback(
    (id: string) => {
      const lm = layerManagerRef.current;
      if (!lm || lm.layers.length >= MAX_LAYERS) return;
      lm.duplicateLayer(id);
      recomposite();
      syncState();
    },
    [recomposite, syncState]
  );

  const handleMergeDown = useCallback(
    (id: string) => {
      const lm = layerManagerRef.current;
      if (!lm) return;
      lm.mergeDown(id);
      recomposite();
      syncState();
    },
    [recomposite, syncState]
  );

  const handleMoveLayer = useCallback(
    (id: string, direction: "up" | "down") => {
      const lm = layerManagerRef.current;
      if (!lm) return;
      lm.moveLayer(id, direction);
      recomposite();
      syncState();
    },
    [recomposite, syncState]
  );

  const handleSelectLayer = useCallback(
    (id: string) => {
      const lm = layerManagerRef.current;
      if (!lm) return;
      lm.setActiveLayer(id);
      syncState();
    },
    [syncState]
  );

  const handleToggleVisibility = useCallback(
    (id: string) => {
      const lm = layerManagerRef.current;
      if (!lm) return;
      lm.toggleVisibility(id);
      recomposite();
      syncState();
    },
    [recomposite, syncState]
  );

  const handleToggleLock = useCallback(
    (id: string) => {
      const lm = layerManagerRef.current;
      if (!lm) return;
      lm.toggleLock(id);
      syncState();
    },
    [syncState]
  );

  const handleSetOpacity = useCallback(
    (id: string, opacity: number) => {
      const lm = layerManagerRef.current;
      if (!lm) return;
      lm.setOpacity(id, opacity);
      recomposite();
      syncState();
    },
    [recomposite, syncState]
  );

  const handleSetBlendMode = useCallback(
    (id: string, mode: BlendMode) => {
      const lm = layerManagerRef.current;
      if (!lm) return;
      lm.setBlendMode(id, mode);
      recomposite();
      syncState();
    },
    [recomposite, syncState]
  );

  const handleRenameLayer = useCallback(
    (id: string, name: string) => {
      const lm = layerManagerRef.current;
      if (!lm) return;
      lm.renameLayer(id, name);
      syncState();
    },
    [syncState]
  );

  // ─── Undo / Redo / Clear / Done ──────────────────────────────

  const handleUndo = useCallback(() => {
    const lm = layerManagerRef.current;
    if (!lm) return;
    const snapshot = undoStackRef.current.pop();
    if (!snapshot) return;

    const layer = lm.layers.find((l) => l.id === snapshot.layerId);
    if (layer) {
      const ctx = layer.canvas.getContext("2d");
      if (ctx) {
        const current = ctx.getImageData(
          0,
          0,
          layer.canvas.width,
          layer.canvas.height
        );
        redoStackRef.current.push({
          layerId: snapshot.layerId,
          imageData: current,
        });
        ctx.putImageData(snapshot.imageData, 0, 0);
      }
    }

    recomposite();
    syncState();
  }, [recomposite, syncState]);

  const handleRedo = useCallback(() => {
    const lm = layerManagerRef.current;
    if (!lm) return;
    const snapshot = redoStackRef.current.pop();
    if (!snapshot) return;

    const layer = lm.layers.find((l) => l.id === snapshot.layerId);
    if (layer) {
      const ctx = layer.canvas.getContext("2d");
      if (ctx) {
        const current = ctx.getImageData(
          0,
          0,
          layer.canvas.width,
          layer.canvas.height
        );
        undoStackRef.current.push({
          layerId: snapshot.layerId,
          imageData: current,
        });
        ctx.putImageData(snapshot.imageData, 0, 0);
      }
    }

    recomposite();
    syncState();
  }, [recomposite, syncState]);

  // ─── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Skip when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      // Tool shortcuts
      const tool = TOOL_SHORTCUTS[e.key.toLowerCase()];
      if (tool && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleSetTool(tool);
        return;
      }

      // Undo: Ctrl/Cmd+Z
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl/Cmd+Shift+Z
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Brush size: [ decrease, ] increase
      if (e.key === "[" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setBrushSize((s) => Math.max(1, s - (s > 20 ? 5 : 2)));
        return;
      }
      if (e.key === "]" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setBrushSize((s) => Math.min(200, s + (s > 20 ? 5 : 2)));
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSetTool, handleUndo, handleRedo]);

  const handleClear = useCallback(() => {
    const lm = layerManagerRef.current;
    if (!lm) return;
    const activeLayer = lm.getActiveLayer();
    if (!activeLayer) return;

    const ctx = activeLayer.canvas.getContext("2d");
    if (ctx) {
      try {
        const data = ctx.getImageData(
          0,
          0,
          activeLayer.canvas.width,
          activeLayer.canvas.height
        );
        undoStackRef.current.push({
          layerId: activeLayer.id,
          imageData: data,
        });
        redoStackRef.current = [];
      } catch {}
    }

    lm.clearLayer(activeLayer.id);
    recomposite();
    syncState();
  }, [recomposite, syncState]);

  const handleDone = useCallback(() => {
    const lm = layerManagerRef.current;
    const comp = compositorRef.current;
    if (!lm || !comp) return;

    const flatCanvas = comp.flatten(lm.layers);
    const ctx = flatCanvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, flatCanvas.width, flatCanvas.height);
    const { data, width, height } = imageData;
    let minX = width,
      minY = height,
      maxX = 0,
      maxY = 0;
    let hasContent = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 0) {
          hasContent = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!hasContent) {
      onCancel();
      return;
    }

    const pad = Math.max(
      4,
      Math.round(Math.max(maxX - minX, maxY - minY) * 0.02)
    );
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(width - 1, maxX + pad);
    maxY = Math.min(height - 1, maxY + pad);

    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;

    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = cropW;
    croppedCanvas.height = cropH;
    const croppedCtx = croppedCanvas.getContext("2d");
    if (!croppedCtx) return;

    croppedCtx.drawImage(
      flatCanvas,
      minX,
      minY,
      cropW,
      cropH,
      0,
      0,
      cropW,
      cropH
    );

    const bounds = {
      x: (minX / width) * 100,
      y: (minY / height) * 100,
      width: (cropW / width) * 100,
      height: (cropH / height) * 100,
    };

    croppedCanvas.toBlob(
      (blob) => {
        if (blob) onComplete(blob, bounds);
      },
      "image/png",
      1
    );
  }, [onComplete, onCancel]);

  const activePreset = getBrushPreset(activeBrushId) ?? BRUSH_PRESETS[0];
  const ActiveIcon = getBrushIcon(activePreset);

  // ─── Render ────────────────────────────────────────────────────

  return (
    <>
      {/* Canvas container */}
      <div className="absolute inset-0" style={{ zIndex: 200 }}>
        <canvas
          ref={displayCanvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
          style={{ zIndex: 201 }}
        />
        {!assetsReady && (
          <div className="absolute inset-0 flex items-center justify-center z-[202] pointer-events-none">
            <div className="px-4 py-2 rounded-lg bg-zinc-900/90 text-zinc-400 text-sm">
              Loading brushes...
            </div>
          </div>
        )}
      </div>

      {/* All UI portaled to document.body to escape stacking context */}
      {mounted &&
        createPortal(
          <div data-drawing-ui>
            {/* Tool strip — left sidebar (desktop) / bottom bar (mobile) */}
            <ToolStrip
              activeTool={activeTool}
              onSetTool={handleSetTool}
              canUndo={canUndoDraw}
              canRedo={canRedoDraw}
              onUndo={handleUndo}
              onRedo={handleRedo}
            />

            {/* Top toolbar */}
            <div
              className="fixed top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 shadow-2xl max-w-[calc(100vw-1rem)] overflow-x-auto"
              style={{ zIndex: 10000, scrollbarWidth: "none" }}
            >
              {/* ── Tool-specific controls ── */}

              {/* Brush/Eraser: brush picker button */}
              {(activeTool === "brush" || activeTool === "eraser") && (
                <>
                  <button
                    onClick={() => setShowBrushPicker(!showBrushPicker)}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                      showBrushPicker
                        ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                    )}
                    title={activePreset.name}
                  >
                    <ActiveIcon className="h-4 w-4" />
                  </button>
                  <div className="w-px h-6 bg-zinc-700 flex-shrink-0" />
                </>
              )}

              {/* Shape: shape type + fill toggle */}
              {activeTool === "shape" && (
                <>
                  {([
                    { type: "line" as ShapeType, icon: Minus, label: "Line" },
                    { type: "rect" as ShapeType, icon: Square, label: "Rect" },
                    { type: "ellipse" as ShapeType, icon: Circle, label: "Ellipse" },
                    { type: "triangle" as ShapeType, icon: Triangle, label: "Triangle" },
                    { type: "polygon" as ShapeType, icon: Hexagon, label: "Polygon" },
                    { type: "star" as ShapeType, icon: Star, label: "Star" },
                  ]).map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      onClick={() => setShapeType(type)}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                        shapeType === type
                          ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                      )}
                      title={label}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}

                  {/* Polygon side count */}
                  {shapeType === "polygon" && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-[9px] text-zinc-500">Sides</span>
                      <input
                        type="number"
                        min={3}
                        max={20}
                        value={shapeStateRef.current.sideCount}
                        onChange={(e) => {
                          const v = clamp(parseInt(e.target.value) || 6, 3, 20);
                          shapeStateRef.current.sideCount = v;
                        }}
                        className="w-10 bg-zinc-800 text-xs text-zinc-300 px-1 py-0.5 rounded border border-zinc-700 text-center"
                      />
                    </div>
                  )}

                  {/* Star controls */}
                  {shapeType === "star" && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-[9px] text-zinc-500">Pts</span>
                      <input
                        type="number"
                        min={3}
                        max={20}
                        value={shapeStateRef.current.starPointCount}
                        onChange={(e) => {
                          const v = clamp(parseInt(e.target.value) || 5, 3, 20);
                          shapeStateRef.current.starPointCount = v;
                        }}
                        className="w-10 bg-zinc-800 text-xs text-zinc-300 px-1 py-0.5 rounded border border-zinc-700 text-center"
                      />
                    </div>
                  )}

                  <button
                    onClick={() => setShapeFilled(!shapeFilled)}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-medium transition-colors flex-shrink-0",
                      shapeFilled
                        ? "bg-blue-500/20 text-blue-400"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                    )}
                  >
                    {shapeFilled ? "Filled" : "Stroke"}
                  </button>
                  <div className="w-px h-6 bg-zinc-700 flex-shrink-0" />
                </>
              )}

              {/* Eyedropper: info */}
              {activeTool === "eyedropper" && (
                <>
                  <span className="text-[10px] text-zinc-400 flex-shrink-0 px-2">
                    Click to pick color
                  </span>
                  <div className="w-px h-6 bg-zinc-700 flex-shrink-0" />
                </>
              )}

              {/* Fill: info */}
              {activeTool === "fill" && (
                <>
                  <span className="text-[10px] text-zinc-400 flex-shrink-0 px-2">
                    Click to fill area
                  </span>
                  <div className="w-px h-6 bg-zinc-700 flex-shrink-0" />
                </>
              )}

              {/* Color picker */}
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-zinc-700 flex-shrink-0"
              />

              {/* Size control */}
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={() =>
                    setBrushSize(
                      Math.max(1, brushSize - (brushSize > 20 ? 5 : 2))
                    )
                  }
                  className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-bold"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <input
                  type="range"
                  min={1}
                  max={200}
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-16 sm:w-20 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                />
                <button
                  onClick={() =>
                    setBrushSize(
                      Math.min(200, brushSize + (brushSize > 20 ? 5 : 2))
                    )
                  }
                  className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-bold"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <EditableValue
                  value={brushSize}
                  onChange={setBrushSize}
                  min={1}
                  max={200}
                  className="w-6 text-center"
                />
              </div>

              {/* Opacity control */}
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <span className="text-[9px] text-zinc-500 w-5">Op</span>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={Math.round(brushOpacity * 100)}
                  onChange={(e) =>
                    setBrushOpacity(parseInt(e.target.value) / 100)
                  }
                  className="w-12 sm:w-16 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                />
                <EditableValue
                  value={Math.round(brushOpacity * 100)}
                  onChange={(v) => setBrushOpacity(v / 100)}
                  min={1}
                  max={100}
                  suffix="%"
                  className="w-7 text-center"
                />
              </div>

              <div className="w-px h-6 bg-zinc-700 flex-shrink-0" />

              {/* Layer panel toggle */}
              <button
                onClick={() => setShowLayerPanel(!showLayerPanel)}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                  showLayerPanel
                    ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                )}
                title="Layers"
              >
                <Layers className="h-4 w-4" />
              </button>

              {/* Clear */}
              <button
                onClick={handleClear}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors flex-shrink-0"
                title="Clear active layer"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {/* Undo */}
              <button
                onClick={handleUndo}
                disabled={!canUndoDraw}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                  canUndoDraw
                    ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                    : "text-zinc-600 cursor-not-allowed"
                )}
                title="Undo"
              >
                <Undo2 className="h-4 w-4" />
              </button>

              {/* Redo */}
              <button
                onClick={handleRedo}
                disabled={!canRedoDraw}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                  canRedoDraw
                    ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                    : "text-zinc-600 cursor-not-allowed"
                )}
                title="Redo"
              >
                <Redo2 className="h-4 w-4" />
              </button>

              {/* Cancel */}
              <button
                onClick={onCancel}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex-shrink-0"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Done */}
              <button
                onClick={handleDone}
                className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-400 transition-colors flex items-center gap-1.5 flex-shrink-0"
              >
                <Check className="h-3.5 w-3.5" />
                Done
              </button>
            </div>

            {/* Brush settings panel */}
            {showBrushPicker && (
              <BrushSettingsPanel
                activeBrushId={activeBrushId}
                onSelectBrush={(id) => {
                  setActiveBrushId(id);
                  const p = getBrushPreset(id);
                  if (p?.isEraser) {
                    setActiveTool("eraser");
                  } else {
                    setActiveTool("brush");
                    lastBrushIdRef.current = id;
                  }
                  if (p?.isEraser && brushOpacity < 1) {
                    setBrushOpacity(1);
                  }
                }}
                brushSize={brushSize}
                onSetSize={setBrushSize}
                brushOpacity={brushOpacity}
                onSetOpacity={setBrushOpacity}
                onClose={() => setShowBrushPicker(false)}
                onOpenStudio={() => {
                  setStudioEditPreset(undefined);
                  setShowBrushStudio(true);
                }}
                onEditPreset={(preset) => {
                  setStudioEditPreset(preset);
                  setShowBrushStudio(true);
                }}
              />
            )}

            {/* Brush Studio panel */}
            {showBrushStudio && (
              <BrushStudioPanel
                initialPreset={studioEditPreset}
                color={brushColor}
                size={brushSize}
                onSave={(preset) => {
                  // For now, just close the studio
                  // Cloud persistence can be wired in later
                  setShowBrushStudio(false);
                  setStudioEditPreset(undefined);
                }}
                onDelete={studioEditPreset ? (id) => {
                  setShowBrushStudio(false);
                  setStudioEditPreset(undefined);
                } : undefined}
                onClose={() => {
                  setShowBrushStudio(false);
                  setStudioEditPreset(undefined);
                }}
              />
            )}

            {/* Layer panel */}
            {showLayerPanel && (
              <LayerPanel
                layers={layerState.layers}
                activeLayerId={layerState.activeLayerId}
                onSelectLayer={handleSelectLayer}
                onAddLayer={handleAddLayer}
                onDeleteLayer={handleDeleteLayer}
                onDuplicateLayer={handleDuplicateLayer}
                onMergeDown={handleMergeDown}
                onMoveLayer={handleMoveLayer}
                onToggleVisibility={handleToggleVisibility}
                onToggleLock={handleToggleLock}
                onSetOpacity={handleSetOpacity}
                onSetBlendMode={handleSetBlendMode}
                onRenameLayer={handleRenameLayer}
                onClose={() => setShowLayerPanel(false)}
                maxLayers={MAX_LAYERS}
              />
            )}
          </div>,
          document.body
        )}
    </>
  );
}
