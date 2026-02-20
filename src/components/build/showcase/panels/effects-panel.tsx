"use client";

import { X, Zap, Sparkles, Scan, Tv, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

interface EffectDefinition {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  effectType: string;
  defaults: Record<string, unknown>;
  available: boolean;
}

const EFFECTS_CATALOG: EffectDefinition[] = [
  {
    id: "electric",
    name: "Electric Border",
    icon: Zap,
    description: "Animated electric current effect around the border",
    effectType: "electric",
    defaults: { color: "#7df9ff", speed: 1, chaos: 0.12, borderRadius: 16 },
    available: true,
  },
  {
    id: "glow",
    name: "Glow Pulse",
    icon: Sparkles,
    description: "Pulsing glow effect with customizable color",
    effectType: "glow",
    defaults: {},
    available: false,
  },
  {
    id: "scanline",
    name: "Scanlines",
    icon: Scan,
    description: "Retro CRT scanline overlay effect",
    effectType: "scanline",
    defaults: {},
    available: false,
  },
  {
    id: "static-noise",
    name: "Static Noise",
    icon: Tv,
    description: "Animated TV static noise effect",
    effectType: "static-noise",
    defaults: {},
    available: false,
  },
  {
    id: "gradient-sweep",
    name: "Gradient Sweep",
    icon: Waves,
    description: "Animated gradient sweep across the element",
    effectType: "gradient-sweep",
    defaults: {},
    available: false,
  },
];

interface EffectsPanelProps {
  onAddEffect: (effectType: string, defaults: Record<string, unknown>) => void;
  onClose: () => void;
}

export function EffectsPanel({ onAddEffect, onClose }: EffectsPanelProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-20 sm:right-4 z-[500] w-full sm:w-72 bg-zinc-900 border-t sm:border border-zinc-700 sm:rounded-xl rounded-t-xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <h3 className="text-sm font-semibold text-white">Effects</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
        {EFFECTS_CATALOG.map((effect) => {
          const Icon = effect.icon;
          return (
            <button
              key={effect.id}
              onClick={() => {
                if (effect.available) {
                  onAddEffect(effect.effectType, effect.defaults);
                }
              }}
              disabled={!effect.available}
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded-lg border transition-colors text-left",
                effect.available
                  ? "border-zinc-700 hover:border-blue-500/50 hover:bg-zinc-800/50 cursor-pointer"
                  : "border-zinc-800 opacity-50 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                effect.available ? "bg-blue-500/10 text-blue-400" : "bg-zinc-800 text-zinc-600"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{effect.name}</span>
                  {!effect.available && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-medium">
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">{effect.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
