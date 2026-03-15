"use client";

import { useState } from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShowcaseImageElement } from "@/lib/types";
import { ImageLightbox } from "./image-lightbox";

interface ImageElementProps {
  element: ShowcaseImageElement;
}

export function ImageElement({ element }: ImageElementProps) {
  const [showLightbox, setShowLightbox] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Scale border-radius with canvas width using cqi (reference: 1000px = 100cqi)
  const radius = `${element.borderRadius / 10}cqi`;
  const flipTransform = (element.flipH || element.flipV)
    ? `scaleX(${element.flipH ? -1 : 1}) scaleY(${element.flipV ? -1 : 1})`
    : undefined;

  const hasValidUrl = !!element.imageUrl;

  return (
    <>
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          borderRadius: radius,
          background: "transparent",
          cursor: element.interactive ? "zoom-in" : undefined,
        }}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onClick={element.interactive ? () => setShowLightbox(true) : undefined}
      >
        {hasValidUrl && !imgError ? (
          <Image
            src={retryCount > 0 ? `${element.imageUrl}${element.imageUrl.includes("?") ? "&" : "?"}r=${retryCount}` : element.imageUrl}
            alt={element.caption || "Build image"}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            draggable={false}
            className={cn(
              element.objectFit === "contain" ? "object-contain" : "object-cover"
            )}
            style={{ borderRadius: radius, transform: flipTransform }}
            onError={() => {
              if (retryCount < 2) {
                setTimeout(() => setRetryCount((c) => c + 1), 1500);
              } else {
                setImgError(true);
              }
            }}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center bg-zinc-800/80"
            style={{ borderRadius: radius }}
          >
            <ImageIcon className="h-8 w-8 text-zinc-500" />
            <span className="text-zinc-500 text-xs mt-1">No image</span>
          </div>
        )}
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
      {showLightbox && (
        <ImageLightbox
          imageUrl={element.imageUrl}
          alt={element.caption || "Build image"}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </>
  );
}
