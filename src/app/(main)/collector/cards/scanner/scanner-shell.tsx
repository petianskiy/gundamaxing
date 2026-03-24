"use client";

import { useState, useCallback } from "react";
import { Camera, Upload, ArrowLeft, Check, ScanLine } from "lucide-react";
import Link from "next/link";
import { useCardScanner } from "@/hooks/use-card-scanner";
import { saveScannedCard } from "@/lib/actions/card-scanner";
import { CameraView } from "./components/camera-view";
import { UploadMode } from "./components/upload-mode";
import { ReviewPanel, type ReviewFormData } from "./components/review-panel";
import { canvasToBlob } from "./components/image-normalizer";
import type { ScanStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type InputMode = "camera" | "upload";

export function ScannerShell() {
  const [mode, setMode] = useState<InputMode>("camera");
  const { state, setStatus, processImage, processFile, reset, markSaved } = useCardScanner();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleCapture = useCallback(
    (canvas: HTMLCanvasElement) => {
      processImage(canvas);
    },
    [processImage],
  );

  const handleStatusChange = useCallback(
    (status: ScanStatus) => setStatus(status),
    [setStatus],
  );

  const handleSave = useCallback(
    async (data: ReviewFormData) => {
      if (!state.processedCanvas) return;
      setIsSaving(true);
      setSaveMessage(null);

      try {
        // Upload image to R2
        const blob = await canvasToBlob(state.processedCanvas);
        const formData = new FormData();
        formData.append("file", blob, "card-scan.jpg");

        // Get presigned URL
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: `card-${data.cardId || "scan"}.jpg`,
            contentType: "image/jpeg",
            type: "image",
          }),
        });

        if (!uploadRes.ok) throw new Error("Failed to get upload URL");
        const { presignedUrl, url, key } = await uploadRes.json();

        // Upload to R2
        await fetch(presignedUrl, {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: blob,
        });

        // Save to DB
        const result = await saveScannedCard({
          ...data,
          imageUrl: url,
          imageKey: key,
          confidence: state.scanResult?.overallConfidence ?? 0,
          rawOcrData: state.scanResult?.fields ?? null,
        });

        if (result.error) {
          setSaveMessage(result.error);
        } else {
          markSaved();
          setSaveMessage("Card saved to your collection!");
        }
      } catch (err) {
        setSaveMessage(err instanceof Error ? err.message : "Failed to save");
      } finally {
        setIsSaving(false);
      }
    },
    [state.processedCanvas, state.scanResult, markSaved],
  );

  const showCamera = state.status !== "review" && state.status !== "saved" && mode === "camera";
  const showUpload = state.status !== "review" && state.status !== "saved" && mode === "upload";
  const showReview = state.status === "review" && state.scanResult;
  const showSaved = state.status === "saved";

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-20 bg-gradient-to-b from-[#070a12] via-[#0c1020] to-black" />

      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-sm border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href="/collector/cards"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>

          <div className="flex-1 flex items-center justify-center gap-1">
            <ScanLine className="h-4 w-4 text-gx-red" />
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-gx-red">
              カードスキャナー &middot; Card Scanner
            </span>
          </div>

          {/* Mode toggle — only when not in review */}
          {!showReview && !showSaved && (
            <div className="flex bg-white/[0.05] rounded-lg p-0.5 border border-white/[0.06]">
              <button
                onClick={() => { setMode("camera"); reset(); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  mode === "camera" ? "bg-gx-red text-white" : "text-zinc-500 hover:text-white",
                )}
              >
                <Camera className="h-3.5 w-3.5" />
                Camera
              </button>
              <button
                onClick={() => { setMode("upload"); reset(); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  mode === "upload" ? "bg-gx-red text-white" : "text-zinc-500 hover:text-white",
                )}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-5xl mx-auto">
        {/* Camera view */}
        {showCamera && (
          <div className="aspect-[3/4] max-h-[80vh]">
            <CameraView
              onCapture={handleCapture}
              onStatusChange={handleStatusChange}
              isActive={showCamera}
            />
          </div>
        )}

        {/* Upload view */}
        {showUpload && (
          <div className="aspect-[3/4] max-h-[80vh]">
            <UploadMode
              onFile={(f) => processFile(f)}
              isProcessing={state.status === "processing"}
            />
          </div>
        )}

        {/* Processing spinner */}
        {state.status === "processing" && mode === "camera" && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-2 border-gx-red border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-400">Analyzing card...</p>
          </div>
        )}

        {/* Review panel */}
        {showReview && state.scanResult && state.processedImageUrl && (
          <ReviewPanel
            imageUrl={state.processedImageUrl}
            scanResult={state.scanResult}
            onSave={handleSave}
            onRescan={reset}
            isSaving={isSaving}
          />
        )}

        {/* Saved state */}
        {showSaved && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-lg font-semibold text-white">
              {saveMessage || "Card saved!"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gx-red hover:bg-red-500 text-white text-sm font-semibold transition-all"
              >
                <ScanLine className="h-4 w-4" />
                Scan Another
              </button>
              <Link
                href="/collector/cards/my-cards"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 text-sm font-medium transition-all"
              >
                View Collection
              </Link>
            </div>
          </div>
        )}

        {/* Error state */}
        {state.status === "error" && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-red-400 text-sm">{state.error}</p>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-zinc-300 hover:bg-white/[0.08] transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Save message (error during save) */}
        {saveMessage && state.status === "review" && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300 text-center">
            {saveMessage}
          </div>
        )}
      </div>
    </div>
  );
}
