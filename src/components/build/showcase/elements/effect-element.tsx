"use client";

import ElectricBorder from "@/components/ui/electric-border";
import type { ShowcaseEffectElement } from "@/lib/types";

interface EffectElementProps {
  element: ShowcaseEffectElement;
}

export function EffectElement({ element }: EffectElementProps) {
  if (element.effectType === "electric") {
    return (
      <ElectricBorder
        color={element.color}
        speed={element.speed}
        chaos={element.chaos}
        borderRadius={element.borderRadius}
        className="w-full h-full"
      >
        <div className="w-full h-full" />
      </ElectricBorder>
    );
  }

  return null;
}
