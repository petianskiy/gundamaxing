"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface EditorGuideOverlayProps {
  onDismiss: () => void;
}

export function EditorGuideOverlay({ onDismiss }: EditorGuideOverlayProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus the "Got it" button on mount
  useEffect(() => {
    const timer = setTimeout(() => buttonRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  // Escape key closes overlay
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onDismiss]);

  // Prevent scroll while overlay is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[700]"
      role="dialog"
      aria-modal="true"
      aria-label="Editor guide"
      onClick={onDismiss}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
      />

      {/* Content: positioned near the bottom center where the dock is */}
      <div className="absolute inset-0 flex items-end justify-center pb-28 sm:pb-32 px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col sm:flex-row items-end gap-3 sm:gap-4 max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Speech bubble */}
          <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-md p-5 shadow-2xl">
            <p className="text-sm text-foreground leading-relaxed">
              Welcome to the <strong className="text-gx-red">Showcase Editor</strong>!
              Use the toolbar below to add images, text, effects, and more to design
              your build&apos;s showcase page.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Drag elements around, resize them, and make it your own.
            </p>
            <button
              ref={buttonRef}
              onClick={onDismiss}
              className="mt-4 w-full px-4 py-2.5 rounded-lg bg-gx-red text-white text-sm font-semibold hover:bg-gx-red/90 transition-colors focus:outline-none focus:ring-2 focus:ring-gx-red/50 focus:ring-offset-2 focus:ring-offset-card"
            >
              Got it!
            </button>
          </div>

          {/* Character image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
            className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 relative"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            >
              <Image
                src="/tutorial/guide-character.webp"
                alt="Guide character"
                width={96}
                height={96}
                className="object-contain drop-shadow-lg"
                priority
                unoptimized
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
