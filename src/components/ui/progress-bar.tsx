"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface Step {
  label: string;
  description?: string;
}

interface ProgressBarProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function ProgressBar({ steps, currentStep, className }: ProgressBarProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={index} className="flex items-center flex-1 last:flex-none">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isCompleted ? "#dc2626" : isCurrent ? "#dc2626" : "transparent",
                  borderColor: isCompleted || isCurrent ? "#dc2626" : "hsl(var(--border))",
                }}
                className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors",
                  isCompleted && "bg-gx-red border-gx-red",
                  isCurrent && "border-gx-red bg-gx-red/20",
                  !isCompleted && !isCurrent && "border-border bg-transparent"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 text-white" />
                ) : (
                  <span className={cn(
                    "text-xs font-mono font-bold",
                    isCurrent ? "text-gx-red" : "text-muted-foreground"
                  )}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                )}
              </motion.div>
              <span className={cn(
                "text-[10px] font-mono tracking-wider mt-1.5 text-center whitespace-nowrap",
                isCurrent ? "text-gx-red" : isCompleted ? "text-foreground" : "text-muted-foreground/50"
              )}>
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 h-px relative">
                <div className="absolute inset-0 bg-border/50" />
                <motion.div
                  initial={false}
                  animate={{ width: isCompleted ? "100%" : "0%" }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-y-0 left-0 bg-gx-red"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
