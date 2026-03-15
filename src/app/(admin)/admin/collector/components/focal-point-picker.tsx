"use client";

import { useRef } from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { Crosshair } from "lucide-react";

interface FocalPointPickerProps {
  imageUrl: string | null;
  focalX: number;
  focalY: number;
  onChange: (x: number, y: number) => void;
}

export function FocalPointPicker({ imageUrl, focalX, focalY, onChange }: FocalPointPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    onChange(Math.round(x * 100) / 100, Math.round(y * 100) / 100);
  }

  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center h-48 rounded-lg border border-dashed border-border/50 bg-muted/20 text-muted-foreground text-sm">
        Upload an image to set focal point
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        onClick={handleClick}
        className="relative w-full aspect-square max-w-[300px] rounded-lg overflow-hidden border border-border/50 cursor-crosshair"
      >
        <Image
          src={imageUrl}
          alt="Kit image"
          fill
          className="object-cover"
          sizes="300px"
        />
        {/* Focal point indicator */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${focalX * 100}%`,
            top: `${focalY * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="relative">
            <Crosshair className="h-8 w-8 text-gx-red drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-gx-red shadow-lg" />
            </div>
          </div>
        </div>
        {/* Crosshair lines */}
        <div
          className="absolute top-0 bottom-0 w-px bg-gx-red/40 pointer-events-none"
          style={{ left: `${focalX * 100}%` }}
        />
        <div
          className="absolute left-0 right-0 h-px bg-gx-red/40 pointer-events-none"
          style={{ top: `${focalY * 100}%` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        Click to set focal point ({Math.round(focalX * 100)}%, {Math.round(focalY * 100)}%)
      </p>
    </div>
  );
}
