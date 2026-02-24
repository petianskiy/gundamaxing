"use client";

import { useState, useCallback } from "react";

export type BgRemovalStage = "idle" | "queued" | "loading-model" | "processing" | "uploading" | "done";

// Global queue to prevent concurrent WASM processing
let globalQueue: Array<{
  imageUrl: string;
  resolve: (blob: Blob) => void;
  reject: (err: Error) => void;
  onProgress: (progress: number) => void;
  onStage: (stage: BgRemovalStage) => void;
}> = [];
let isProcessing = false;

async function processQueue() {
  if (isProcessing || globalQueue.length === 0) return;
  isProcessing = true;

  const item = globalQueue[0];
  try {
    item.onStage("loading-model");
    const { removeBackground } = await import("@imgly/background-removal");

    item.onStage("processing");
    // Yield to main thread before heavy WASM work
    await new Promise((r) => setTimeout(r, 50));

    const blob = await removeBackground(item.imageUrl, {
      model: "isnet_quint8",
      device: "gpu",
      output: { format: "image/png", quality: 1 },
      progress: (_key: string, current: number, total: number) => {
        if (total > 0) item.onProgress(current / total);
      },
    });

    item.resolve(blob);
  } catch (err) {
    item.reject(err instanceof Error ? err : new Error(String(err)));
  } finally {
    globalQueue.shift();
    isProcessing = false;
    // Small delay before next item to let UI breathe
    if (globalQueue.length > 0) {
      setTimeout(processQueue, 100);
    }
  }
}

export function useRemoveBackground() {
  const [isRemoving, setIsRemoving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<BgRemovalStage>("idle");
  const [queueSize, setQueueSize] = useState(0);
  const [queuePosition, setQueuePosition] = useState(0);

  const removeBg = useCallback(async (imageUrl: string): Promise<Blob> => {
    setIsRemoving(true);
    setProgress(0);
    setStage("queued");

    const blob = await new Promise<Blob>((resolve, reject) => {
      globalQueue.push({
        imageUrl,
        resolve,
        reject,
        onProgress: (p) => setProgress(p),
        onStage: (s) => setStage(s),
      });
      setQueueSize(globalQueue.length);
      setQueuePosition(globalQueue.length);
      processQueue();
    });

    setIsRemoving(false);
    setStage("done");
    setQueueSize(globalQueue.length);
    return blob;
  }, []);

  return { removeBg, isRemoving, progress, stage, queueSize, queuePosition };
}

export function stageLabel(stage: BgRemovalStage): string {
  switch (stage) {
    case "queued": return "Queued...";
    case "loading-model": return "Loading AI model...";
    case "processing": return "Removing background...";
    case "uploading": return "Uploading result...";
    case "done": return "Done!";
    default: return "";
  }
}
