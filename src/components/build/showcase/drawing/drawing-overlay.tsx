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
import type { BrushPreset } from "./engine/brush-types";
import { LayerManager, type BlendMode } from "./engine/layer-manager";
import { Compositor } from "./engine/compositor";
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

// ─── Simple stroke tracking ─────────────────────────────────────

interface StrokeInfo {
  lastX: number;
  lastY: number;
  /** For smooth quadratic curves */
  midX: number;
  midY: number;
  pointCount: number;
}

// ─── Max layers ─────────────────────────────────────────────────
const MAX_LAYERS = 12;

// ─── Undo snapshot ──────────────────────────────────────────────

interface UndoSnapshot {
  layerId: string;
  imageData: ImageData;
}

export function DrawingOverlay({
  canvasWidth,
  canvasHeight,
  onComplete,
  onCancel,
}: DrawingOverlayProps) {
  // Display canvas — shows the composited result of all layers
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Core systems
  const layerManagerRef = useRef<LayerManager | null>(null);
  const compositorRef = useRef<Compositor | null>(null);

  // Undo/redo stacks (simple ImageData snapshots)
  const undoStackRef = useRef<UndoSnapshot[]>([]);
  const redoStackRef = useRef<UndoSnapshot[]>([]);

  const [activeBrushId, setActiveBrushId] = useState("pencil-hb");
  const [brushColor, setBrushColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(8);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [showBrushPicker, setShowBrushPicker] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);

  // Drawing state
  const isDrawingRef = useRef(false);
  const strokeInfoRef = useRef<StrokeInfo | null>(null);
  const pendingUndoRef = useRef<UndoSnapshot | null>(null);

  // Layer state (mirrored from LayerManager for React rendering)
  const [layerState, setLayerState] = useState<{
    layers: LayerManager["layers"];
    activeLayerId: string;
  }>({ layers: [], activeLayerId: "" });

  const [canUndoDraw, setCanUndoDraw] = useState(false);
  const [canRedoDraw, setCanRedoDraw] = useState(false);

  /** Sync React state from refs */
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

  /** Recomposite all layers to display canvas */
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

    layerManagerRef.current = lm;
    compositorRef.current = comp;
    undoStackRef.current = [];
    redoStackRef.current = [];

    comp.composite(lm.layers);
    syncState();
  }, [canvasWidth, canvasHeight, syncState]);

  // ─── Canvas coordinate conversion ────────────────────────────

  const getCanvasPoint = useCallback(
    (e: PointerEvent): { x: number; y: number; pressure: number } => {
      const canvas = displayCanvasRef.current;
      if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * canvas.width,
        y: ((e.clientY - rect.top) / rect.height) * canvas.height,
        pressure: e.pressure || 0.5,
      };
    },
    []
  );

  // ─── Simple direct Canvas2D drawing ───────────────────────────
  // This is fast and proven — no stamp engine, no interpolation overhead.

  useEffect(() => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return;

    function onPointerDown(e: PointerEvent) {
      // Only respond to primary button / touch
      if (e.button !== 0 && e.pointerType === "mouse") return;
      e.preventDefault();

      try { canvas!.setPointerCapture(e.pointerId); } catch {}

      const lm = layerManagerRef.current;
      if (!lm) return;

      const activeLayer = lm.getActiveLayer();
      if (!activeLayer || activeLayer.locked || !activeLayer.visible) return;

      const ctx = activeLayer.canvas.getContext("2d");
      if (!ctx) return;

      isDrawingRef.current = true;

      // Save undo snapshot BEFORE drawing
      try {
        const data = ctx.getImageData(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
        pendingUndoRef.current = { layerId: activeLayer.id, imageData: data };
      } catch {
        pendingUndoRef.current = null;
      }

      const { x, y, pressure } = getCanvasPoint(e);
      const preset = getBrushPreset(activeBrushId) ?? BRUSH_PRESETS[0];
      const isEraser = preset.isEraser;

      // Configure context for this stroke
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = brushSize * (0.5 + pressure * 0.5);
      ctx.globalAlpha = brushOpacity;

      if (isEraser) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = brushColor;
      }

      // Draw initial dot
      ctx.beginPath();
      ctx.arc(x, y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = isEraser ? "rgba(0,0,0,1)" : brushColor;
      ctx.fill();
      ctx.restore();

      strokeInfoRef.current = { lastX: x, lastY: y, midX: x, midY: y, pointCount: 1 };

      // Show immediately
      recomposite();
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDrawingRef.current || !strokeInfoRef.current) return;
      e.preventDefault();

      const lm = layerManagerRef.current;
      if (!lm) return;

      const activeLayer = lm.getActiveLayer();
      if (!activeLayer) return;

      const ctx = activeLayer.canvas.getContext("2d");
      if (!ctx) return;

      const { x, y, pressure } = getCanvasPoint(e);
      const stroke = strokeInfoRef.current;
      const preset = getBrushPreset(activeBrushId) ?? BRUSH_PRESETS[0];
      const isEraser = preset.isEraser;

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = brushSize * (0.5 + pressure * 0.5);
      ctx.globalAlpha = brushOpacity;

      if (isEraser) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = brushColor;
      }

      ctx.beginPath();

      if (stroke.pointCount < 3) {
        // For the first few points, use simple lineTo
        ctx.moveTo(stroke.lastX, stroke.lastY);
        ctx.lineTo(x, y);
      } else {
        // Use quadratic curve through midpoints for smooth strokes
        const midX = (stroke.lastX + x) / 2;
        const midY = (stroke.lastY + y) / 2;
        ctx.moveTo(stroke.midX, stroke.midY);
        ctx.quadraticCurveTo(stroke.lastX, stroke.lastY, midX, midY);
        stroke.midX = midX;
        stroke.midY = midY;
      }

      ctx.stroke();
      ctx.restore();

      stroke.lastX = x;
      stroke.lastY = y;
      stroke.pointCount++;

      // Composite to display
      recomposite();
    }

    function onPointerUp(e: PointerEvent) {
      if (!isDrawingRef.current) return;
      e.preventDefault();

      isDrawingRef.current = false;
      strokeInfoRef.current = null;

      // Push undo snapshot
      if (pendingUndoRef.current) {
        undoStackRef.current.push(pendingUndoRef.current);
        // Limit undo stack to 30 entries
        if (undoStackRef.current.length > 30) undoStackRef.current.shift();
        redoStackRef.current = []; // Clear redo on new action
        pendingUndoRef.current = null;
      }

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
  }, [getCanvasPoint, activeBrushId, brushColor, brushSize, brushOpacity, syncState, recomposite]);

  // ─── Layer operations ─────────────────────────────────────────

  const handleAddLayer = useCallback(() => {
    const lm = layerManagerRef.current;
    if (!lm) return;
    if (lm.layers.length >= MAX_LAYERS) return;
    lm.addLayer();
    recomposite();
    syncState();
  }, [recomposite, syncState]);

  const handleDeleteLayer = useCallback((id: string) => {
    const lm = layerManagerRef.current;
    if (!lm) return;
    lm.deleteLayer(id);
    recomposite();
    syncState();
  }, [recomposite, syncState]);

  const handleDuplicateLayer = useCallback((id: string) => {
    const lm = layerManagerRef.current;
    if (!lm || lm.layers.length >= MAX_LAYERS) return;
    lm.duplicateLayer(id);
    recomposite();
    syncState();
  }, [recomposite, syncState]);

  const handleMergeDown = useCallback((id: string) => {
    const lm = layerManagerRef.current;
    if (!lm) return;
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
    const lm = layerManagerRef.current;
    if (!lm) return;
    const snapshot = undoStackRef.current.pop();
    if (!snapshot) return;

    // Save current state for redo
    const layer = lm.layers.find((l) => l.id === snapshot.layerId);
    if (layer) {
      const ctx = layer.canvas.getContext("2d");
      if (ctx) {
        const current = ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
        redoStackRef.current.push({ layerId: snapshot.layerId, imageData: current });
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
        const current = ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
        undoStackRef.current.push({ layerId: snapshot.layerId, imageData: current });
        ctx.putImageData(snapshot.imageData, 0, 0);
      }
    }

    recomposite();
    syncState();
  }, [recomposite, syncState]);

  const handleClear = useCallback(() => {
    const lm = layerManagerRef.current;
    if (!lm) return;
    const activeLayer = lm.getActiveLayer();
    if (!activeLayer) return;

    // Save undo
    const ctx = activeLayer.canvas.getContext("2d");
    if (ctx) {
      try {
        const data = ctx.getImageData(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
        undoStackRef.current.push({ layerId: activeLayer.id, imageData: data });
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

  const activePreset = getBrushPreset(activeBrushId) ?? BRUSH_PRESETS[0];
  const ActiveIcon = getBrushIcon(activePreset);

  return (
    <div className="absolute inset-0" style={{ zIndex: 200 }}>
      {/* Display canvas — shows composited layers */}
      <canvas
        ref={displayCanvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        style={{ zIndex: 201 }}
      />

      {/* Toolbar — fixed to viewport, high z-index to always be above canvas */}
      <div
        className="fixed top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 shadow-2xl max-w-[calc(100vw-1rem)] overflow-x-auto"
        style={{ zIndex: 9999, scrollbarWidth: "none" }}
      >
        {/* Active brush button */}
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
