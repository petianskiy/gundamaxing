"use client";

import Image from "next/image";
import { X } from "lucide-react";
import type { BuildImage } from "@/lib/types";

interface ImagePickerPanelProps {
  images: BuildImage[];
  onSelect: (imageId: string, imageUrl: string) => void;
  onClose: () => void;
}

export function ImagePickerPanel({ images, onSelect, onClose }: ImagePickerPanelProps) {
  return (
    <div className="fixed top-20 right-4 z-40 w-72 max-h-[70vh] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <h3 className="text-sm font-semibold text-white">Build Images</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3 overflow-y-auto max-h-[calc(70vh-3rem)]">
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <button
              key={img.id || img.url}
              onClick={() => onSelect(img.id || img.url, img.url)}
              className="relative aspect-square rounded-lg overflow-hidden border border-zinc-700 hover:border-blue-500 transition-colors group"
            >
              <Image
                src={img.url}
                alt={img.alt || "Build image"}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
                unoptimized
              />
            </button>
          ))}
        </div>
        {images.length === 0 && (
          <p className="text-zinc-500 text-xs text-center py-8">No images uploaded yet</p>
        )}
      </div>
    </div>
  );
}
