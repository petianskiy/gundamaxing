"use client";

import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";
import { ImageUploadButton } from "./image-upload-button";

const BUILT_IN_STAMPS = [
  { id: "soft-round", name: "Soft Round" },
  { id: "hard-round", name: "Hard Round" },
  { id: "charcoal", name: "Charcoal" },
  { id: "ink-splat", name: "Ink Splat" },
  { id: "watercolor-blob", name: "Watercolor Blob" },
  { id: "spray-dots", name: "Spray Dots" },
  { id: "bristle", name: "Bristle" },
  { id: "flat-brush", name: "Flat Brush" },
  { id: "fan-brush", name: "Fan Brush" },
  { id: "palette-knife", name: "Palette Knife" },
  { id: "sponge", name: "Sponge" },
  { id: "dry-brush", name: "Dry Brush" },
  { id: "stipple", name: "Stipple" },
  { id: "chalk", name: "Chalk" },
  { id: "marker", name: "Marker" },
  { id: "calligraphy-nib", name: "Calligraphy Nib" },
  { id: "noise-circle", name: "Noise Circle" },
  { id: "cloud", name: "Cloud" },
  { id: "grass", name: "Grass" },
  { id: "star-burst", name: "Star Burst" },
] as const;

interface StampPickerProps {
  value?: string;
  onChange: (stampUrl: string | undefined) => void;
}

export function StampPicker({ value, onChange }: StampPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {/* Procedural (no stamp) option */}
      <button
        onClick={() => onChange(undefined)}
        className={cn(
          "flex flex-col items-center gap-1 rounded-md border p-1 transition-colors",
          value === undefined
            ? "border-blue-500 ring-2 ring-blue-500 bg-blue-500/10"
            : "border-zinc-700 hover:bg-zinc-800"
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded bg-zinc-950">
          <Circle className="h-6 w-6 text-zinc-400" />
        </div>
        <span className="w-full truncate text-center text-[9px] text-zinc-500">
          Procedural
        </span>
      </button>

      {/* Built-in stamps */}
      {BUILT_IN_STAMPS.map((stamp) => {
        const stampUrl = `/brushes/stamps/${stamp.id}.png`;
        const isActive = value === stampUrl;

        return (
          <button
            key={stamp.id}
            onClick={() => onChange(stampUrl)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-md border p-1 transition-colors",
              isActive
                ? "border-blue-500 ring-2 ring-blue-500 bg-blue-500/10"
                : "border-zinc-700 hover:bg-zinc-800"
            )}
            title={stamp.name}
          >
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded bg-zinc-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stampUrl}
                alt={stamp.name}
                width={48}
                height={48}
                className="h-full w-full object-contain invert"
                draggable={false}
              />
            </div>
            <span
              className={cn(
                "w-full truncate text-center text-[9px]",
                isActive ? "text-blue-400" : "text-zinc-500"
              )}
            >
              {stamp.name}
            </span>
          </button>
        );
      })}

      {/* Upload custom stamp */}
      <ImageUploadButton label="Upload" onUpload={(dataUrl) => onChange(dataUrl)} />
    </div>
  );
}
