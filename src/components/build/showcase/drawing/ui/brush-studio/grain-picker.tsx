"use client";

import { cn } from "@/lib/utils";
import { Ban } from "lucide-react";
import { ImageUploadButton } from "./image-upload-button";

const BUILT_IN_GRAINS = [
  { id: "paper", name: "Paper" },
  { id: "canvas-weave", name: "Canvas" },
  { id: "watercolor-paper", name: "Watercolor" },
  { id: "rough", name: "Rough" },
  { id: "linen", name: "Linen" },
  { id: "concrete", name: "Concrete" },
  { id: "noise", name: "Noise" },
  { id: "dots", name: "Dots" },
  { id: "waterpaper-1", name: "Waterpaper 1" },
  { id: "waterpaper-2", name: "Waterpaper 2" },
  { id: "waterpaper-3", name: "Waterpaper 3" },
] as const;

interface GrainPickerProps {
  value?: string;
  onChange: (grainUrl: string | undefined) => void;
}

export function GrainPicker({ value, onChange }: GrainPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {/* None (no grain) option */}
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
          <Ban className="h-6 w-6 text-zinc-400" />
        </div>
        <span className="w-full truncate text-center text-[9px] text-zinc-500">
          None
        </span>
      </button>

      {/* Built-in grains */}
      {BUILT_IN_GRAINS.map((grain) => {
        const grainUrl = `/brushes/grains/${grain.id}.png`;
        const isActive = value === grainUrl;

        return (
          <button
            key={grain.id}
            onClick={() => onChange(grainUrl)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-md border p-1 transition-colors",
              isActive
                ? "border-blue-500 ring-2 ring-blue-500 bg-blue-500/10"
                : "border-zinc-700 hover:bg-zinc-800"
            )}
            title={grain.name}
          >
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded bg-zinc-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={grainUrl}
                alt={grain.name}
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
              {grain.name}
            </span>
          </button>
        );
      })}

      {/* Upload custom grain */}
      <ImageUploadButton label="Upload" onUpload={(dataUrl) => onChange(dataUrl)} />
    </div>
  );
}
