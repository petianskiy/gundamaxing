"use client";

import { useRef, useState, useCallback, useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BRUSH_PRESETS, getBrushPreset } from "./brushes";
import type { BrushPreset, StrokePoint } from "./engine/brush-types";
import {
  beginStroke,
  strokeTo,
  endStroke,
  type StrokeState,
} from "./engine/brush-engine";
import { LayerManager, type BlendMode } from "./engine/layer-manager";
import { Compositor } from "./engine/compositor";
import { UndoManager } from "./engine/undo-manager";
import { LayerPanel } from "./ui/layer-panel";
import { BrushSettingsPanel } from "./ui/brush-settings-panel";

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

// ─── Max layers ─────────────────────────────────────────────────
const MAX_LAYERS = 12;

export function DrawingOverlay({
  canvasWidth,
  canvasHeight,
  onComplete,
  onCancel,
}: DrawingOverlayProps) {
  // Display canvas — shows the composited result of all layers
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Core systems (refs to survive re-renders)
  const layerManagerRef = useRef<LayerManager | null>(null);
  const compositorRef = useRef<Compositor | null>(null);
  const undoManagerRef = useRef<UndoManager | null>(null);

  const [activeBrushId, setActiveBrushId] = useState("pen");
  const [brushColor, setBrushColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(8);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [showBrushPicker, setShowBrushPicker] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const isDrawingRef = useRef(false);
  const strokeStateRef = useRef<StrokeState | null>(null);
  const pendingUndoActionRef = useRef<ReturnType<UndoManager["recordStrokeBefore"]> | null>(null);

  // Layer state (mirrored from LayerManager for React rendering)
  const [layerState, setLayerState] = useState<{
    layers: LayerManager["layers"];
    activeLayerId: string;
  }>({ layers: [], activeLayerId: "" });

  // Undo/redo state
  const [canUndoDraw, setCanUndoDraw] = useState(false);
  const [canRedoDraw, setCanRedoDraw] = useState(false);

  /** Sync React state from LayerManager + UndoManager */
  const syncState = useCallback(() => {
    const lm = layerManagerRef.current;
    const um = undoManagerRef.current;
    if (lm) {
      setLayerState({
        layers: [...lm.layers],
        activeLayerId: lm.activeLayerId,
      });
    }
    if (um) {
      setCanUndoDraw(um.canUndo);
      setCanRedoDraw(um.canRedo);
    }
  }, []);

  /** Recomposite and sync */
  const recomposite = useCallback(() => {
    const c = compositorRef.current;
    const lm = layerManagerRef.current;
    if (c && lm) {
      c.markDirty();
      c.composite(lm.layers);
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
    const um = new UndoManager(lm);

    layerManagerRef.current = lm;
    compositorRef.current = comp;
    undoManagerRef.current = um;

    // Initial composite (blank)
    comp.composite(lm.layers);
    syncState();
  }, [canvasWidth, canvasHeight, syncState]);

  // ─── Canvas coordinate conversion ────────────────────────────

  const getStrokePoint = useCallback(
    (e: PointerEvent): StrokePoint => {
      const canvas = displayCanvasRef.current;
      if (!canvas) return { x: 0, y: 0, pressure: 0.5, timestamp: Date.now() };
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * canvas.width,
        y: ((e.clientY - rect.top) / rect.height) * canvas.height,
        pressure: e.pressure || 0.5,
        tilt: e.tiltX !== undefined ? { x: e.tiltX, y: e.tiltY } : undefined,
        timestamp: Date.now(),
      };
    },
    []
  );

  // ─── Pointer event handlers ──────────────────────────────────

  useEffect(() => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return;

    function onPointerDown(e: PointerEvent) {
      e.preventDefault();
      e.stopPropagation();
      canvas!.setPointerCapture(e.pointerId);

      const lm = layerManagerRef.current;
      const um = undoManagerRef.current;
      if (!lm || !um) return;

      const activeLayer = lm.getActiveLayer();
      if (!activeLayer || activeLayer.locked || !activeLayer.visible) return;

      const ctx = activeLayer.canvas.getContext("2d");
      if (!ctx) return;

      isDrawingRef.current = true;

      // Record undo checkpoint BEFORE drawing
      pendingUndoActionRef.current = um.recordStrokeBefore(activeLayer.id);

      const point = getStrokePoint(e);
      const preset = getBrushPreset(activeBrushId) ?? BRUSH_PRESETS[0];

      // Begin stroke on the active layer's canvas
      strokeStateRef.current = beginStroke(
        preset,
        brushColor,
        brushSize,
        brushOpacity,
        point,
        ctx
      );

      // Immediately composite to show the first dab
      const comp = compositorRef.current;
      if (comp) {
        comp.composite(lm.layers, strokeStateRef.current.dirtyRect);
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDrawingRef.current || !strokeStateRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      const lm = layerManagerRef.current;
      if (!lm) return;

      const activeLayer = lm.getActiveLayer();
      if (!activeLayer) return;

      const ctx = activeLayer.canvas.getContext("2d");
      if (!ctx) return;

      const point = getStrokePoint(e);
      const dirtyRect = strokeTo(strokeStateRef.current, point, ctx);

      // Partial composite for performance
      const comp = compositorRef.current;
      if (comp) {
        comp.composite(lm.layers, dirtyRect);
      }
    }

    function onPointerUp(e: PointerEvent) {
      e.preventDefault();
      e.stopPropagation();
      if (isDrawingRef.current && strokeStateRef.current) {
        endStroke(strokeStateRef.current);
        strokeStateRef.current = null;
        isDrawingRef.current = false;

        // Commit the undo action
        const um = undoManagerRef.current;
        if (um && pendingUndoActionRef.current) {
          um.commitStroke(pendingUndoActionRef.current);
          pendingUndoActionRef.current = null;
        }

        // Full recomposite and sync state
        const comp = compositorRef.current;
        const lm = layerManagerRef.current;
        if (comp && lm) {
          comp.markDirty();
          comp.composite(lm.layers);
        }
        syncState();
      }
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
  }, [getStrokePoint, activeBrushId, brushColor, brushSize, brushOpacity, syncState]);

  // ─── Layer operations (callbacks for LayerPanel) ────────────

  const handleAddLayer = useCallback(() => {
    const lm = layerManagerRef.current;
    const um = undoManagerRef.current;
    if (!lm || !um) return;
    if (lm.layers.length >= MAX_LAYERS) return;
    const newLayer = lm.addLayer();
    um.recordAddLayer(newLayer.id);
    recomposite();
    syncState();
  }, [recomposite, syncState]);

  const handleDeleteLayer = useCallback((id: string) => {
    const lm = layerManagerRef.current;
    const um = undoManagerRef.current;
    if (!lm || !um) return;
    const layer = lm.layers.find((l) => l.id === id);
    if (!layer) return;
    const data = lm.getLayerSnapshot(id);
    const idx = lm.layers.findIndex((l) => l.id === id);
    if (!data) return;
    um.recordDeleteLayer(
      { id: layer.id, name: layer.name, visible: layer.visible, opacity: layer.opacity, blendMode: layer.blendMode },
      data,
      idx
    );
    lm.deleteLayer(id);
    recomposite();
    syncState();
  }, [recomposite, syncState]);

  const handleDuplicateLayer = useCallback((id: string) => {
    const lm = layerManagerRef.current;
    const um = undoManagerRef.current;
    if (!lm || !um) return;
    if (lm.layers.length >= MAX_LAYERS) return;
    const dup = lm.duplicateLayer(id);
    if (dup) {
      um.recordAddLayer(dup.id);
      recomposite();
      syncState();
    }
  }, [recomposite, syncState]);

  const handleMergeDown = useCallback((id: string) => {
    const lm = layerManagerRef.current;
    const um = undoManagerRef.current;
    if (!lm || !um) return;
    const idx = lm.layers.findIndex((l) => l.id === id);
    if (idx <= 0) return;
    const upper = lm.layers[idx];
    const lower = lm.layers[idx - 1];
    const upperData = lm.getLayerSnapshot(upper.id);
    const lowerData = lm.getLayerSnapshot(lower.id);
    if (!upperData || !lowerData) return;
    um.recordMergeLayers(
      { id: upper.id, name: upper.name, visible: upper.visible, opacity: upper.opacity, blendMode: upper.blendMode },
      upperData,
      idx,
      lower.id,
      lowerData
    );
    lm.mergeDown(id);
    recomposite();
    syncState();
  }, [recomposite, syncState]);

  const handleMoveLayer = useCallback((id: string, direction: "up" | "down") => {
    const lm = layerManagerRef.current;
    if (!lm) return;
    lm.moveLayer(id, direction);
    recomposite();
    syncState();
  }, [recomposite, syncState]);

  const handleSelectLayer = useCallback((id: string) => {
    const lm = layerManagerRef.current;
    if (!lm) return;
    lm.setActiveLayer(id);
    syncState();
  }, [syncState]);

  const handleToggleVisibility = useCallback((id: string) => {
    const lm = layerManagerRef.current;
    if (!lm) return;
    lm.toggleVisibility(id);
    recomposite();
    syncState();
  }, [recomposite, syncState]);

  const handleToggleLock = useCallback((id: string) => {
    const lm = layerManagerRef.current;
    if (!lm) return;
    lm.toggleLock(id);
    syncState();
  }, [syncState]);

  const handleSetOpacity = useCallback((id: string, opacity: number) => {
    const lm = layerManagerRef.current;
    if (!lm) return;
    lm.setOpacity(id, opacity);
    recomposite();
    syncState();
  }, [recomposite, syncState]);

  const handleSetBlendMode = useCallback((id: string, mode: BlendMode) => {
    const lm = layerManagerRef.current;
    if (!lm) return;
    lm.setBlendMode(id, mode);
    recomposite();
    syncState();
  }, [recomposite, syncState]);

  const handleRenameLayer = useCallback((id: string, name: string) => {
    const lm = layerManagerRef.current;
    if (!lm) return;
    lm.renameLayer(id, name);
    syncState();
  }, [syncState]);

  // ─── Undo / Redo / Clear / Done ──────────────────────────────

  const handleUndo = useCallback(() => {
    const um = undoManagerRef.current;
    if (!um) return;
    um.undo();
    recomposite();
    syncState();
  }, [recomposite, syncState]);

  const handleRedo = useCallback(() => {
    const um = undoManagerRef.current;
    if (!um) return;
    um.redo();
    recomposite();
    syncState();
  }, [recomposite, syncState]);

  const handleClear = useCallback(() => {
    const lm = layerManagerRef.current;
    const um = undoManagerRef.current;
    if (!lm || !um) return;
    const activeLayer = lm.getActiveLayer();
    if (!activeLayer) return;
    um.recordClearLayer(activeLayer.id);
    lm.clearLayer(activeLayer.id);
    recomposite();
    syncState();
  }, [recomposite, syncState]);

  const handleDone = useCallback(() => {
    const lm = layerManagerRef.current;
    const comp = compositorRef.current;
    if (!lm || !comp) return;

    // Flatten all layers
    const flatCanvas = comp.flatten(lm.layers);
    const ctx = flatCanvas.getContext("2d");
    if (!ctx) return;

    // Find bounding box of drawn content
    const imageData = ctx.getImageData(0, 0, flatCanvas.width, flatCanvas.height);
    const { data, width, height } = imageData;
    let minX = width, minY = height, maxX = 0, maxY = 0;
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

    const pad = Math.max(4, Math.round(Math.max(maxX - minX, maxY - minY) * 0.02));
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

    croppedCtx.drawImage(flatCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

    const bounds = {
      x: (minX / width) * 100,
      y: (minY / height) * 100,
      width: (cropW / width) * 100,
      height: (cropH / height) * 100,
    };

    croppedCanvas.toBlob(
      (blob) => { if (blob) onComplete(blob, bounds); },
      "image/png",
      1
    );
  }, [onComplete, onCancel]);

  // Stop events from reaching the parent editor
  const stopPropagation = useCallback((e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  const activePreset = getBrushPreset(activeBrushId) ?? BRUSH_PRESETS[0];
  const ActiveIcon = getBrushIcon(activePreset);

  return (
    <div
      className="absolute inset-0 z-[200]"
      onPointerDown={stopPropagation}
      onPointerMove={stopPropagation}
      onPointerUp={stopPropagation}
      onClick={stopPropagation}
    >
      {/* Display canvas — shows composited layers */}
      <canvas
        ref={displayCanvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        style={{ zIndex: 200 }}
      />

      {/* Toolbar — fixed to viewport */}
      <div
        className="fixed top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 shadow-2xl max-w-[calc(100vw-1rem)] overflow-x-auto"
        style={{ zIndex: 210, scrollbarWidth: "none" }}
      >
        {/* Active brush button — opens brush settings panel */}
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
            onClick={() => setBrushSize(Math.max(1, brushSize - (brushSize > 20 ? 5 : 2)))}
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
            onClick={() => setBrushSize(Math.min(200, brushSize + (brushSize > 20 ? 5 : 2)))}
            className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-bold"
          >
            <Plus className="h-3 w-3" />
          </button>
          <span className="text-[10px] text-zinc-400 w-6 text-center">{brushSize}</span>
        </div>

        {/* Opacity control */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <span className="text-[9px] text-zinc-500 w-5">Op</span>
          <input
            type="range"
            min={5}
            max={100}
            value={Math.round(brushOpacity * 100)}
            onChange={(e) => setBrushOpacity(parseInt(e.target.value) / 100)}
            className="w-12 sm:w-16 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
          />
          <span className="text-[10px] text-zinc-400 w-7 text-center">
            {Math.round(brushOpacity * 100)}%
          </span>
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

        {/* Actions */}
        <button
          onClick={handleClear}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors flex-shrink-0"
          title="Clear active layer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
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
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex-shrink-0"
          title="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
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
            if (p?.isEraser && brushOpacity < 1) {
              setBrushOpacity(1);
            }
          }}
          brushSize={brushSize}
          onSetSize={setBrushSize}
          brushOpacity={brushOpacity}
          onSetOpacity={setBrushOpacity}
          onClose={() => setShowBrushPicker(false)}
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
    </div>
  );
}
