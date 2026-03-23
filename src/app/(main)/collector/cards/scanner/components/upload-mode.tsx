"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";

interface UploadModeProps {
  onFile: (file: File) => void;
  isProcessing: boolean;
}

export function UploadMode({ onFile, isProcessing }: UploadModeProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      onFile(file);
    },
    [onFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="flex items-center justify-center h-full p-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`w-full max-w-md aspect-[3/4] rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-4 p-8 ${
          isDragging
            ? "border-gx-red bg-gx-red/5"
            : "border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]"
        } ${isProcessing ? "pointer-events-none opacity-50" : ""}`}
      >
        {isProcessing ? (
          <>
            <div className="w-10 h-10 border-2 border-gx-red border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-400">Processing card...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
              {isDragging ? (
                <ImageIcon className="h-7 w-7 text-gx-red" />
              ) : (
                <Upload className="h-7 w-7 text-zinc-500" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white">
                {isDragging ? "Drop your card image" : "Upload a card image"}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Drag and drop or click to browse
              </p>
              <p className="text-[10px] text-zinc-600 mt-2">
                JPEG, PNG, or WebP
              </p>
            </div>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
