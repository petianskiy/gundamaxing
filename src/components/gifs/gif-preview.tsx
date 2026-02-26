"use client";

import { X } from "lucide-react";

interface GifPreviewProps {
  gif: { url: string; previewUrl: string; width: number; height: number };
  onRemove: () => void;
}

export function GifPreview({ gif, onRemove }: GifPreviewProps) {
  return (
    <div className="relative inline-block max-w-[200px] rounded-lg border border-border/50 overflow-hidden mb-2">
      <img
        src={gif.url}
        alt="Selected GIF"
        className="w-full h-auto"
        style={{ aspectRatio: `${gif.width} / ${gif.height}` }}
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
        aria-label="Remove GIF"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
