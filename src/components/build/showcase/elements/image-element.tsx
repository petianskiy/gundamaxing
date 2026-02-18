"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ShowcaseImageElement } from "@/lib/types";

interface ImageElementProps {
  element: ShowcaseImageElement;
}

export function ImageElement({ element }: ImageElementProps) {
  return (
    <div className="relative w-full h-full">
      <Image
        src={element.imageUrl}
        alt={element.caption || "Build image"}
        fill
        className={cn(
          element.objectFit === "contain" ? "object-contain" : "object-cover"
        )}
        style={{ borderRadius: `${element.borderRadius}px` }}
        unoptimized
      />
      {element.shadow && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: `${element.borderRadius}px`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        />
      )}
      {element.caption && (
        <div
          className="absolute bottom-0 inset-x-0 px-3 py-2 bg-black/60 backdrop-blur-sm text-white text-xs text-center"
          style={{
            borderBottomLeftRadius: `${element.borderRadius}px`,
            borderBottomRightRadius: `${element.borderRadius}px`,
          }}
        >
          {element.caption}
        </div>
      )}
    </div>
  );
}
