"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Eraser, Paintbrush, Minus, Plus, Check, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRemoveBackground, stageLabel } from "../hooks/use-remove-background";

interface BgRefineModalProps {
  imageUrl: string; // Original image URL
  onComplete: (blob: Blob) => Promise<void>;
  onClose: () => void;
}

type Phase = "processing" | "refining";
type BrushMode = "erase" | "restore";

/** Load an image via fetch → blob URL (avoids CORS issues with crossOrigin) */
async function loadImageBlob(url: string): Promise<HTMLImageElement> {
  const res = await fetch(url);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = blobUrl;
  });
}

export function BgRefineModal({ imageUrl, onComplete, onClose }: BgRefineModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultImgRef = useRef<HTMLImageElement | null>(null);
  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const [phase, setPhase] = useState<Phase>("processing");
  const [brushMode, setBrushMode] = useState<BrushMode>("erase");
  const [brushSize, setBrushSize] = useState(20);
  const [isSaving, setIsSaving] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { removeBg, progress, stage } = useRemoveBackground();

  // Run background removal immediately on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Load original image as blob to avoid CORS
        const originalImg = await loadImageBlob(imageUrl);
        if (cancelled) return;
        originalImgRef.current = originalImg;

        // Run BG removal
        const resultBlob = await removeBg(imageUrl);
        if (cancelled) return;

        // Load result image from blob
        const resultBlobUrl = URL.createObjectURL(resultBlob);
        const resultImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = resultBlobUrl;
        });
        if (cancelled) return;
        resultImgRef.current = resultImg;

        // Draw result onto canvas
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = resultImg.naturalWidth;
          canvas.height = resultImg.naturalHeight;
          const ctx = canvas.getContext("2d")!;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(resultImg, 0, 0);
        }

        setPhase("refining");
      } catch {
        if (!cancelled) setError("Background removal failed. Please try again.");
      }
    })();

    return () => { cancelled = true; };
  }, [imageUrl, removeBg]);

  // ─── Canvas Drawing Logic ──────────────────────────────────────

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
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const scaledBrush = brushSize * scale;

    if (brushMode === "erase") {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, scaledBrush / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      const original = originalImgRef.current;
      if (!original) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, scaledBrush / 2, 0, Math.PI * 2);
      ctx.clip();
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

  // ─── Progress percentage ──────────────────────────────────────

  const pct = Math.round(progress * 100);
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={phase === "refining" ? onClose : undefined}
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gx-red" />
              <h3 className="text-sm font-semibold text-foreground">
                {phase === "processing" ? "Removing Background" : "Refine Result"}
              </h3>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* ─── Phase 1: Processing ─────────────────── */}
            {phase === "processing" && !error && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col items-center justify-center py-12 px-6 gap-6"
              >
                {/* Progress ring */}
                <div className="relative w-28 h-28">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 96 96">
                    <circle
                      cx="48" cy="48" r="42"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="text-border/30"
                    />
                    <circle
                      cx="48" cy="48" r="42"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="text-gx-red transition-all duration-500 ease-out"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground tabular-nums">
                    {pct}%
                  </span>
                </div>

                {/* Stage label */}
                <p className="text-sm font-medium text-muted-foreground">
                  {stageLabel(stage) || "Preparing..."}
                </p>

                {/* Mascot + message */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="flex items-end gap-4 max-w-md"
                >
                  {/* Speech bubble */}
                  <div className="rounded-xl border border-border/60 bg-background/80 backdrop-blur-md p-4 shadow-lg relative">
                    <div className="absolute -right-2 bottom-4 w-3 h-3 bg-background/80 border-r border-b border-border/60 rotate-[-45deg]" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Our AI is carefully removing the background for you.
                      This can take a moment on the first run while we load the model.
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1.5 italic">
                      Hang tight — it&apos;ll be worth the wait!
                    </p>
                  </div>

                  {/* Mascot sticker */}
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    className="flex-shrink-0 w-20 h-20 relative"
                  >
                    <Image
                      src="/tutorial/bg-removal-mascot.jpg"
                      alt="Mascot"
                      width={80}
                      height={80}
                      className="rounded-lg object-cover drop-shadow-lg"
                      priority
                      unoptimized
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {/* ─── Error State ─────────────────────────── */}
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center py-16 px-6 gap-4"
              >
                <p className="text-sm text-red-400">{error}</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-gx-red text-white text-sm font-semibold hover:bg-gx-red/90 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            )}

            {/* ─── Phase 2: Refining ──────────────────── */}
            {phase === "refining" && (
              <motion.div
                key="refining"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col flex-1 min-h-0"
              >
                {/* Toolbar */}
                <div className="flex items-center gap-3 px-4 py-2 border-b border-border/30 shrink-0">
                  {/* Brush mode toggle */}
                  <div className="flex rounded-lg border border-border/50 overflow-hidden">
                    <button
                      onClick={() => setBrushMode("erase")}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium transition-colors border-r border-border/50",
                        brushMode === "erase"
                          ? "bg-gx-red/15 text-gx-red"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Eraser className="h-3 w-3" />
                      Erase
                    </button>
                    <button
                      onClick={() => setBrushMode("restore")}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                        brushMode === "restore"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Paintbrush className="h-3 w-3" />
                      Restore
                    </button>
                  </div>

                  {/* Brush size */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setBrushSize((s) => Math.max(4, s - 4))}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="range"
                      min={4}
                      max={80}
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-20 h-1 bg-border rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
                    />
                    <button
                      onClick={() => setBrushSize((s) => Math.min(80, s + 4))}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <span className="text-[10px] text-muted-foreground w-6 text-center tabular-nums">{brushSize}</span>
                  </div>

                  {/* Reset */}
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors ml-auto"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                </div>

                {/* Canvas area */}
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-0">
                  <div className="relative inline-block" style={{ cursor: "none" }}>
                    {/* Checkerboard for transparency */}
                    <div
                      className="absolute inset-0 rounded-lg"
                      style={{
                        backgroundImage: "linear-gradient(45deg, hsl(var(--muted)/0.3) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)/0.3) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)/0.3) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)/0.3) 75%)",
                        backgroundSize: "16px 16px",
                        backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                      }}
                    />
                    <canvas
                      ref={canvasRef}
                      className="relative max-h-[50vh] max-w-full rounded-lg"
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
                          borderColor: brushMode === "erase" ? "rgba(220,38,38,0.7)" : "rgba(16,185,129,0.7)",
                          backgroundColor: brushMode === "erase" ? "rgba(220,38,38,0.1)" : "rgba(16,185,129,0.1)",
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Hint */}
                <div className="px-4 py-1.5 text-center shrink-0">
                  <p className="text-[10px] text-muted-foreground">
                    {brushMode === "erase"
                      ? "Paint over remaining background to erase it"
                      : "Paint over incorrectly removed areas to restore them"}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-border/40 shrink-0">
                  <button
                    onClick={onClose}
                    disabled={isSaving}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gx-red text-white text-xs font-semibold hover:bg-gx-red/90 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                        >
                          <Sparkles className="h-3 w-3" />
                        </motion.div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3" />
                        Apply
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
