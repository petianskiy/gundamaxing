"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadButtonProps {
  label: string;
  onUpload: (dataUrl: string) => void;
  className?: string;
}

const MAX_SIZE = 256;

export function ImageUploadButton({ label, onUpload, className }: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Resize to max 256x256 preserving aspect ratio
        let w = img.width;
        let h = img.height;
        if (w > MAX_SIZE || h > MAX_SIZE) {
          const scale = MAX_SIZE / Math.max(w, h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        onUpload(canvas.toDataURL("image/png"));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  return (
    <button
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex flex-col items-center gap-1 rounded-md border border-dashed border-zinc-600 p-1 transition-colors hover:bg-zinc-800 hover:border-zinc-500",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded bg-zinc-950">
        <Upload className="h-5 w-5 text-zinc-500" />
      </div>
      <span className="w-full truncate text-center text-[9px] text-zinc-500">
        {label}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </button>
  );
}
