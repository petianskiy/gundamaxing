"use client";

import { useState } from "react";
import { ImageOff, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GifDisplayProps {
  gif: { url: string; previewUrl: string | null; width: number; height: number; slug: string | null };
  onRemove?: () => void;
}

function isAllowedDomain(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "static.klipy.com";
  } catch {
    return false;
  }
}

export function GifDisplay({ gif, onRemove }: GifDisplayProps) {
  const [failed, setFailed] = useState(false);

  if (!isAllowedDomain(gif.url)) {
    return null;
  }

  if (failed) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-4 py-3 max-w-[320px]">
        <ImageOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-xs text-muted-foreground">GIF could not be loaded</span>
      </div>
    );
  }

  return (
    <div className="inline-block max-w-[320px]">
      <div className="relative rounded-lg overflow-hidden border border-border/30">
        <img
          src={gif.url}
          alt="GIF"
          className="w-full h-auto"
          style={{ aspectRatio: `${gif.width} / ${gif.height}` }}
          onError={() => setFailed(true)}
        />
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 text-white text-[10px] font-medium hover:bg-black/90 transition-colors"
          >
            <X className="h-3 w-3" />
            Remove GIF
          </button>
        )}
      </div>
      <p className="text-[9px] text-muted-foreground/50 mt-1">Powered by KLIPY</p>
    </div>
  );
}
