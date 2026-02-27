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
    description: "Upload and add photos of your build to the showcase.",
  },
  {
    selector: '[data-dock-item="add-text"]',
    title: "Add Text",
    description: "Add text labels, titles, and descriptions to your page.",
  },
  {
    selector: '[data-dock-item="draw"]',
    title: "Draw",
    description: "Draw directly on your showcase with the pencil tool.",
  },
  {
    selector: '[data-dock-item="layers"]',
    title: "Layers",
    description: "Manage element ordering and visibility.",
  },
  {
    selector: '[data-dock-item="save"]',
    title: "Save",
    description: "Don't forget to save your work when you're done!",
  },
];

const SPOTLIGHT_PAD = 10;

// Delay before first measurement to let dock springs settle to base size
const INITIAL_MEASURE_DELAY = 350;

export function EditorGuideOverlay({ onDismiss }: EditorGuideOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);
  const measureTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Find the next valid step index in a direction.
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
      const nextValid = findValidStep(currentStep + 1, "forward");
      if (nextValid !== null) {
        setCurrentStep(nextValid);
      } else {
        onDismiss();
      }
    }
  }, [currentStep, findValidStep, onDismiss]);

  // Delayed initial measurement — let dock animation settle first
  useEffect(() => {
    measureTimerRef.current = setTimeout(() => {
      measureTarget();
      setReady(true);
    }, INITIAL_MEASURE_DELAY);

    return () => clearTimeout(measureTimerRef.current);
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-measure on step changes (after initial mount)
  useEffect(() => {
    if (ready) {
      measureTarget();
    }
  }, [currentStep, ready, measureTarget]);

  // Re-measure on resize/scroll
  useEffect(() => {
    if (!ready) return;
    const handleChange = () => measureTarget();
    window.addEventListener("resize", handleChange);
    window.addEventListener("scroll", handleChange, true);
    return () => {
      window.removeEventListener("resize", handleChange);
      window.removeEventListener("scroll", handleChange, true);
    };
  }, [ready, measureTarget]);

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

  // Spotlight cutout coordinates
  const spotLeft = targetRect ? targetRect.left - SPOTLIGHT_PAD : 0;
  const spotTop = targetRect ? targetRect.top - SPOTLIGHT_PAD : 0;
  const spotRight = targetRect ? targetRect.right + SPOTLIGHT_PAD : 0;
  const spotBottom = targetRect ? targetRect.bottom + SPOTLIGHT_PAD : 0;

  const clipPath = targetRect
    ? `polygon(evenodd, 0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%, ${spotLeft}px ${spotTop}px, ${spotLeft}px ${spotBottom}px, ${spotRight}px ${spotBottom}px, ${spotRight}px ${spotTop}px, ${spotLeft}px ${spotTop}px)`
    : undefined;

  // Character sits to the right of the spotlight, overlapping slightly — comic style
  const charSize = 72;
  const charRight = targetRect ? spotRight + 2 : 0;
  const charTop = targetRect ? spotTop - charSize * 0.35 : 0;

  // Speech bubble sits above the spotlight, with its tail pointing down-right toward the character
  const bubbleBottom = targetRect
    ? window.innerHeight - spotTop + 12
    : undefined;
  // Center the bubble over the spotlight area
  const bubbleCenterX = (spotLeft + spotRight) / 2;

  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;
  const step = STEPS[currentStep];

  // Don't render anything until measurement is ready
  if (!ready || !targetRect) {
    return (
      <div className="fixed inset-0 z-[700] bg-black/60" onClick={onDismiss}>
        {/* Dark overlay while waiting for measurement */}
      </div>
    );
  }

  return (
    <div
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

      {/* Glowing ring around the spotlight cutout */}
      <motion.div
        key={`ring-${currentStep}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute pointer-events-none"
        style={{
          left: spotLeft,
          top: spotTop,
          width: spotRight - spotLeft,
          height: spotBottom - spotTop,
          borderRadius: 10,
          boxShadow: "0 0 0 2px rgba(239, 68, 68, 0.6), 0 0 16px 4px rgba(239, 68, 68, 0.2)",
        }}
      />

      {/* Character/sticker — positioned to the right of the highlighted tool */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`char-${currentStep}`}
          className="absolute z-[720] pointer-events-none"
          style={{
            left: charRight,
            top: charTop,
            width: charSize,
            height: charSize,
          }}
          initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          >
            <Image
              src="/tutorial/guide-character.webp"
              alt="Guide character"
              width={charSize}
              height={charSize}
              className="object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
              priority
              unoptimized
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Speech bubble card — above the spotlight */}
      <AnimatePresence mode="wait">
        <div
          key={`pos-${currentStep}`}
          className="absolute z-[710] w-[300px] max-w-[calc(100vw-32px)]"
          style={{
            bottom: bubbleBottom,
            left: bubbleCenterX,
            transform: "translateX(-50%)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Card */}
            <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-md p-4 shadow-2xl">
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
              <h3 className="text-sm font-semibold text-foreground mb-1">{step.title}</h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{step.description}</p>

              {/* Navigation */}
              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <button
                    onClick={handleBack}
                    className="flex-1 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex-1 px-3 py-2 rounded-lg bg-gx-red text-white text-sm font-semibold hover:bg-gx-red/90 transition-colors"
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

            {/* Speech bubble tail — points down toward the tool */}
            <div className="flex justify-center">
              <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-card/95 drop-shadow-sm" />
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    </div>
  );
}
