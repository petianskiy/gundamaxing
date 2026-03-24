"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useCamera } from "@/hooks/use-camera";
import { Camera } from "lucide-react";
import type { ScanStatus } from "@/lib/types";

interface CameraViewProps {
  onCapture: (canvas: HTMLCanvasElement) => void;
  onStatusChange: (status: ScanStatus) => void;
  isActive: boolean;
}

/** Simple variance check — if the center zone has high pixel variance, a card is likely present */
function hasCardInZone(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number): boolean {
  const sampleSize = 80; // sample a small area for speed
  const sx = Math.max(0, cx - sampleSize / 2);
  const sy = Math.max(0, cy - sampleSize / 2);
  try {
    const data = ctx.getImageData(sx, sy, sampleSize, sampleSize).data;
    let sum = 0;
    let sumSq = 0;
    const n = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sum += lum;
      sumSq += lum * lum;
    }
    const mean = sum / n;
    const variance = sumSq / n - mean * mean;
    // Card present if variance is high (detailed image) and not too dark/bright
    return variance > 800 && mean > 30 && mean < 240;
  } catch {
    return false;
  }
}

/** Crop the canvas to the guide rectangle (center 70%, 3:4 aspect) */
function cropToGuide(source: HTMLCanvasElement): HTMLCanvasElement {
  const vw = source.width;
  const vh = source.height;

  // Guide is 70% width, centered, 3:4 aspect
  const guideW = vw * 0.7;
  const guideH = guideW * (4 / 3);
  const guideX = (vw - guideW) / 2;
  const guideY = (vh - guideH) / 2;

  const out = document.createElement("canvas");
  out.width = Math.round(guideW);
  out.height = Math.round(guideH);
  const ctx = out.getContext("2d")!;
  ctx.drawImage(source, guideX, guideY, guideW, guideH, 0, 0, out.width, out.height);
  return out;
}

export function CameraView({ onCapture, onStatusChange, isActive }: CameraViewProps) {
  const { videoRef, canvasRef, isActive: cameraOn, error, start, stop } = useCamera();
  const detectionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [feedback, setFeedback] = useState("Point camera at card");
  const [aim, setAim] = useState<"searching" | "detected" | "locked">("searching");
  const stableCountRef = useRef(0);
  const capturedRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    if (isActive && !cameraOn) {
      capturedRef.current = false;
      stableCountRef.current = 0;
      setAim("searching");
      start();
    } else if (!isActive && cameraOn) {
      stop();
    }
  }, [isActive, cameraOn, start, stop]);

  // Auto-aim detection loop
  const runDetection = useCallback(() => {
    if (!cameraOn || capturedRef.current) return;

    const video = videoRef.current;
    const dc = detectionCanvasRef.current;
    if (!video || !dc || video.videoWidth === 0) {
      rafRef.current = requestAnimationFrame(runDetection);
      return;
    }

    const ctx = dc.getContext("2d");
    if (!ctx) { rafRef.current = requestAnimationFrame(runDetection); return; }

    dc.width = video.videoWidth;
    dc.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const centerX = dc.width / 2;
    const centerY = dc.height / 2;
    const detected = hasCardInZone(ctx, centerX, centerY, dc.width, dc.height);

    if (detected) {
      stableCountRef.current++;

      if (stableCountRef.current >= 15) {
        // Locked — auto-capture!
        setAim("locked");
        setFeedback("Captured!");
        onStatusChange("capturing");
        capturedRef.current = true;

        // Crop to guide area and send
        const canvas = canvasRef.current!;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")!.drawImage(video, 0, 0);
        const cropped = cropToGuide(canvas);
        setTimeout(() => onCapture(cropped), 200);
        return;
      } else if (stableCountRef.current >= 5) {
        setAim("locked");
        setFeedback("Hold steady...");
        onStatusChange("locked");
      } else {
        setAim("detected");
        setFeedback("Card detected");
        onStatusChange("detecting");
      }
    } else {
      stableCountRef.current = Math.max(0, stableCountRef.current - 2);
      if (stableCountRef.current < 3) {
        setAim("searching");
        setFeedback("Point camera at card");
        onStatusChange("detecting");
      }
    }

    // ~8fps detection
    setTimeout(() => { rafRef.current = requestAnimationFrame(runDetection); }, 120);
  }, [cameraOn, videoRef, canvasRef, onCapture, onStatusChange]);

  useEffect(() => {
    if (cameraOn) {
      rafRef.current = requestAnimationFrame(runDetection);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [cameraOn, runDetection]);

  // Manual capture fallback
  const handleManualCapture = useCallback(() => {
    if (capturedRef.current || !cameraOn) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    capturedRef.current = true;
    setFeedback("Captured!");
    setAim("locked");
    onStatusChange("capturing");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    const cropped = cropToGuide(canvas);
    setTimeout(() => onCapture(cropped), 150);
  }, [cameraOn, videoRef, canvasRef, onCapture, onStatusChange]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center">
        <div>
          <p className="text-red-400 text-sm mb-2">{error}</p>
          <p className="text-zinc-500 text-xs">Try using the upload option instead.</p>
        </div>
      </div>
    );
  }

  const aimColor = aim === "locked" ? "border-green-400" : aim === "detected" ? "border-yellow-400" : "border-white/40";
  const aimGlow = aim === "locked" ? "shadow-[0_0_20px_rgba(34,197,94,0.3)]" : "";
  const aimPulse = aim === "searching" ? "animate-pulse" : "";

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={detectionCanvasRef} className="hidden" />

      {/* Guide overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 border-[40px] sm:border-[50px] border-black/50" />

        {/* Auto-aim rectangle */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] aspect-[3/4] rounded-xl border-2 transition-all duration-300 ${aimColor} ${aimGlow} ${aimPulse}`}>
          {[
            "top-0 left-0 border-t-[3px] border-l-[3px]",
            "top-0 right-0 border-t-[3px] border-r-[3px]",
            "bottom-0 left-0 border-b-[3px] border-l-[3px]",
            "bottom-0 right-0 border-b-[3px] border-r-[3px]",
          ].map((pos, i) => (
            <div key={i} className={`absolute w-7 h-7 ${pos} ${aim === "locked" ? "border-green-400" : aim === "detected" ? "border-yellow-400" : "border-white/60"} rounded-sm transition-colors duration-300`} />
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-6 pt-16 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex flex-col items-center gap-3">
          {/* Status pill */}
          <div className={`px-4 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-colors duration-300 ${
            aim === "locked" ? "bg-green-500/20 text-green-300 border border-green-500/30"
            : aim === "detected" ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
            : "bg-black/40 text-white/70 border border-white/10"
          }`}>
            {feedback}
          </div>

          {/* Manual capture button (always available as fallback) */}
          <button
            onClick={handleManualCapture}
            disabled={capturedRef.current}
            className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg shadow-white/20 active:scale-95 transition-transform disabled:opacity-50"
          >
            <div className="w-14 h-14 rounded-full border-2 border-black/10 flex items-center justify-center">
              <Camera className="h-6 w-6 text-black" />
            </div>
          </button>
          <span className="text-[10px] text-white/40">or tap to capture manually</span>
        </div>
      </div>
    </div>
  );
}
