"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  Pen,
  Highlighter,
  Droplets,
  SprayCan,
  Eraser,
  X,
  Check,
  Trash2,
  Undo2,
  Redo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BRUSHES, type BrushPoint } from "./brushes";

const BRUSH_ICONS: Record<string, React.ElementType> = {
  pen: Pen,
  marker: Highlighter,
  watercolor: Droplets,
  spray: SprayCan,
  eraser: Eraser,
};

interface DrawingOverlayProps {
  canvasWidth: number;
  canvasHeight: number;
  onComplete: (blob: Blob) => void;
  onCancel: () => void;
}

export function DrawingOverlay({
  canvasWidth,
  canvasHeight,
  onComplete,
  onCancel,
}: DrawingOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeBrush, setActiveBrush] = useState("pen");
  const [brushColor, setBrushColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(4);
  const isDrawingRef = useRef(false);
  const pointsRef = useRef<BrushPoint[]>([]);

  // Undo/redo history: array of canvas snapshots (ImageData)
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef(-1);
  const [canUndoDraw, setCanUndoDraw] = useState(false);
  const [canRedoDraw, setCanRedoDraw] = useState(false);

  const updateUndoRedoState = useCallback(() => {
    setCanUndoDraw(historyIndexRef.current > 0);
    setCanRedoDraw(
      historyIndexRef.current < historyRef.current.length - 1
    );
  }, []);

  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Discard any redo history beyond the current index
    historyRef.current = historyRef.current.slice(
      0,
      historyIndexRef.current + 1
    );

    historyRef.current.push(snapshot);
    historyIndexRef.current = historyRef.current.length - 1;
    updateUndoRedoState();
  }, [updateUndoRedoState]);

  // Set canvas resolution and save initial blank canvas as first history entry
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Save the initial blank canvas as the first history entry
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current = [snapshot];
      historyIndexRef.current = 0;
      updateUndoRedoState();
    }
  }, [canvasWidth, canvasHeight, updateUndoRedoState]);

  const getCanvasCoords = useCallback(
    (e: PointerEvent) => {
      const canvas = canvasRef.current;
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

  const getBrush = useCallback(() => {
    return BRUSHES.find((b) => b.id === activeBrush) ?? BRUSHES[0];
  }, [activeBrush]);

  // Use native event listeners on the canvas to avoid React's synthetic event issues
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function onPointerDown(e: PointerEvent) {
      e.preventDefault();
      e.stopPropagation();
      canvas!.setPointerCapture(e.pointerId);
      isDrawingRef.current = true;
      const coords = getCanvasCoords(e);
      pointsRef.current = [coords];
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      const ctx = canvas!.getContext("2d");
      if (!ctx) return;

      const coords = getCanvasCoords(e);
      pointsRef.current.push(coords);

      const brush = getBrush();
      const pts = pointsRef.current;
      if (pts.length >= 2) {
        const segment = pts.slice(-3);
        brush.draw(ctx, segment, brushColor, brushSize);
      }
    }

    function onPointerUp(e: PointerEvent) {
      e.preventDefault();
      e.stopPropagation();
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        pointsRef.current = [];
        // Save snapshot after completing a stroke
        saveSnapshot();
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
  }, [getCanvasCoords, getBrush, brushColor, brushSize, saveSnapshot]);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    historyIndexRef.current -= 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    ctx.putImageData(snapshot, 0, 0);
    updateUndoRedoState();
  }, [updateUndoRedoState]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    historyIndexRef.current += 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    ctx.putImageData(snapshot, 0, 0);
    updateUndoRedoState();
  }, [updateUndoRedoState]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveSnapshot();
  }, [saveSnapshot]);

  const handleDone = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // If nothing was drawn (still at initial blank state), just cancel
    if (historyIndexRef.current === 0) {
      onCancel();
      return;
    }
    canvas.toBlob(
      (blob) => {
        if (blob) onComplete(blob);
      },
      "image/png",
      1
    );
  }, [onComplete, onCancel]);

  // Stop all events from reaching the parent editor
  const stopPropagation = useCallback((e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      className="absolute inset-0 z-[200]"
      onPointerDown={stopPropagation}
      onPointerMove={stopPropagation}
      onPointerUp={stopPropagation}
      onClick={stopPropagation}
    >
      {/* Drawing canvas — rendered BELOW toolbar */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        style={{ zIndex: 200 }}
      />

      {/* Toolbar — rendered ABOVE canvas */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 shadow-2xl"
        style={{ zIndex: 210 }}
      >
        {/* Brush selector */}
        {BRUSHES.map((brush) => {
          const Icon = BRUSH_ICONS[brush.id] ?? Pen;
          return (
            <button
              key={brush.id}
              onClick={() => setActiveBrush(brush.id)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                activeBrush === brush.id
                  ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              )}
              title={brush.name}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}

        <div className="w-px h-6 bg-zinc-700" />

        {/* Color picker */}
        <input
          type="color"
          value={brushColor}
          onChange={(e) => setBrushColor(e.target.value)}
          className="w-8 h-8 rounded-lg cursor-pointer border border-zinc-700"
        />

        {/* Size display */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setBrushSize(Math.max(1, brushSize - 2))}
            className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-bold"
          >
            -
          </button>
          <span className="text-xs text-zinc-300 w-6 text-center">{brushSize}</span>
          <button
            onClick={() => setBrushSize(Math.min(40, brushSize + 2))}
            className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-bold"
          >
            +
          </button>
        </div>

        <div className="w-px h-6 bg-zinc-700" />

        {/* Actions */}
        <button
          onClick={handleClear}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
          title="Clear canvas"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          onClick={handleUndo}
          disabled={!canUndoDraw}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
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
            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
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
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
        <button
          onClick={handleDone}
          className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-400 transition-colors flex items-center gap-1.5"
        >
          <Check className="h-3.5 w-3.5" />
          Done
        </button>
      </div>
    </div>
  );
}
