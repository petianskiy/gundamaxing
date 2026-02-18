"use client";

import Image from "next/image";
import { ShowcaseElement } from "./showcase-element";
import type { Build, ShowcaseLayout } from "@/lib/types";

interface ShowcaseCanvasProps {
  layout: ShowcaseLayout;
  build: Build;
}

export function ShowcaseCanvas({ layout, build }: ShowcaseCanvasProps) {
  const { canvas, elements } = layout;
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4 / 5" }}>
      {/* Background image */}
      {canvas.backgroundImageUrl && (
        <div className="absolute inset-0 z-0">
          <Image
            src={canvas.backgroundImageUrl}
            alt="Showcase background"
            fill
            className="object-cover"
            style={{
              opacity: canvas.backgroundOpacity,
              filter: canvas.backgroundBlur > 0 ? `blur(${canvas.backgroundBlur}px)` : undefined,
            }}
            unoptimized
          />
        </div>
      )}

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 z-[1] bg-black/20" />

      {/* Elements */}
      {sortedElements.map((element) => (
        <div
          key={element.id}
          className="absolute"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            width: `${element.width}%`,
            height: `${element.height}%`,
            zIndex: element.zIndex + 2,
            transform: element.rotation !== 0 ? `rotate(${element.rotation}deg)` : undefined,
          }}
        >
          <ShowcaseElement element={element} build={build} />
        </div>
      ))}

      {/* Empty state */}
      {elements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-zinc-500 text-sm">Empty showcase</p>
        </div>
      )}
    </div>
  );
}
