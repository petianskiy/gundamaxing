"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { CalloutPin } from "@/lib/types";

interface InspectionHotspotsProps {
  pins: CalloutPin[];
  imageWidth: number;
  imageHeight: number;
}

export function InspectionHotspots({
  pins,
  imageWidth,
  imageHeight,
}: InspectionHotspotsProps) {
  const [activePin, setActivePin] = useState<string | null>(null);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {pins.map((pin) => (
        <div
          key={pin.id}
          className="absolute pointer-events-auto"
          style={{
            left: `${pin.x}%`,
            top: `${pin.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Pin button */}
          <button
            onClick={() =>
              setActivePin((prev) => (prev === pin.id ? null : pin.id))
            }
            onMouseEnter={() => setActivePin(pin.id)}
            onMouseLeave={() => setActivePin(null)}
            className="relative flex items-center justify-center w-5 h-5 group"
            aria-label={pin.label}
          >
            {/* Outer pulsing ring */}
            <span
              className={cn(
                "absolute inset-0 rounded-full",
                "bg-red-600/30 animate-ping"
              )}
              style={{ animationDuration: "2s" }}
            />

            {/* Inner dot */}
            <span
              className={cn(
                "relative w-2 h-2 rounded-full",
                "bg-red-600 ring-2 ring-red-600/50",
                "shadow-[0_0_8px_rgba(220,38,38,0.6)]"
              )}
            />
          </button>

          {/* Tooltip */}
          <AnimatePresence>
            {activePin === pin.id && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "absolute bottom-full left-1/2 -translate-x-1/2 mb-3",
                  "pointer-events-none z-20",
                  "min-w-[160px] max-w-[240px]"
                )}
              >
                <div
                  className={cn(
                    "bg-zinc-900/95 backdrop-blur-sm border border-[#27272a]",
                    "rounded-lg px-3 py-2 shadow-xl"
                  )}
                >
                  <p className="text-xs font-semibold text-white leading-tight">
                    {pin.label}
                  </p>
                  {pin.description && (
                    <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                      {pin.description}
                    </p>
                  )}
                </div>

                {/* Tooltip arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                  <div className="w-2 h-2 bg-zinc-900/95 border-r border-b border-[#27272a] rotate-45" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
