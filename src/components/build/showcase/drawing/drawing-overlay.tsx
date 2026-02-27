"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { createPortal } from "react-dom";
import { PencilStroke, DEFAULT_PENCIL_SETTINGS, type PencilSettings } from "./engine/pencil-engine";
import type { DirtyRect } from "./engine/brush-types";
import { clamp } from "./engine/brush-types";
import { LayerManager, type BlendMode } from "./engine/layer-manager";
import { Compositor } from "./engine/compositor";
import { PencilToolbar } from "./ui/pencil-toolbar";
import { LayerPanel } from "./ui/layer-panel";
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

// ─── Types ──────────────────────────────────────────────────────

export interface DrawingBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DrawingOverlayProps {
  canvasWidth: number;
  canvasHeight: number;
  onComplete: (blob: Blob, bounds: DrawingBounds) => void | Promise<void>;
  onCancel: () => void;
}

interface UndoSnapshot {
  layerId: string;
  imageData: ImageData;
}

const MAX_LAYERS = 12;

export interface DrawingOverlayHandle {
  flush: () => Promise<void>;
}

// ─── Tool shortcuts ─────────────────────────────────────────────

const TOOL_SHORTCUTS: Record<string, string> = {
  b: "pencil",
  p: "pencil",
  e: "eraser",
  u: "shape",
  i: "eyedropper",
  g: "fill",
};

// ─── Component ──────────────────────────────────────────────────

