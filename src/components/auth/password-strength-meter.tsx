"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  score: number;
  label: string;
}

const SEGMENT_COLORS: Record<number, string> = {
  0: "bg-gray-600",
  1: "bg-red-500",
  2: "bg-orange-500",
  3: "bg-yellow-500",
  4: "bg-green-500",
};

export function PasswordStrengthMeter({ score, label }: PasswordStrengthMeterProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => {
          const isActive = i < score;
          const color = isActive ? SEGMENT_COLORS[score] ?? "bg-gray-600" : "bg-border/50";

          return (
            <motion.div
              key={i}
              initial={false}
              animate={{
                opacity: isActive ? 1 : 0.3,
                scaleX: isActive ? 1 : 0.95,
              }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className={cn("h-1 flex-1 rounded-full transition-colors", color)}
            />
          );
        })}
      </div>
      <motion.p
        initial={false}
        animate={{ opacity: score > 0 ? 1 : 0 }}
        className={cn(
          "text-[10px] font-mono tracking-wider uppercase",
          score === 0 && "text-gray-500",
          score === 1 && "text-red-500",
          score === 2 && "text-orange-500",
          score === 3 && "text-yellow-500",
          score === 4 && "text-green-500"
        )}
      >
        {label}
      </motion.p>
    </div>
  );
}
