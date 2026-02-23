"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export type BgRemovalStage = "idle" | "loading-model" | "processing" | "finalizing";

// Preloaded flag to avoid re-preloading across instances
let modelPreloaded = false;
let preloadPromise: Promise<void> | null = null;

export function useRemoveBackground() {
  const [isRemoving, setIsRemoving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<BgRemovalStage>("idle");
  const abortRef = useRef(false);

  // Preload model on mount for instant processing later
  useEffect(() => {
    if (!modelPreloaded && !preloadPromise) {
      preloadPromise = (async () => {
        try {
          const { preload } = await import("@imgly/background-removal");
          await preload({ model: "isnet_quint8", device: "gpu" });
          modelPreloaded = true;
        } catch {
          // Silently fail — model will load on first use
        }
      })();
    }
  }, []);

  const removeBg = useCallback(async (imageUrl: string): Promise<Blob> => {
    abortRef.current = false;
    setIsRemoving(true);
    setProgress(0);
    setStage("loading-model");

    try {
      const { removeBackground } = await import("@imgly/background-removal");

      if (abortRef.current) throw new Error("Aborted");

      setStage("processing");

      const blob = await removeBackground(imageUrl, {
        model: "isnet_quint8",
        device: "gpu",
        output: { format: "image/png", quality: 1 },
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) {
            const p = current / total;
            setProgress(p);
            if (p > 0.9) setStage("finalizing");
          }
        },
      });

      return blob;
    } finally {
      setIsRemoving(false);
      setProgress(0);
      setStage("idle");
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  return { removeBg, abort, isRemoving, progress, stage };
}

export function stageLabel(stage: BgRemovalStage): string {
  switch (stage) {
    case "loading-model": return "Loading AI model...";
    case "processing": return "Removing background...";
    case "finalizing": return "Finalizing...";
    default: return "";
  }
}
