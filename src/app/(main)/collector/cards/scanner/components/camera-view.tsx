"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useCamera } from "@/hooks/use-camera";
import { detectCard, isStable, type CardDetectionResult } from "./card-detector";
import { processCardImage } from "./image-normalizer";
import type { ScanStatus } from "@/lib/types";

interface CameraViewProps {
  onCapture: (canvas: HTMLCanvasElement) => void;
  onStatusChange: (status: ScanStatus) => void;
  isActive: boolean;
}

export function CameraView({ onCapture, onStatusChange, isActive }: CameraViewProps) {
  const { videoRef, canvasRef, isActive: cameraOn, error, start, stop } = useCamera();
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<CardDetectionResult[]>([]);
  const rafRef = useRef<number>(0);
  const [feedback, setFeedback] = useState("Point camera at card");
  const [detectionState, setDetectionState] = useState<"searching" | "detected" | "locked">("searching");
  const capturedRef = useRef(false);

  // Start/stop camera based on isActive
  useEffect(() => {
    if (isActive && !cameraOn) {
      capturedRef.current = false;
      start();
    } else if (!isActive && cameraOn) {
      stop();
    }
  }, [isActive, cameraOn, start, stop]);

  // Detection loop
  const runDetection = useCallback(() => {
    if (!cameraOn || capturedRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !video || !overlay) {
      rafRef.current = requestAnimationFrame(runDetection);
      return;
    }

    const ctx = canvas.getContext("2d")!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = detectCard(imageData);

    // Draw overlay
    const oCtx = overlay.getContext("2d")!;
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    oCtx.clearRect(0, 0, overlay.width, overlay.height);

    if (!result) {
      historyRef.current = [];
      setDetectionState("searching");
      setFeedback("Point camera at card");
      onStatusChange("detecting");
    } else {
      historyRef.current.push(result);
      if (historyRef.current.length > 15) historyRef.current.shift();

      // Draw detected outline
      const [tl, tr, br, bl] = result.corners;
      oCtx.strokeStyle = isStable(historyRef.current) ? "#22c55e" : "#facc15";
      oCtx.lineWidth = 3;
      oCtx.beginPath();
      oCtx.moveTo(tl.x, tl.y);
      oCtx.lineTo(tr.x, tr.y);
      oCtx.lineTo(br.x, br.y);
      oCtx.lineTo(bl.x, bl.y);
      oCtx.closePath();
      oCtx.stroke();

      // Corner markers
      const markerSize = 20;
      oCtx.lineWidth = 4;
      for (const corner of result.corners) {
        oCtx.beginPath();
        oCtx.arc(corner.x, corner.y, markerSize / 4, 0, Math.PI * 2);
        oCtx.fillStyle = oCtx.strokeStyle;
        oCtx.fill();
      }

      if (result.frameRatio < 0.15) {
        setFeedback("Move closer");
        setDetectionState("detected");
        onStatusChange("detecting");
      } else if (isStable(historyRef.current)) {
        setDetectionState("locked");
        setFeedback("Hold steady...");
        onStatusChange("locked");

        // Auto-capture after stability is confirmed (brief pause)
        if (historyRef.current.length >= 8 && !capturedRef.current) {
          capturedRef.current = true;
          setFeedback("Captured!");
          onStatusChange("capturing");

          // Capture the frame and process
          const processed = processCardImage(canvas, result.corners);
          setTimeout(() => onCapture(processed), 200);
          return; // stop detection loop
        }
      } else {
        setDetectionState("detected");
        setFeedback("Hold steady");
        onStatusChange("detecting");
      }
    }

    rafRef.current = requestAnimationFrame(runDetection);
  }, [cameraOn, canvasRef, videoRef, onCapture, onStatusChange]);

  useEffect(() => {
    if (cameraOn) {
      rafRef.current = requestAnimationFrame(runDetection);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cameraOn, runDetection]);

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

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Live video feed */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Detection overlay canvas */}
      <canvas
        ref={overlayRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Guide frame */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Dimmed corners */}
        <div className="absolute inset-0 border-[40px] sm:border-[60px] border-black/40" />

        {/* Center guide rectangle */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[65%] aspect-[3/4] rounded-xl border-2 transition-colors duration-300 ${
            detectionState === "locked"
              ? "border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              : detectionState === "detected"
              ? "border-yellow-400"
              : "border-white/40 animate-pulse"
          }`}
        >
          {/* Corner brackets */}
          {[
            "top-0 left-0 border-t-2 border-l-2",
            "top-0 right-0 border-t-2 border-r-2",
            "bottom-0 left-0 border-b-2 border-l-2",
            "bottom-0 right-0 border-b-2 border-r-2",
          ].map((pos, i) => (
            <div
              key={i}
              className={`absolute w-6 h-6 ${pos} ${
                detectionState === "locked" ? "border-green-400" : "border-white/60"
              } transition-colors duration-300`}
            />
          ))}
        </div>
      </div>

      {/* Feedback text */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
        <div
          className={`px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm transition-colors duration-300 ${
            detectionState === "locked"
              ? "bg-green-500/20 text-green-300 border border-green-500/30"
              : detectionState === "detected"
              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
              : "bg-black/40 text-white/70 border border-white/10"
          }`}
        >
          {feedback}
        </div>
      </div>
    </div>
  );
}
