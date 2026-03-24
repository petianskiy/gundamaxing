"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useCamera } from "@/hooks/use-camera";
import { Camera, Zap } from "lucide-react";
import type { ScanStatus } from "@/lib/types";

interface CameraViewProps {
  onCapture: (canvas: HTMLCanvasElement) => void;
  onStatusChange: (status: ScanStatus) => void;
  isActive: boolean;
}

export function CameraView({ onCapture, onStatusChange, isActive }: CameraViewProps) {
  const { videoRef, canvasRef, isActive: cameraOn, error, start, stop } = useCamera();
  const [captured, setCaptured] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (isActive && !cameraOn) {
      setCaptured(false);
      start();
    } else if (!isActive && cameraOn) {
      stop();
    }
  }, [isActive, cameraOn, start, stop]);

  const handleCapture = useCallback(() => {
    if (captured || !cameraOn) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    setCaptured(true);
    onStatusChange("capturing");

    // Capture full frame — server will auto-crop using text bounds
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);

    setTimeout(() => onCapture(canvas), 200);
  }, [captured, cameraOn, videoRef, canvasRef, onCapture, onStatusChange]);

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
      {/* Live video */}
      <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Flash effect */}
      {flash && <div className="absolute inset-0 bg-white/30 z-30 pointer-events-none" />}

      {/* Targeting overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Darkened corners — vignette effect */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 75% 70% at 50% 45%, transparent 50%, rgba(0,0,0,0.6) 100%)"
        }} />

        {/* Card guide — 3:4 rectangle centered */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[68%] aspect-[3/4]">
          {/* Animated scanning line */}
          {!captured && (
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-green-400/80 to-transparent animate-scan-line z-10" />
          )}

          {/* Corner brackets — thick, prominent */}
          {[
            { pos: "top-0 left-0", border: "border-t-[3px] border-l-[3px]", round: "rounded-tl-lg" },
            { pos: "top-0 right-0", border: "border-t-[3px] border-r-[3px]", round: "rounded-tr-lg" },
            { pos: "bottom-0 left-0", border: "border-b-[3px] border-l-[3px]", round: "rounded-bl-lg" },
            { pos: "bottom-0 right-0", border: "border-b-[3px] border-r-[3px]", round: "rounded-br-lg" },
          ].map((c, i) => (
            <div key={i} className={`absolute ${c.pos} w-10 h-10 ${c.border} border-green-400/80 ${c.round}`} />
          ))}

          {/* Thin edge lines */}
          <div className="absolute inset-0 border border-green-400/20 rounded-lg" />
        </div>

        {/* Instruction text at top */}
        <div className="absolute top-4 left-0 right-0 flex justify-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-white/10 backdrop-blur-sm">
            <Zap className="h-3.5 w-3.5 text-green-400" />
            <span className="text-xs text-white/80 font-medium">
              {captured ? "Processing..." : "Fill card inside frame, then tap capture"}
            </span>
          </div>
        </div>
      </div>

      {/* Capture button area */}
      {!captured && (
        <div className="absolute bottom-0 left-0 right-0 pb-8 pt-12 bg-gradient-to-t from-black/70 to-transparent flex flex-col items-center gap-2">
          <button
            onClick={handleCapture}
            className="w-[72px] h-[72px] rounded-full bg-white/10 border-[3px] border-white flex items-center justify-center active:scale-90 transition-transform"
          >
            <div className="w-[58px] h-[58px] rounded-full bg-white flex items-center justify-center">
              <Camera className="h-6 w-6 text-black" />
            </div>
          </button>
        </div>
      )}

      {/* Processing state */}
      {captured && (
        <div className="absolute bottom-0 left-0 right-0 pb-8 pt-12 bg-gradient-to-t from-black/70 to-transparent flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-green-300 font-medium">Analyzing card...</span>
        </div>
      )}

      {/* Scanning line animation */}
      <style>{`
        @keyframes scanLine {
          0% { top: 0%; }
          50% { top: 95%; }
          100% { top: 0%; }
        }
        .animate-scan-line {
          animation: scanLine 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
