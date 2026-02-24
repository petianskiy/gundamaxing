"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ShowcaseImageElement } from "@/lib/types";

interface ImageElementProps {
  element: ShowcaseImageElement;
}

export function ImageElement({ element }: ImageElementProps) {
  // Scale border-radius with canvas width using cqi (reference: 1000px = 100cqi)
  const radius = `${element.borderRadius / 10}cqi`;
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ borderRadius: radius, background: "transparent" }}
    >
      <Image
        src={element.imageUrl}
        alt={element.caption || "Build image"}
        fill
        className={cn(
          element.objectFit === "contain" ? "object-contain" : "object-cover"
        )}
        style={{ borderRadius: radius }}
        unoptimized
      />
      {element.shadow && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: radius,
            boxShadow: `0 ${0.8}cqi ${3.2}cqi rgba(0,0,0,0.4)`,
          }}
        />
      )}
      {element.caption && (
        <div
          className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm text-white text-center"
          style={{
            padding: `${0.8}cqi ${1.2}cqi`,
            fontSize: `${1.2}cqi`,
            borderBottomLeftRadius: radius,
            borderBottomRightRadius: radius,
          }}
        >
          {element.caption}
        </div>
      )}
    </div>
  );
}
