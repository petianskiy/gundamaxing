"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { X, Sparkles } from "lucide-react";
import { useRemoveBackground, stageLabel } from "../hooks/use-remove-background";

interface BgRemovalModalProps {
  imageUrl: string;
  onComplete: (blob: Blob) => Promise<void>;
  onClose: () => void;
}

export function BgRefineModal({ imageUrl, onComplete, onClose }: BgRemovalModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { removeBg, progress, stage } = useRemoveBackground();

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
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gx-red" />
              <h3 className="text-sm font-semibold text-foreground">
                {saving ? "Saving Result" : "Removing Background"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          {error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-14 px-6 gap-4"
            >
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-gx-red text-white text-sm font-semibold hover:bg-gx-red/90 transition-colors"
              >
                Close
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 px-6 gap-6">
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
                  {saving ? "..." : `${pct}%`}
                </span>
              </div>

              {/* Stage label */}
              <p className="text-sm font-medium text-muted-foreground">
                {saving ? "Uploading result..." : stageLabel(stage) || "Preparing..."}
              </p>

              {/* Mascot + message */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex items-end gap-4 max-w-sm"
              >
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
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
