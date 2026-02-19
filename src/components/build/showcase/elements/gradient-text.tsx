"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useAnimationFrame,
  useTransform,
} from "framer-motion";

interface GradientTextProps {
  children: React.ReactNode;
  colors: string[];
  speed?: number;
  className?: string;
  decorationColor?: string;
  underline?: boolean;
  strikethrough?: boolean;
}

export function GradientText({
  children,
  colors,
  speed = 2,
  className = "",
  decorationColor,
  underline,
  strikethrough,
}: GradientTextProps) {
  const progress = useMotionValue(0);
  const containerRef = useRef<HTMLSpanElement>(null);

  useAnimationFrame((_, delta) => {
    const current = progress.get();
    progress.set(current + (delta / 1000) * speed * 20);
  });

  const backgroundPosition = useTransform(progress, (val) => `${val % 300}% 0%`);

  // Build a 300% wide repeating gradient from the color array
  const gradientStops = colors.join(", ");
  const backgroundImage = `linear-gradient(90deg, ${gradientStops}, ${gradientStops})`;

  // Build text-decoration for underline/strikethrough on gradient text
  const decorationLines: string[] = [];
  if (underline) decorationLines.push("underline");
  if (strikethrough) decorationLines.push("line-through");
  const textDecorationLine = decorationLines.length > 0 ? decorationLines.join(" ") : "none";

  return (
    <motion.span
      ref={containerRef}
      className={className}
      style={{
        backgroundImage,
        backgroundSize: "300% 100%",
        backgroundPosition,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
        display: "inline-block",
        width: "100%",
        textDecorationLine,
        textDecorationColor: decorationColor || colors[0],
        textDecorationThickness: "2px",
      }}
    >
      {children}
    </motion.span>
  );
}
