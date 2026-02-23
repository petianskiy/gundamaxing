"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, Eraser, Paintbrush, Minus, Plus, Check, Loader2, RotateCcw } from "lucide-react";

interface BgRefineModalProps {
  resultUrl: string;   // BG-removed image
  originalUrl: string; // Original image (for restore brush)
  onComplete: (blob: Blob) => Promise<void>;
  onClose: () => void;
}

type BrushMode = "erase" | "restore";

export function BgRefineModal({ resultUrl, originalUrl, onComplete, onClose }: BgRefineModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultImgRef = useRef<HTMLImageElement | null>(null);
  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const [brushMode, setBrushMode] = useState<BrushMode>("erase");
  const [brushSize, setBrushSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Load both images and draw the result on the canvas
  useEffect(() => {
    const resultImg = new window.Image();
    resultImg.crossOrigin = "anonymous";
    const originalImg = new window.Image();
    originalImg.crossOrigin = "anonymous";

    let loaded = 0;
    const onLoad = () => {
      loaded++;
      if (loaded < 2) return;

      resultImgRef.current = resultImg;
      originalImgRef.current = originalImg;

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = resultImg.naturalWidth;
      canvas.height = resultImg.naturalHeight;

      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(resultImg, 0, 0);

      setIsLoading(false);
    };

    resultImg.onload = onLoad;
    originalImg.onload = onLoad;
    resultImg.onerror = () => { setIsLoading(false); };
    originalImg.onerror = () => { setIsLoading(false); };
    resultImg.src = resultUrl;
    originalImg.src = originalUrl;
  }, [resultUrl, originalUrl]);

  const getCanvasCoords = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const drawBrush = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    // Scale brush size relative to canvas resolution
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const scaledBrush = brushSize * scale;

    if (brushMode === "erase") {
      // Erase: make pixels transparent
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, scaledBrush / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Restore: paint pixels from original image
      const original = originalImgRef.current;
      if (!original) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, scaledBrush / 2, 0, Math.PI * 2);
      ctx.clip();
      // Draw the original image clipped to the brush circle
      ctx.drawImage(original, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }, [brushMode, brushSize]);

  const drawLine = useCallback((from: { x: number; y: number }, to: { x: number; y: number }) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(1, Math.ceil(dist / 2));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      drawBrush(from.x + dx * t, from.y + dy * t);
    }
  }, [drawBrush]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const pos = getCanvasCoords(e);
    if (!pos) return;
    isDrawingRef.current = true;
    lastPosRef.current = pos;
    drawBrush(pos.x, pos.y);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [getCanvasCoords, drawBrush]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const pos = getCanvasCoords(e);
    if (!pos) return;

    // Update cursor position for custom cursor
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    if (!isDrawingRef.current || !lastPosRef.current) return;
    drawLine(lastPosRef.current, pos);
    lastPosRef.current = pos;
  }, [getCanvasCoords, drawLine]);

  const handlePointerUp = useCallback(() => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  }, []);

  const handleReset = useCallback(() => {
    const canvas = canvasRef.current;
    const resultImg = resultImgRef.current;
    if (!canvas || !resultImg) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(resultImg, 0, 0);
  }, []);

  const handleSave = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsSaving(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Failed to export"));
        }, "image/png");
      });
      await onComplete(blob);
    } finally {
      setIsSaving(false);
    }
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl mx-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 shrink-0">
          <h3 className="text-sm font-semibold text-white">Refine Background Removal</h3>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-800 shrink-0">
          {/* Brush mode */}
          <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
            <button
              onClick={() => setBrushMode("erase")}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium transition-colors ${
                brushMode === "erase"
                  ? "bg-red-500/20 text-red-400 border-r border-zinc-700"
                  : "text-zinc-400 hover:text-white border-r border-zinc-700"
              }`}
            >
              <Eraser className="h-3 w-3" />
              Erase
            </button>
            <button
              onClick={() => setBrushMode("restore")}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium transition-colors ${
                brushMode === "restore"
                  ? "bg-green-500/20 text-green-400"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Paintbrush className="h-3 w-3" />
              Restore
            </button>
          </div>

          {/* Brush size */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setBrushSize((s) => Math.max(4, s - 4))}
              className="p-1 text-zinc-400 hover:text-white transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <input
              type="range"
              min={4}
              max={80}
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-20 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
            <button
              onClick={() => setBrushSize((s) => Math.min(80, s + 4))}
              className="p-1 text-zinc-400 hover:text-white transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
            <span className="text-[10px] text-zinc-500 w-6 text-center tabular-nums">{brushSize}</span>
          </div>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-zinc-400 hover:text-white transition-colors ml-auto"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
              <span className="text-xs text-zinc-400">Loading images...</span>
            </div>
          ) : (
            <div
              className="relative inline-block"
              style={{ cursor: "none" }}
            >
              {/* Checkerboard background to show transparency */}
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  backgroundImage: "linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1a 75%), linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)",
                  backgroundSize: "16px 16px",
                  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                }}
              />
              <canvas
                ref={canvasRef}
                className="relative max-h-[55vh] max-w-full rounded-lg"
                style={{ imageRendering: "auto" }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={() => { handlePointerUp(); setCursorPos(null); }}
              />
              {/* Custom cursor */}
              {cursorPos && (
                <div
                  className="pointer-events-none absolute rounded-full border-2"
                  style={{
                    width: brushSize,
                    height: brushSize,
                    left: cursorPos.x - brushSize / 2,
                    top: cursorPos.y - brushSize / 2,
                    borderColor: brushMode === "erase" ? "rgba(239,68,68,0.7)" : "rgba(34,197,94,0.7)",
                    backgroundColor: brushMode === "erase" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Hint */}
        <div className="px-4 py-1.5 text-center shrink-0">
          <p className="text-[10px] text-zinc-500">
            {brushMode === "erase"
              ? "Paint over remaining background to remove it"
              : "Paint over incorrectly removed areas to restore them"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-zinc-700 shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-500 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-3 w-3" />
                Apply Refinement
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