export const DrawingOverlay = forwardRef<DrawingOverlayHandle, DrawingOverlayProps>(
  function DrawingOverlay({ canvasWidth, canvasHeight, onComplete, onCancel }, ref) {
    // ─── Canvas & compositing refs ──────────────────────────────
    const displayCanvasRef = useRef<HTMLCanvasElement>(null);
    const layerManagerRef = useRef<LayerManager | null>(null);
    const compositorRef = useRef<Compositor | null>(null);

    // ─── Undo / Redo stacks ─────────────────────────────────────
    const undoStackRef = useRef<UndoSnapshot[]>([]);
    const redoStackRef = useRef<UndoSnapshot[]>([]);
    const pendingUndoRef = useRef<UndoSnapshot | null>(null);

    // ─── Pencil settings (persisted to localStorage) ────────────
    const [pencilSettings, setPencilSettings] = useState<PencilSettings>(() => {
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("gx-pencil-settings");
          if (saved) return { ...DEFAULT_PENCIL_SETTINGS, ...JSON.parse(saved) };
        } catch {
          // ignore parse errors
        }
      }
      return DEFAULT_PENCIL_SETTINGS;
    });

    // ─── Tool state ─────────────────────────────────────────────
    const [activeTool, setActiveTool] = useState<string>("pencil");
    const [showLayerPanel, setShowLayerPanel] = useState(false);

    // Shape tool state
    const [shapeType, setShapeType] = useState<ShapeType>("rect");
    const [shapeFilled, setShapeFilled] = useState(false);
    const shapeStateRef = useRef(createShapeState());

    // ─── Drawing refs ───────────────────────────────────────────
    const isDrawingRef = useRef(false);
    const activeStrokeRef = useRef<PencilStroke | null>(null);
    const canvasRectRef = useRef<DOMRect | null>(null);

    // rAF batching for compositing
    const rafIdRef = useRef<number>(0);
    const needsRecompositeRef = useRef(false);
    const strokeBoundsRef = useRef<DirtyRect | null>(null);

    // Palm rejection: track active pen pointer to ignore touch
    const activePenPointerRef = useRef<number | null>(null);

    // Stable refs for event handler access (avoids stale closures)
    const activeToolRef = useRef(activeTool);
    const pencilSettingsRef = useRef(pencilSettings);
    const shapeTypeRef = useRef(shapeType);
    const shapeFilledRef = useRef(shapeFilled);

    // ─── Portal mount ───────────────────────────────────────────
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
      setMounted(true);
    }, []);

    // ─── Sync refs with state ───────────────────────────────────
    useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
    useEffect(() => { pencilSettingsRef.current = pencilSettings; }, [pencilSettings]);
    useEffect(() => { shapeTypeRef.current = shapeType; }, [shapeType]);
    useEffect(() => { shapeFilledRef.current = shapeFilled; }, [shapeFilled]);

    // ─── Persist pencil settings ────────────────────────────────
    useEffect(() => {
      try {
        localStorage.setItem("gx-pencil-settings", JSON.stringify(pencilSettings));
      } catch {
        // ignore quota errors
      }
    }, [pencilSettings]);

    // ─── Layer state (mirrored for React rendering) ─────────────
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

    // ─── Compositing ────────────────────────────────────────────

    const recomposite = useCallback((dirtyRect?: DirtyRect | null) => {
      const c = compositorRef.current;
      const lm = layerManagerRef.current;
      if (c && lm) {
        if (dirtyRect) {
          c.composite(lm.layers, dirtyRect);
        } else {
          c.markDirty();
          c.composite(lm.layers);
        }
      }
    }, []);

    const scheduleRecomposite = useCallback(() => {
      needsRecompositeRef.current = true;
      if (rafIdRef.current) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = 0;
        if (needsRecompositeRef.current) {
          needsRecompositeRef.current = false;
          const bounds = strokeBoundsRef.current;
          strokeBoundsRef.current = null;
          recomposite(bounds);
        }
      });
    }, [recomposite]);

    // ─── Initialize layer system ────────────────────────────────

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

    // Clean up rAF on unmount
    useEffect(() => {
      return () => {
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = 0;
        }
      };
    }, []);

    // ─── Canvas coordinate conversion ───────────────────────────

    const getCanvasPoint = useCallback(
      (e: PointerEvent): { x: number; y: number; pressure: number; tiltX: number; tiltY: number } => {
        const canvas = displayCanvasRef.current;
        if (!canvas) return { x: 0, y: 0, pressure: 0.5, tiltX: 0, tiltY: 0 };
        if (!canvasRectRef.current) {
          canvasRectRef.current = canvas.getBoundingClientRect();
        }
        const rect = canvasRectRef.current;
        return {
          x: ((e.clientX - rect.left) / rect.width) * canvas.width,
          y: ((e.clientY - rect.top) / rect.height) * canvas.height,
          pressure: e.pressure || 0.5,
          tiltX: e.tiltX || 0,
          tiltY: e.tiltY || 0,
        };
      },
      []
    );

    // ─── Undo snapshot helpers ──────────────────────────────────

    const saveUndoSnapshot = useCallback((): void => {
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
    }, []);

    const pushUndo = useCallback((): void => {
      if (pendingUndoRef.current) {
        undoStackRef.current.push(pendingUndoRef.current);
        if (undoStackRef.current.length > 30) undoStackRef.current.shift();
        redoStackRef.current = [];
        pendingUndoRef.current = null;
      }
    }, []);

    // ─── Canvas event handling ──────────────────────────────────

    useEffect(() => {
      const canvas = displayCanvasRef.current;
      if (!canvas) return;

      function onPointerDown(e: PointerEvent) {
        if (e.button !== 0 && e.pointerType === "mouse") return;

        // Palm rejection: if a pen stroke is active, ignore touch pointers
        if (e.pointerType === "touch" && activePenPointerRef.current !== null) return;
        if (e.pointerType === "pen") activePenPointerRef.current = e.pointerId;

        e.preventDefault();
        e.stopPropagation();

        // Refresh cached canvas rect on stroke start
        canvasRectRef.current = canvas!.getBoundingClientRect();

        try {
          canvas!.setPointerCapture(e.pointerId);
        } catch {
          // ignore if capture fails
        }

        const lm = layerManagerRef.current;
        if (!lm) return;

        const { x, y, pressure, tiltX, tiltY } = getCanvasPoint(e);

        // ── Eyedropper tool ──
        if (activeToolRef.current === "eyedropper") {
          const hex = sampleColor(canvas!, x, y);
          setPencilSettings((prev) => ({ ...prev, color: hex }));
          setActiveTool("pencil");
          return;
        }

        const activeLayer = lm.getActiveLayer();
        if (!activeLayer || activeLayer.locked || !activeLayer.visible) return;

        const ctx = activeLayer.canvas.getContext("2d");
        if (!ctx) return;

        // ── Fill tool ──
        if (activeToolRef.current === "fill") {
          saveUndoSnapshot();
          floodFill(ctx, x, y, pencilSettingsRef.current.color, 32);
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
          ss.strokeWidth = pencilSettingsRef.current.size;
          ss.opacity = pencilSettingsRef.current.opacity;
          beginShape(ss, x, y);
          isDrawingRef.current = true;
          saveUndoSnapshot();
          return;
        }

        // ── Pencil / Eraser ──
        isDrawingRef.current = true;
        saveUndoSnapshot();

        const settings = pencilSettingsRef.current;
        const strokeSettings: PencilSettings = {
          ...settings,
          isEraser: activeToolRef.current === "eraser",
        };

        // For non-pen input, use a fixed default pressure
        const effectivePressure = e.pointerType === "pen" ? pressure : 0.5;

        activeStrokeRef.current = new PencilStroke(ctx, strokeSettings);
        const dirty = activeStrokeRef.current.addPoint(x, y, effectivePressure, tiltX, tiltY);

        // Track dirty rect for this stroke frame
        if (dirty) {
          strokeBoundsRef.current = dirty;
        }

        // Immediate recomposite for first-dab feedback
        recomposite();
      }

      function onPointerMove(e: PointerEvent) {
        if (!isDrawingRef.current) return;

        // Palm rejection: ignore touch events while pen is drawing
        if (e.pointerType === "touch" && activePenPointerRef.current !== null) return;

        e.preventDefault();
        e.stopPropagation();

        const { x, y, pressure, tiltX, tiltY } = getCanvasPoint(e);

        // ── Shape preview ──
        if (activeToolRef.current === "shape") {
          const ss = shapeStateRef.current;
          updateShape(ss, x, y);
          recomposite();
          const displayCtx = canvas!.getContext("2d");
          if (displayCtx) {
            renderShapePreview(ss, displayCtx, pencilSettingsRef.current.color);
          }
          return;
        }

        // ── Pencil / Eraser ──
        if (activeStrokeRef.current) {
          const effectivePressure = e.pointerType === "pen" ? pressure : 0.5;
          const dirty = activeStrokeRef.current.addPoint(x, y, effectivePressure, tiltX, tiltY);

          // Accumulate dirty rect
          if (dirty) {
            const existing = strokeBoundsRef.current;
            if (existing) {
              const minX = Math.min(existing.x, dirty.x);
              const minY = Math.min(existing.y, dirty.y);
              const maxX = Math.max(existing.x + existing.width, dirty.x + dirty.width);
              const maxY = Math.max(existing.y + existing.height, dirty.y + dirty.height);
              strokeBoundsRef.current = {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY,
              };
            } else {
              strokeBoundsRef.current = dirty;
            }
          }

          scheduleRecomposite();
        }
      }

      function onPointerUp(e: PointerEvent) {
        if (!isDrawingRef.current) return;

        // Palm rejection: ignore touch up while pen is drawing
        if (e.pointerType === "touch" && activePenPointerRef.current !== null) return;
        if (e.pointerType === "pen") activePenPointerRef.current = null;

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
                commitShape(
                  ss,
                  ctx,
                  pencilSettingsRef.current.color,
                  pencilSettingsRef.current.size
                );
              }
            }
          }
          endShape(ss);
          pushUndo();
          recomposite();
          syncState();
          return;
        }

        // ── Pencil / Eraser ──
        // Flush any pending rAF
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = 0;
          needsRecompositeRef.current = false;
        }

        // End taper
        activeStrokeRef.current?.end();
        activeStrokeRef.current = null;
        strokeBoundsRef.current = null;
        pushUndo();
        recomposite();
        syncState();
      }

      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerup", onPointerUp);
      canvas.addEventListener("pointerleave", onPointerUp);

      return () => {
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointerleave", onPointerUp);
      };
    }, [getCanvasPoint, syncState, recomposite, scheduleRecomposite, saveUndoSnapshot, pushUndo]);

    // ─── Tool change handler ────────────────────────────────────

    const handleSetTool = useCallback((tool: string) => {
      setActiveTool(tool);
    }, []);

    // ─── Pencil settings update helper ──────────────────────────

    const updatePencilSetting = useCallback(
      <K extends keyof PencilSettings>(key: K, value: PencilSettings[K]) => {
        setPencilSettings((prev) => ({ ...prev, [key]: value }));
      },
      []
    );

    // ─── Layer operations ───────────────────────────────────────

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

    // ─── Undo / Redo ────────────────────────────────────────────

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

    // ─── Clear active layer ─────────────────────────────────────

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
        } catch {
          // ignore
        }
      }

      lm.clearLayer(activeLayer.id);
      recomposite();
      syncState();
    }, [recomposite, syncState]);

    // ─── Done (export) ──────────────────────────────────────────

    const handleDone = useCallback((): Promise<void> => {
      const lm = layerManagerRef.current;
      const comp = compositorRef.current;
      if (!lm || !comp) return Promise.resolve();

      const flatCanvas = comp.flatten(lm.layers);
      const ctx = flatCanvas.getContext("2d");
      if (!ctx) return Promise.resolve();

      const imageData = ctx.getImageData(0, 0, flatCanvas.width, flatCanvas.height);
      const { data, width, height } = imageData;
      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;
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
        return Promise.resolve();
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
      if (!croppedCtx) return Promise.resolve();

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

      return new Promise<void>((resolve) => {
        croppedCanvas.toBlob(
          async (blob) => {
            if (blob) await onComplete(blob, bounds);
            resolve();
          },
          "image/png",
          1
        );
      });
    }, [onComplete, onCancel]);

    // ─── Expose flush() for parent ──────────────────────────────

    useImperativeHandle(
      ref,
      () => ({
        flush: handleDone,
      }),
      [handleDone]
    );

    // ─── Keyboard shortcuts ─────────────────────────────────────

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

        // Undo: Ctrl/Cmd+Z — stop propagation to prevent editor undo
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z") {
          e.preventDefault();
          e.stopImmediatePropagation();
          handleUndo();
          return;
        }

        // Redo: Ctrl/Cmd+Shift+Z — stop propagation to prevent editor redo
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") {
          e.preventDefault();
          e.stopImmediatePropagation();
          handleRedo();
          return;
        }

        // Brush size: [ decrease, ] increase
        if (e.key === "[" && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setPencilSettings((prev) => ({
            ...prev,
            size: Math.max(1, prev.size - (prev.size > 20 ? 5 : 2)),
          }));
          return;
        }
        if (e.key === "]" && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setPencilSettings((prev) => ({
            ...prev,
            size: Math.min(200, prev.size + (prev.size > 20 ? 5 : 2)),
          }));
          return;
        }
      }

      window.addEventListener("keydown", onKeyDown, { capture: true });
      return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
    }, [handleSetTool, handleUndo, handleRedo]);

    // ─── Render ─────────────────────────────────────────────────

    return (
      <>
        {/* Canvas container */}
        <div className="absolute inset-0" style={{ zIndex: 200 }}>
          <canvas
            ref={displayCanvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
            style={{ zIndex: 201 }}
          />
        </div>

        {/* All UI portaled to document.body */}
        {mounted &&
          createPortal(
            <div data-drawing-ui>
              <PencilToolbar
                color={pencilSettings.color}
                size={pencilSettings.size}
                opacity={Math.round(pencilSettings.opacity * 100)}
                pressureGamma={pencilSettings.pressureGamma}
                texture={Math.round(pencilSettings.texture * 100)}
                smoothing={Math.round(pencilSettings.smoothing * 100)}
                tiltShading={pencilSettings.tiltShading}
                isEraser={activeTool === "eraser"}
                activeTool={activeTool}
                canUndo={canUndoDraw}
                canRedo={canRedoDraw}
                shapeType={shapeType}
                shapeFilled={shapeFilled}
                onShapeTypeChange={(t) => setShapeType(t as ShapeType)}
                onShapeFilledChange={setShapeFilled}
                shapeState={shapeStateRef.current}
                onColorChange={(c) => updatePencilSetting("color", c)}
                onSizeChange={(s) => updatePencilSetting("size", s)}
                onOpacityChange={(o) => updatePencilSetting("opacity", clamp(o / 100, 0, 1))}
                onPressureGammaChange={(g) => updatePencilSetting("pressureGamma", g)}
                onTextureChange={(t) => updatePencilSetting("texture", clamp(t / 100, 0, 1))}
                onSmoothingChange={(s) => updatePencilSetting("smoothing", clamp(s / 100, 0, 1))}
                onTiltShadingChange={(t) => updatePencilSetting("tiltShading", t)}
                onToolChange={handleSetTool}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onClear={handleClear}
                onDone={handleDone}
                onCancel={onCancel}
                showLayerPanel={showLayerPanel}
                onToggleLayerPanel={() => setShowLayerPanel(!showLayerPanel)}
              />

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
);
