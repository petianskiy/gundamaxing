"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BuildImage } from "@/lib/types";

interface BackgroundPickerProps {
  images: BuildImage[];
  currentBackground: {
    backgroundImageUrl: string | null;
    backgroundOpacity: number;
    backgroundBlur: number;
  };
  onUpdate: (bg: {
    backgroundImageUrl: string | null;
    backgroundOpacity?: number;
    backgroundBlur?: number;
  }) => void;
  onClose: () => void;
}

export function BackgroundPicker({ images, currentBackground, onUpdate, onClose }: BackgroundPickerProps) {
  return (
    <div className="fixed top-20 right-4 z-40 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <h3 className="text-sm font-semibold text-white">Background</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4 space-y-4">
        {/* Image selection */}
        <div>
          <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">Image</label>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={() => onUpdate({ backgroundImageUrl: null })}
              className={cn(
                "aspect-square rounded-md border text-[10px] text-zinc-500 flex items-center justify-center",
                !currentBackground.backgroundImageUrl
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-zinc-700 hover:border-zinc-500"
              )}
            >
              None
            </button>
            {images.map((img) => (
              <button
                key={img.id || img.url}
                onClick={() => onUpdate({ backgroundImageUrl: img.url })}
                className={cn(
                  "relative aspect-square rounded-md overflow-hidden border transition-colors",
                  currentBackground.backgroundImageUrl === img.url
                    ? "border-blue-500"
                    : "border-zinc-700 hover:border-zinc-500"
                )}
              >
                <Image src={img.url} alt="" fill className="object-cover" unoptimized />
              </button>
            ))}
          </div>
        </div>

        {/* Opacity slider */}
        <div>
          <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 flex justify-between">
            <span>Opacity</span>
            <span className="text-zinc-500">{Math.round(currentBackground.backgroundOpacity * 100)}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(currentBackground.backgroundOpacity * 100)}
            onChange={(e) => onUpdate({ backgroundImageUrl: currentBackground.backgroundImageUrl, backgroundOpacity: parseInt(e.target.value) / 100 })}
            className="w-full accent-blue-500"
          />
        </div>

        {/* Blur slider */}
        <div>
          <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 flex justify-between">
            <span>Blur</span>
            <span className="text-zinc-500">{currentBackground.backgroundBlur}px</span>
          </label>
          <input
            type="range"
            min="0"
            max="20"
            value={currentBackground.backgroundBlur}
            onChange={(e) => onUpdate({ backgroundImageUrl: currentBackground.backgroundImageUrl, backgroundBlur: parseInt(e.target.value) })}
            className="w-full accent-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
