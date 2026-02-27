"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface EditorGuideOverlayProps {
  onDismiss: () => void;
}

interface GuideStep {
  selector: string;
  title: string;
  description: string;
}

const STEPS: GuideStep[] = [
  {
    selector: '[data-dock-item="add-image"]',
    title: "Add Images",
    description: "Upload and add photos to your showcase",
  },
  {
    selector: '[data-dock-item="add-text"]',
    title: "Add Text",
    description: "Add text labels, titles, and descriptions",
  },
  {
    selector: '[data-dock-item="draw"]',
    title: "Draw",
    description: "Draw directly on your showcase with the pencil tool",
  },
  {
    selector: '[data-dock-item="layers"]',
    title: "Layers",
    description: "Manage element ordering and layers",
  },
  {
    selector: '[data-dock-item="save"]',
    title: "Save",
    description: "Don't forget to save your work!",
  },
];

const PADDING = 8;

export function EditorGuideOverlay({ onDismiss }: EditorGuideOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Find the first valid step index starting from a given index, searching forward.
  const findValidStep = useCallback(
    (startIndex: number, direction: "forward" | "backward"): number | null => {
      const step = direction === "forward" ? 1 : -1;
      let index = startIndex;
      while (index >= 0 && index < STEPS.length) {
        const el = document.querySelector(STEPS[index].selector);
        if (el) return index;
        index += step;
      }
      return null;
    },
    [],
  );

  // Measure the target element for the current step
  const measureTarget = useCallback(() => {
    const step = STEPS[currentStep];
    if (!step) return;
    const el = document.querySelector(step.selector);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
      // Auto-skip to next valid step
      const nextValid = findValidStep(currentStep + 1, "forward");
      if (nextValid !== null) {
        setCurrentStep(nextValid);
      } else {
        // No more valid steps, dismiss
        onDismiss();
      }
    }
  }, [currentStep, findValidStep, onDismiss]);

  // Measure on step change and on resize/scroll
  useEffect(() => {
    measureTarget();

    const handleResizeOrScroll = () => {
      measureTarget();
    };

    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);
    return () => {
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [measureTarget]);

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

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      const nextValid = findValidStep(currentStep + 1, "forward");
      if (nextValid !== null) {
        setCurrentStep(nextValid);
      } else {
        onDismiss();
      }
    } else {
      onDismiss();
    }
  }, [currentStep, findValidStep, onDismiss]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      const prevValid = findValidStep(currentStep - 1, "backward");
      if (prevValid !== null) {
        setCurrentStep(prevValid);
      }
    }
  }, [currentStep, findValidStep]);

  // Compute spotlight cutout coordinates with padding
  const left = targetRect ? targetRect.left - PADDING : 0;
  const top = targetRect ? targetRect.top - PADDING : 0;
  const right = targetRect ? targetRect.right + PADDING : 0;
  const bottom = targetRect ? targetRect.bottom + PADDING : 0;

  const clipPath = targetRect
    ? `polygon(evenodd, 0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%, ${left}px ${top}px, ${left}px ${bottom}px, ${right}px ${bottom}px, ${right}px ${top}px, ${left}px ${top}px)`
    : undefined;

  // Position the speech bubble above the target, centered horizontally
  const bubbleStyle: React.CSSProperties = targetRect
    ? {
        position: "absolute",
        top: `${top - 16}px`,
        left: `${left + (right - left) / 2}px`,
        transform: "translateX(-50%) translateY(-100%)",
      }
    : {
        position: "absolute",
        bottom: "30%",
        left: "50%",
        transform: "translateX(-50%)",
      };

  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;
  const step = STEPS[currentStep];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[700]"
      role="dialog"
      aria-modal="true"
      aria-label="Editor guide"
    >
      {/* Darkened overlay with spotlight cutout */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 bg-black/60"
          style={{ clipPath }}
          onClick={onDismiss}
        />
      </AnimatePresence>

      {/* Transparent click-blocker over the cutout area (prevents interacting with the highlighted element) */}
      {targetRect && (
        <div
          className="absolute"
          style={{
            left: `${left}px`,
            top: `${top}px`,
            width: `${right - left}px`,
            height: `${bottom - top}px`,
            borderRadius: "8px",
            boxShadow: "0 0 0 2px rgba(239, 68, 68, 0.5)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Speech bubble + character */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={bubbleStyle}
          className="z-[710] w-[320px] max-w-[calc(100vw-32px)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-end gap-3">
            {/* Character image */}
            <motion.div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 relative">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 2.5,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src="/tutorial/guide-character.webp"
                  alt="Guide character"
                  width={80}
                  height={80}
                  className="object-contain drop-shadow-lg"
                  priority
                  unoptimized
                />
              </motion.div>
            </motion.div>

            {/* Card */}
            <div className="flex-1 rounded-xl border border-border/60 bg-card/95 backdrop-blur-md p-4 shadow-2xl">
              {/* Step counter */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {currentStep + 1} of {STEPS.length}
                </span>
                <button
                  onClick={onDismiss}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Skip guide"
                >
                  Skip
                </button>
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {step.description}
              </p>

              {/* Navigation */}
              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <button
                    onClick={handleBack}
                    className="flex-1 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-gx-red/50 focus:ring-offset-2 focus:ring-offset-card"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex-1 px-3 py-2 rounded-lg bg-gx-red text-white text-sm font-semibold hover:bg-gx-red/90 transition-colors focus:outline-none focus:ring-2 focus:ring-gx-red/50 focus:ring-offset-2 focus:ring-offset-card"
                >
                  {isLastStep ? "Done" : "Next"}
                </button>
              </div>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep
                        ? "w-4 bg-gx-red"
                        : i < currentStep
                          ? "w-1.5 bg-gx-red/40"
                          : "w-1.5 bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Arrow pointing down to the highlighted element */}
          {targetRect && (
            <div className="flex justify-center mt-[-1px]">
              <div className="w-3 h-3 bg-card/95 border-b border-r border-border/60 rotate-45 translate-y-[-6px]" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
