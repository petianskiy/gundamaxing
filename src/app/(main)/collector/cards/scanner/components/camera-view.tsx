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

export function CameraView({ onCapture, onStatusChange, isActive }: CameraViewProps) {
  const { videoRef, canvasRef, isActive: cameraOn, error, start, stop } = useCamera();
  const [feedback, setFeedback] = useState("Position card inside frame, then tap capture");
  const capturedRef = useRef(false);

  useEffect(() => {
    if (isActive && !cameraOn) {
      capturedRef.current = false;
      start();
    } else if (!isActive && cameraOn) {
      stop();
    }
  }, [isActive, cameraOn, start, stop]);

  const handleCapture = useCallback(() => {
    if (capturedRef.current || !cameraOn) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    capturedRef.current = true;
    setFeedback("Captured!");
    onStatusChange("capturing");

    // Capture full frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Send the full frame — the server-side OCR handles the rest
    setTimeout(() => onCapture(canvas), 150);
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

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Live video feed */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Hidden capture canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Guide overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Dim edges */}
        <div className="absolute inset-0 border-[40px] sm:border-[50px] border-black/50" />

        {/* Center guide rectangle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] aspect-[3/4] rounded-xl border-2 border-white/50">
          {/* Corner brackets */}
          {[
            "top-0 left-0 border-t-2 border-l-2",
            "top-0 right-0 border-t-2 border-r-2",
            "bottom-0 left-0 border-b-2 border-l-2",
            "bottom-0 right-0 border-b-2 border-r-2",
          ].map((pos, i) => (
            <div key={i} className={`absolute w-7 h-7 ${pos} border-white transition-colors duration-300`} />
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-6 pt-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto">
        <div className="flex flex-col items-center gap-3">
          {/* Feedback */}
          <div className="px-4 py-1.5 rounded-full bg-black/50 border border-white/10 text-xs text-white/70 backdrop-blur-sm">
            {feedback}
          </div>

          {/* Capture button */}
          <button
            onClick={handleCapture}
            disabled={capturedRef.current}
            className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg shadow-white/20 active:scale-95 transition-transform disabled:opacity-50"
          >
            <div className="w-14 h-14 rounded-full border-2 border-black/10 flex items-center justify-center">
              <Camera className="h-6 w-6 text-black" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
