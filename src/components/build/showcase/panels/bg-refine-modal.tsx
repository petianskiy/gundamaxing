"use client";

import { useState, useEffect } from "react";
import { useRemoveBackground } from "../hooks/use-remove-background";

interface BgRemovalModalProps {
  imageUrl: string;
  onComplete: (blob: Blob) => Promise<void>;
  onClose: () => void;
}

export function BgRefineModal({ imageUrl, onComplete, onClose }: BgRemovalModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { removeBg, progress, stage, queueSize, queuePosition } = useRemoveBackground();

  // Run background removal on mount, then auto-complete
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const blob = await removeBg(imageUrl);
        if (cancelled) return;
        setSaving(true);
        await onComplete(blob);
      } catch {
        if (!cancelled) setError("Background removal failed. Please try again.");
      }
    })();

    return () => { cancelled = true; };
  }, [imageUrl, removeBg, onComplete]);

  const pct = Math.round(progress * 100);

  const getStatusText = () => {
    if (error) return "";
    if (saving) return "Uploading result...";
    if (stage === "queued") return `Queued (${queuePosition} of ${queueSize})`;
    if (stage === "loading-model") return "Loading AI model...";
    if (stage === "processing") return "Removing background...";
    if (stage === "done") return "Done!";
    return "Preparing...";
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-zinc-900 border border-zinc-700/50 max-w-sm w-full mx-4 shadow-2xl">
        {/* Static sticker */}
        <img src="/gundam-emoji.png" alt="" className="w-16 h-16 object-contain" />

        {error ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-red-400 text-center">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gx-red text-white text-sm font-semibold hover:bg-gx-red/90 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="text-sm font-medium text-white">
                {getStatusText()}
              </p>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gx-red rounded-full transition-all duration-300"
                style={{ width: `${saving ? 100 : pct}%` }}
              />
            </div>
            <p className="text-xs text-zinc-400">{saving ? "..." : `${pct}%`}</p>
          </>
        )}
      </div>
    </div>
  );
}
