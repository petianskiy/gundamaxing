"use client";

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";
import { useRef, useState } from "react";

const MAX_OVERFLOW = 50;

function decay(value: number, max: number) {
  if (max === 0) return 0;
  const entry = value / max;
  const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);
  return sigmoid * max;
}

interface ElasticSliderProps {
  defaultValue: number;
  startingValue?: number;
  maxValue: number;
  isStepped?: boolean;
  stepSize?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onChange: (value: number) => void;
  className?: string;
}

export function ElasticSlider({
  defaultValue,
  startingValue = 0,
  maxValue,
  isStepped = false,
  stepSize = 1,
  leftIcon,
  rightIcon,
  onChange,
  className,
}: ElasticSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [isDragging, setIsDragging] = useState(false);

  const clientX = useMotionValue(0);
  const overflow = useMotionValue(0);
  const region = useRef<"left" | "middle" | "right">("middle");

  // Scale icons based on overflow direction
  const leftIconScale = useTransform(() => {
    const ov = overflow.get();
    if (region.current === "left") {
      const pct = decay(Math.abs(ov), MAX_OVERFLOW) / MAX_OVERFLOW;
      return 1 + 0.4 * pct;
    }
    return 1;
  });

  const rightIconScale = useTransform(() => {
    const ov = overflow.get();
    if (region.current === "right") {
      const pct = decay(Math.abs(ov), MAX_OVERFLOW) / MAX_OVERFLOW;
      return 1 + 0.4 * pct;
    }
    return 1;
  });

  // Track scaleX expands with overflow, scaleY compresses
  const trackScaleX = useTransform(() => {
    const ov = overflow.get();
    if (ov === 0) return 1;
    const pct = decay(Math.abs(ov), MAX_OVERFLOW) / MAX_OVERFLOW;
    return 1 + 0.05 * pct;
  });

  const trackScaleY = useTransform(() => {
    const ov = overflow.get();
    if (ov === 0) return 1;
    const pct = decay(Math.abs(ov), MAX_OVERFLOW) / MAX_OVERFLOW;
    return 1 - 0.05 * pct;
  });

  useMotionValueEvent(clientX, "change", (latest) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    let newValue: number;

    if (latest < rect.left) {
      region.current = "left";
      overflow.set(latest - rect.left);
      newValue = startingValue;
    } else if (latest > rect.right) {
      region.current = "right";
      overflow.set(latest - rect.right);
      newValue = maxValue;
    } else {
      region.current = "middle";
      overflow.set(0);
      const fraction = (latest - rect.left) / rect.width;
      newValue = startingValue + fraction * (maxValue - startingValue);
    }

    if (isStepped) {
      newValue = Math.round(newValue / stepSize) * stepSize;
    }

    newValue = Math.max(startingValue, Math.min(maxValue, newValue));

    setValue(newValue);
    onChange(newValue);
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    clientX.set(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    clientX.set(e.clientX);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    animate(overflow, 0, { type: "spring", bounce: 0.5, duration: 0.5 });
  };

  const percentage =
    maxValue === startingValue
      ? 0
      : ((value - startingValue) / (maxValue - startingValue)) * 100;

  const displayValue = isStepped ? value : Math.round(value * 10) / 10;

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        {/* Left icon */}
        {leftIcon && (
          <motion.div
            className="flex shrink-0 items-center text-zinc-400"
            style={{ scale: leftIconScale }}
            whileHover={{ scale: 1.2 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            {leftIcon}
          </motion.div>
        )}

        {/* Track area */}
        <motion.div
          ref={trackRef}
          className="group relative flex h-6 w-full cursor-grab touch-none items-center active:cursor-grabbing"
          style={{ scaleX: trackScaleX, scaleY: trackScaleY }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Background track */}
          <div className="absolute inset-x-0 h-1.5 rounded-full bg-zinc-700 transition-[height] duration-200 group-hover:h-3" />

          {/* Filled track */}
          <div
            className="absolute left-0 h-1.5 rounded-full bg-blue-500 transition-[height] duration-200 group-hover:h-3"
            style={{ width: `${percentage}%` }}
          />

          {/* Thumb indicator */}
          <div
            className="pointer-events-none absolute h-4 w-4 rounded-full border-2 border-blue-500 bg-zinc-900 shadow-md"
            style={{
              left: `${percentage}%`,
              transform: `translateX(-50%) scale(${isDragging ? 1.2 : 1})`,
              transition: "transform 150ms ease",
            }}
          />
        </motion.div>

        {/* Right icon */}
        {rightIcon && (
          <motion.div
            className="flex shrink-0 items-center text-zinc-400"
            style={{ scale: rightIconScale }}
            whileHover={{ scale: 1.2 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            {rightIcon}
          </motion.div>
        )}
      </div>

      {/* Value display */}
      <div className="mt-2 text-center text-sm tabular-nums text-zinc-500">
        {displayValue}
      </div>
    </div>
  );
}
