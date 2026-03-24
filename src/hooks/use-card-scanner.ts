"use client";

import { useState, useCallback, useRef } from "react";
import type { ScanStatus, ScanResult } from "@/lib/types";

interface CardBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ScannerState {
  status: ScanStatus;
  processedImageUrl: string | null;
  processedCanvas: HTMLCanvasElement | null;
  scanResult: ScanResult | null;
  error: string | null;
}

const INITIAL_STATE: ScannerState = {
  status: "idle",
  processedImageUrl: null,
  processedCanvas: null,
  scanResult: null,
  error: null,
};

/**
 * Crop a canvas to the given bounds (used for card-only preview image).
 */
function cropCanvas(source: HTMLCanvasElement, bounds: CardBounds): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = bounds.width;
  out.height = bounds.height;
  out.getContext("2d")!.drawImage(
    source,
    bounds.x, bounds.y, bounds.width, bounds.height,
    0, 0, bounds.width, bounds.height,
  );
  return out;
}

export function useCardScanner() {
  const [state, setState] = useState<ScannerState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const setStatus = (status: ScanStatus) => setState((s) => ({ ...s, status }));
  const setError = (error: string) => setState((s) => ({ ...s, status: "error", error }));

  const processImage = useCallback(async (canvas: HTMLCanvasElement) => {
    setState((s) => ({
      ...s,
      status: "processing",
      processedCanvas: canvas,
      error: null,
    }));

    try {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const base64 = canvas.toDataURL("image/jpeg", 0.92);

      const res = await fetch("/api/scan-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          imageWidth: canvas.width,
          imageHeight: canvas.height,
        }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Scan failed");
        return;
      }

      // If server found card bounds, crop the preview image to just the card
      let previewCanvas = canvas;
      if (data.cardBounds) {
        previewCanvas = cropCanvas(canvas, data.cardBounds);
      }

      setState((s) => ({
        ...s,
        status: "review",
        scanResult: data.result,
        processedCanvas: previewCanvas,
        processedImageUrl: previewCanvas.toDataURL("image/jpeg", 0.92),
      }));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Scan failed unexpectedly");
    }
  }, []);

  const processFile = useCallback(async (file: File) => {
    setState((s) => ({ ...s, status: "processing", error: null }));
    try {
      const img = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      await processImage(canvas);
    } catch {
      setError("Failed to load image. Please try a different file.");
    }
  }, [processImage]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
  }, []);

  const markSaved = useCallback(() => {
    setState((s) => ({ ...s, status: "saved" }));
  }, []);

  return { state, setStatus, processImage, processFile, reset, markSaved };
}
