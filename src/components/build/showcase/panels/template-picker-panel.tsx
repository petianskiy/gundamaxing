"use client";

import { useRef, useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BuildImage, ShowcaseElement, ShowcaseImageElement, ShowcaseTextElement, ShowcaseMetadataElement } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LayoutTemplate {
  id: string;
  name: string;
  category: string;
  imageCount: number;
  generate: (buildImages: BuildImage[]) => ShowcaseElement[];
  previewRects: { x: number; y: number; w: number; h: number; type: "image" | "text" | "meta" }[];
  /** Optional custom SVG lines for diagonal/creative templates */
  previewLines?: { x1: number; y1: number; x2: number; y2: number }[];
  /** Optional custom SVG polygons for diagonal/creative templates */
  previewPolygons?: { points: string }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function makeImageElement(
  imageId: string,
  imageUrl: string,
  x: number,
  y: number,
  width: number,
  height: number,
  zIndex: number,
): ShowcaseImageElement {
  return {
    id: generateId(),
    type: "image",
    x, y, width, height,
    zIndex,
    rotation: 0,
    imageId,
    imageUrl,
    objectFit: "cover",
    borderRadius: 8,
    shadow: true,
    caption: null,
  };
}

function makeTextElement(
  content: string,
  x: number,
  y: number,
  width: number,
  height: number,
  zIndex: number,
  fontSize: number = 24,
): ShowcaseTextElement {
  return {
    id: generateId(),
    type: "text",
    x, y, width, height,
    zIndex,
    rotation: 0,
    content,
    fontSize,
    fontFamily: "geist",
    color: "#fafafa",
    textAlign: "center",
    backgroundColor: null,
    bold: true,
    italic: false,
    underline: false,
    strikethrough: false,
    gradient: false,
    gradientColors: ["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"],
    gradientSpeed: 2,
    fuzzy: false,
    fuzzyIntensity: 0.18,
    fuzzyHoverIntensity: 0.5,
    fuzzyFuzzRange: 0.08,
    fuzzyDirection: "horizontal",
    fuzzyTransitionDuration: 0.15,
    fuzzyLetterSpacing: 0,
    fuzzyEnableHover: true,
    fuzzyClickEffect: false,
    fuzzyGlitchMode: false,
    fuzzyGlitchInterval: 5,
    fuzzyGlitchDuration: 0.3,
  };
}

function makeMetadataElement(
  x: number,
  y: number,
  width: number,
  height: number,
  zIndex: number,
  variant: "compact" | "full" = "compact",
): ShowcaseMetadataElement {
  return {
    id: generateId(),
    type: "metadata",
    x, y, width, height,
    zIndex,
    rotation: 0,
    variant,
  };
}

function getImage(images: BuildImage[], index: number): { id: string; url: string } | null {
  if (images.length === 0) return null;
  const img = images[index % images.length];
  if (!img.url) return null;
  return { id: img.id || img.url, url: img.url };
}

/** Helper to build image-only templates from slot arrays */
function generateFromSlots(
  images: BuildImage[],
  slots: [number, number, number, number][],
): ShowcaseElement[] {
  return slots
    .map(([x, y, w, h], i) => {
      const img = getImage(images, i);
      return img ? makeImageElement(img.id, img.url, x, y, w, h, i + 1) : null;
    })
    .filter((el): el is ShowcaseImageElement => el !== null);
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const CATEGORIES = ["Basic", "Magazine", "Creative", "Multi", "Mosaic", "Diagonal", "With Text", "Custom"] as const;

// ---------------------------------------------------------------------------
// BASIC templates (10)
// ---------------------------------------------------------------------------

const BASIC_TEMPLATES: LayoutTemplate[] = [
  {
    id: "basic-single",
    name: "Single Frame",
    category: "Basic",
    imageCount: 1,
    previewRects: [{ x: 5, y: 5, w: 90, h: 90, type: "image" }],
    generate: (images) => generateFromSlots(images, [[5, 5, 90, 90]]),
  },
  {
    id: "basic-2v",
    name: "2 Vertical",
    category: "Basic",
    imageCount: 2,
    previewRects: [
      { x: 2, y: 5, w: 47, h: 90, type: "image" },
      { x: 51, y: 5, w: 47, h: 90, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 5, 47, 90], [51, 5, 47, 90]]),
  },
  {
    id: "basic-2h",
    name: "2 Horizontal",
    category: "Basic",
    imageCount: 2,
    previewRects: [
      { x: 5, y: 2, w: 90, h: 47, type: "image" },
      { x: 5, y: 51, w: 90, h: 47, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[5, 2, 90, 47], [5, 51, 90, 47]]),
  },
  {
    id: "basic-2-large-left",
    name: "Large Left",
    category: "Basic",
    imageCount: 2,
    previewRects: [
      { x: 2, y: 5, w: 62, h: 90, type: "image" },
      { x: 66, y: 5, w: 32, h: 90, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 5, 62, 90], [66, 5, 32, 90]]),
  },
  {
    id: "basic-2-large-top",
    name: "Large Top",
    category: "Basic",
    imageCount: 2,
    previewRects: [
      { x: 5, y: 2, w: 90, h: 62, type: "image" },
      { x: 5, y: 66, w: 90, h: 32, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[5, 2, 90, 62], [5, 66, 90, 32]]),
  },
  {
    id: "basic-2x2",
    name: "2x2 Grid",
    category: "Basic",
    imageCount: 4,
    previewRects: [
      { x: 2, y: 2, w: 47, h: 47, type: "image" },
      { x: 51, y: 2, w: 47, h: 47, type: "image" },
      { x: 2, y: 51, w: 47, h: 47, type: "image" },
      { x: 51, y: 51, w: 47, h: 47, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 47, 47], [51, 2, 47, 47], [2, 51, 47, 47], [51, 51, 47, 47]]),
  },
  {
    id: "basic-1top-2bottom",
    name: "1 Top + 2 Bottom",
    category: "Basic",
    imageCount: 3,
    previewRects: [
      { x: 2, y: 2, w: 96, h: 50, type: "image" },
      { x: 2, y: 54, w: 47, h: 44, type: "image" },
      { x: 51, y: 54, w: 47, h: 44, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 96, 50], [2, 54, 47, 44], [51, 54, 47, 44]]),
  },
  {
    id: "basic-2top-1bottom",
    name: "2 Top + 1 Bottom",
    category: "Basic",
    imageCount: 3,
    previewRects: [
      { x: 2, y: 2, w: 47, h: 44, type: "image" },
      { x: 51, y: 2, w: 47, h: 44, type: "image" },
      { x: 2, y: 48, w: 96, h: 50, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 47, 44], [51, 2, 47, 44], [2, 48, 96, 50]]),
  },
  {
    id: "basic-1left-2right",
    name: "1 Left + 2 Right",
    category: "Basic",
    imageCount: 3,
    previewRects: [
      { x: 2, y: 2, w: 58, h: 96, type: "image" },
      { x: 62, y: 2, w: 36, h: 47, type: "image" },
      { x: 62, y: 51, w: 36, h: 47, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 58, 96], [62, 2, 36, 47], [62, 51, 36, 47]]),
  },
  {
    id: "basic-2left-1right",
    name: "2 Left + 1 Right",
    category: "Basic",
    imageCount: 3,
    previewRects: [
      { x: 2, y: 2, w: 36, h: 47, type: "image" },
      { x: 2, y: 51, w: 36, h: 47, type: "image" },
      { x: 40, y: 2, w: 58, h: 96, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 36, 47], [2, 51, 36, 47], [40, 2, 58, 96]]),
  },
  // --- New Basic templates ---
  {
    id: "basic-3h",
    name: "3 Horizontal",
    category: "Basic",
    imageCount: 3,
    previewRects: [
      { x: 5, y: 2, w: 90, h: 30, type: "image" },
      { x: 5, y: 35, w: 90, h: 30, type: "image" },
      { x: 5, y: 68, w: 90, h: 30, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[5, 2, 90, 30], [5, 35, 90, 30], [5, 68, 90, 30]]),
  },
  {
    id: "basic-3v",
    name: "3 Vertical",
    category: "Basic",
    imageCount: 3,
    previewRects: [
      { x: 2, y: 5, w: 30, h: 90, type: "image" },
      { x: 35, y: 5, w: 30, h: 90, type: "image" },
      { x: 68, y: 5, w: 30, h: 90, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 5, 30, 90], [35, 5, 30, 90], [68, 5, 30, 90]]),
  },
  {
    id: "basic-4h",
    name: "4 Horizontal Strips",
    category: "Basic",
    imageCount: 4,
    previewRects: [
      { x: 3, y: 2, w: 94, h: 22, type: "image" },
      { x: 3, y: 27, w: 94, h: 22, type: "image" },
      { x: 3, y: 52, w: 94, h: 22, type: "image" },
      { x: 3, y: 76, w: 94, h: 22, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[3, 2, 94, 22], [3, 27, 94, 22], [3, 52, 94, 22], [3, 76, 94, 22]]),
  },
  {
    id: "basic-4v",
    name: "4 Vertical Strips",
    category: "Basic",
    imageCount: 4,
    previewRects: [
      { x: 2, y: 3, w: 22, h: 94, type: "image" },
      { x: 27, y: 3, w: 22, h: 94, type: "image" },
      { x: 52, y: 3, w: 22, h: 94, type: "image" },
      { x: 76, y: 3, w: 22, h: 94, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 3, 22, 94], [27, 3, 22, 94], [52, 3, 22, 94], [76, 3, 22, 94]]),
  },
  {
    id: "basic-5h",
    name: "5 Horizontal Strips",
    category: "Basic",
    imageCount: 5,
    previewRects: [
      { x: 3, y: 2, w: 94, h: 17, type: "image" },
      { x: 3, y: 22, w: 94, h: 17, type: "image" },
      { x: 3, y: 42, w: 94, h: 17, type: "image" },
      { x: 3, y: 61, w: 94, h: 17, type: "image" },
      { x: 3, y: 81, w: 94, h: 17, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[3, 2, 94, 17], [3, 22, 94, 17], [3, 42, 94, 17], [3, 61, 94, 17], [3, 81, 94, 17]]),
  },
  {
    id: "basic-5v",
    name: "5 Vertical Strips",
    category: "Basic",
    imageCount: 5,
    previewRects: [
      { x: 2, y: 3, w: 17, h: 94, type: "image" },
      { x: 22, y: 3, w: 17, h: 94, type: "image" },
      { x: 42, y: 3, w: 17, h: 94, type: "image" },
      { x: 61, y: 3, w: 17, h: 94, type: "image" },
      { x: 81, y: 3, w: 17, h: 94, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 3, 17, 94], [22, 3, 17, 94], [42, 3, 17, 94], [61, 3, 17, 94], [81, 3, 17, 94]]),
  },
  {
    id: "basic-2-large-right",
    name: "Large Right",
    category: "Basic",
    imageCount: 2,
    previewRects: [
      { x: 2, y: 5, w: 32, h: 90, type: "image" },
      { x: 36, y: 5, w: 62, h: 90, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 5, 32, 90], [36, 5, 62, 90]]),
  },
  {
    id: "basic-2-large-bottom",
    name: "Large Bottom",
    category: "Basic",
    imageCount: 2,
    previewRects: [
      { x: 5, y: 2, w: 90, h: 32, type: "image" },
      { x: 5, y: 36, w: 90, h: 62, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[5, 2, 90, 32], [5, 36, 90, 62]]),
  },
];

// ---------------------------------------------------------------------------
// MAGAZINE templates (6)
// ---------------------------------------------------------------------------

const MAGAZINE_TEMPLATES: LayoutTemplate[] = [
  {
    id: "mag-hero-2",
    name: "Hero + 2 Bottom",
    category: "Magazine",
    imageCount: 3,
    previewRects: [
      { x: 2, y: 2, w: 96, h: 55, type: "image" },
      { x: 2, y: 59, w: 47, h: 39, type: "image" },
      { x: 51, y: 59, w: 47, h: 39, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 96, 55], [2, 59, 47, 39], [51, 59, 47, 39]]),
  },
  {
    id: "mag-tall-left",
    name: "Tall Left + 3 Right",
    category: "Magazine",
    imageCount: 4,
    previewRects: [
      { x: 2, y: 2, w: 55, h: 96, type: "image" },
      { x: 59, y: 2, w: 39, h: 30, type: "image" },
      { x: 59, y: 34, w: 39, h: 30, type: "image" },
      { x: 59, y: 66, w: 39, h: 32, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 55, 96], [59, 2, 39, 30], [59, 34, 39, 30], [59, 66, 39, 32]]),
  },
  {
    id: "mag-wide-3col",
    name: "Wide Top + 3 Columns",
    category: "Magazine",
    imageCount: 4,
    previewRects: [
      { x: 2, y: 2, w: 96, h: 48, type: "image" },
      { x: 2, y: 52, w: 31, h: 46, type: "image" },
      { x: 35, y: 52, w: 31, h: 46, type: "image" },
      { x: 67, y: 52, w: 31, h: 46, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 96, 48], [2, 52, 31, 46], [35, 52, 31, 46], [67, 52, 31, 46]]),
  },
  {
    id: "mag-editorial-5",
    name: "Editorial 5",
    category: "Magazine",
    imageCount: 5,
    previewRects: [
      { x: 2, y: 2, w: 55, h: 48, type: "image" },
      { x: 59, y: 2, w: 39, h: 48, type: "image" },
      { x: 2, y: 52, w: 31, h: 46, type: "image" },
      { x: 35, y: 52, w: 31, h: 46, type: "image" },
      { x: 67, y: 52, w: 31, h: 46, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 55, 48], [59, 2, 39, 48], [2, 52, 31, 46], [35, 52, 31, 46], [67, 52, 31, 46]]),
  },
  {
    id: "mag-center-corners",
    name: "Center + 4 Corners",
    category: "Magazine",
    imageCount: 5,
    previewRects: [
      { x: 22, y: 22, w: 56, h: 56, type: "image" },
      { x: 2, y: 2, w: 18, h: 18, type: "image" },
      { x: 80, y: 2, w: 18, h: 18, type: "image" },
      { x: 2, y: 80, w: 18, h: 18, type: "image" },
      { x: 80, y: 80, w: 18, h: 18, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[22, 22, 56, 56], [2, 2, 18, 18], [80, 2, 18, 18], [2, 80, 18, 18], [80, 80, 18, 18]]),
  },
  {
    id: "mag-banner-grid",
    name: "Banner + 2x2",
    category: "Magazine",
    imageCount: 5,
    previewRects: [
      { x: 2, y: 2, w: 96, h: 35, type: "image" },
      { x: 2, y: 39, w: 47, h: 29, type: "image" },
      { x: 51, y: 39, w: 47, h: 29, type: "image" },
      { x: 2, y: 70, w: 47, h: 28, type: "image" },
      { x: 51, y: 70, w: 47, h: 28, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 96, 35], [2, 39, 47, 29], [51, 39, 47, 29], [2, 70, 47, 28], [51, 70, 47, 28]]),
  },
  // --- New Magazine templates ---
  {
    id: "mag-tall-right",
    name: "3 Left + Tall Right",
    category: "Magazine",
    imageCount: 4,
    previewRects: [
      { x: 2, y: 2, w: 39, h: 30, type: "image" },
      { x: 2, y: 34, w: 39, h: 30, type: "image" },
      { x: 2, y: 66, w: 39, h: 32, type: "image" },
      { x: 43, y: 2, w: 55, h: 96, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 39, 30], [2, 34, 39, 30], [2, 66, 39, 32], [43, 2, 55, 96]]),
  },
  {
    id: "mag-3col-wide-bottom",
    name: "3 Columns + Wide Bottom",
    category: "Magazine",
    imageCount: 4,
    previewRects: [
      { x: 2, y: 2, w: 31, h: 46, type: "image" },
      { x: 35, y: 2, w: 31, h: 46, type: "image" },
      { x: 67, y: 2, w: 31, h: 46, type: "image" },
      { x: 2, y: 52, w: 96, h: 46, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 31, 46], [35, 2, 31, 46], [67, 2, 31, 46], [2, 52, 96, 46]]),
  },
  {
    id: "mag-pyramid",
    name: "Pyramid",
    category: "Magazine",
    imageCount: 6,
    previewRects: [
      { x: 25, y: 2, w: 50, h: 30, type: "image" },
      { x: 2, y: 35, w: 31, h: 30, type: "image" },
      { x: 35, y: 35, w: 31, h: 30, type: "image" },
      { x: 67, y: 35, w: 31, h: 30, type: "image" },
      { x: 2, y: 68, w: 47, h: 30, type: "image" },
      { x: 51, y: 68, w: 47, h: 30, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[25, 2, 50, 30], [2, 35, 31, 30], [35, 35, 31, 30], [67, 35, 31, 30], [2, 68, 47, 30], [51, 68, 47, 30]]),
  },
  {
    id: "mag-t-shape",
    name: "T-Shape",
    category: "Magazine",
    imageCount: 4,
    previewRects: [
      { x: 2, y: 2, w: 96, h: 40, type: "image" },
      { x: 2, y: 44, w: 47, h: 27, type: "image" },
      { x: 51, y: 44, w: 47, h: 27, type: "image" },
      { x: 25, y: 73, w: 50, h: 25, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 96, 40], [2, 44, 47, 27], [51, 44, 47, 27], [25, 73, 50, 25]]),
  },
  {
    id: "mag-inverted-t",
    name: "Inverted T",
    category: "Magazine",
    imageCount: 4,
    previewRects: [
      { x: 2, y: 2, w: 40, h: 96, type: "image" },
      { x: 44, y: 2, w: 54, h: 47, type: "image" },
      { x: 44, y: 51, w: 27, h: 47, type: "image" },
      { x: 73, y: 51, w: 25, h: 47, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 40, 96], [44, 2, 54, 47], [44, 51, 27, 47], [73, 51, 25, 47]]),
  },
];

// ---------------------------------------------------------------------------
// CREATIVE templates (6 original + new)
// ---------------------------------------------------------------------------

const CREATIVE_TEMPLATES: LayoutTemplate[] = [
  {
    id: "creative-cross",
    name: "Cross",
    category: "Creative",
    imageCount: 4,
    previewRects: [
      { x: 27, y: 2, w: 46, h: 30, type: "image" },
      { x: 2, y: 35, w: 46, h: 30, type: "image" },
      { x: 52, y: 35, w: 46, h: 30, type: "image" },
      { x: 27, y: 68, w: 46, h: 30, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[27, 2, 46, 30], [2, 35, 46, 30], [52, 35, 46, 30], [27, 68, 46, 30]]),
  },
  {
    id: "creative-diamond",
    name: "Diamond + Corners",
    category: "Creative",
    imageCount: 5,
    previewRects: [
      { x: 30, y: 30, w: 40, h: 40, type: "image" },
      { x: 2, y: 2, w: 25, h: 25, type: "image" },
      { x: 73, y: 2, w: 25, h: 25, type: "image" },
      { x: 2, y: 73, w: 25, h: 25, type: "image" },
      { x: 73, y: 73, w: 25, h: 25, type: "image" },
    ],
    generate: (images) => {
      const els: ShowcaseElement[] = [];
      const img0 = getImage(images, 0);
      if (img0) {
        const el = makeImageElement(img0.id, img0.url, 22, 22, 56, 56, 1);
        el.rotation = 45;
        els.push(el);
      }
      const corners: [number, number, number, number][] = [[2, 2, 25, 25], [73, 2, 25, 25], [2, 73, 25, 25], [73, 73, 25, 25]];
      corners.forEach(([x, y, w, h], i) => {
        const img = getImage(images, i + 1);
        if (img) els.push(makeImageElement(img.id, img.url, x, y, w, h, i + 2));
      });
      return els;
    },
  },
  {
    id: "creative-frame",
    name: "Frame in Frame",
    category: "Creative",
    imageCount: 5,
    previewRects: [
      { x: 20, y: 20, w: 60, h: 60, type: "image" },
      { x: 2, y: 2, w: 96, h: 15, type: "image" },
      { x: 2, y: 83, w: 96, h: 15, type: "image" },
      { x: 2, y: 19, w: 15, h: 62, type: "image" },
      { x: 83, y: 19, w: 15, h: 62, type: "image" },
    ],
    generate: (images) => {
      const els: ShowcaseElement[] = [];
      const center = getImage(images, 0);
      if (center) els.push(makeImageElement(center.id, center.url, 20, 20, 60, 60, 5));
      const borders: [number, number, number, number][] = [[2, 2, 96, 15], [2, 83, 96, 15], [2, 19, 15, 62], [83, 19, 15, 62]];
      borders.forEach(([x, y, w, h], i) => {
        const img = getImage(images, i + 1);
        if (img) els.push(makeImageElement(img.id, img.url, x, y, w, h, i + 1));
      });
      return els;
    },
  },
  {
    id: "creative-l-shape",
    name: "L-Shape",
    category: "Creative",
    imageCount: 3,
    previewRects: [
      { x: 2, y: 2, w: 70, h: 70, type: "image" },
      { x: 74, y: 2, w: 24, h: 70, type: "image" },
      { x: 2, y: 74, w: 96, h: 24, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 70, 70], [74, 2, 24, 70], [2, 74, 96, 24]]),
  },
  {
    id: "creative-staircase",
    name: "Staircase",
    category: "Creative",
    imageCount: 3,
    previewRects: [
      { x: 2, y: 2, w: 40, h: 55, type: "image" },
      { x: 30, y: 22, w: 40, h: 55, type: "image" },
      { x: 58, y: 42, w: 40, h: 55, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 40, 55], [30, 22, 40, 55], [58, 42, 40, 55]]),
  },
  {
    id: "creative-filmstrip",
    name: "Filmstrip",
    category: "Creative",
    imageCount: 4,
    previewRects: [
      { x: 5, y: 4, w: 90, h: 20, type: "image" },
      { x: 5, y: 27, w: 90, h: 20, type: "image" },
      { x: 5, y: 50, w: 90, h: 20, type: "image" },
      { x: 5, y: 73, w: 90, h: 20, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[5, 4, 90, 20], [5, 27, 90, 20], [5, 50, 90, 20], [5, 73, 90, 20]]),
  },
  // --- New Creative templates ---
  {
    id: "creative-plus",
    name: "Plus / Cross",
    category: "Creative",
    imageCount: 5,
    previewRects: [
      { x: 30, y: 30, w: 40, h: 40, type: "image" },
      { x: 30, y: 2, w: 40, h: 25, type: "image" },
      { x: 30, y: 73, w: 40, h: 25, type: "image" },
      { x: 2, y: 30, w: 25, h: 40, type: "image" },
      { x: 73, y: 30, w: 25, h: 40, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[30, 30, 40, 40], [30, 2, 40, 25], [30, 73, 40, 25], [2, 30, 25, 40], [73, 30, 25, 40]]),
  },
  {
    id: "creative-h-shape",
    name: "H-Shape",
    category: "Creative",
    imageCount: 5,
    previewRects: [
      { x: 2, y: 2, w: 25, h: 96, type: "image" },
      { x: 30, y: 35, w: 40, h: 30, type: "image" },
      { x: 73, y: 2, w: 25, h: 96, type: "image" },
      { x: 30, y: 2, w: 40, h: 30, type: "image" },
      { x: 30, y: 68, w: 40, h: 30, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 25, 96], [30, 35, 40, 30], [73, 2, 25, 96], [30, 2, 40, 30], [30, 68, 40, 30]]),
  },
  {
    id: "creative-zigzag",
    name: "Zigzag",
    category: "Creative",
    imageCount: 6,
    previewRects: [
      { x: 2, y: 2, w: 60, h: 15, type: "image" },
      { x: 38, y: 20, w: 60, h: 15, type: "image" },
      { x: 2, y: 37, w: 60, h: 15, type: "image" },
      { x: 38, y: 54, w: 60, h: 15, type: "image" },
      { x: 2, y: 71, w: 60, h: 13, type: "image" },
      { x: 38, y: 85, w: 60, h: 13, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 60, 15], [38, 20, 60, 15], [2, 37, 60, 15], [38, 54, 60, 15], [2, 71, 60, 13], [38, 85, 60, 13]]),
  },
  {
    id: "creative-cascade",
    name: "Cascade",
    category: "Creative",
    imageCount: 4,
    previewRects: [
      { x: 2, y: 2, w: 50, h: 50, type: "image" },
      { x: 15, y: 15, w: 50, h: 50, type: "image" },
      { x: 28, y: 28, w: 50, h: 50, type: "image" },
      { x: 42, y: 42, w: 55, h: 55, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 50, 50], [15, 15, 50, 50], [28, 28, 50, 50], [42, 42, 55, 55]]),
  },
  {
    id: "creative-spotlight",
    name: "Spotlight",
    category: "Creative",
    imageCount: 3,
    previewRects: [
      { x: 15, y: 10, w: 70, h: 70, type: "image" },
      { x: 2, y: 75, w: 30, h: 23, type: "image" },
      { x: 68, y: 75, w: 30, h: 23, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[15, 10, 70, 70], [2, 75, 30, 23], [68, 75, 30, 23]]),
  },
  {
    id: "creative-corner-cut",
    name: "Corner Cut",
    category: "Creative",
    imageCount: 2,
    previewRects: [
      { x: 2, y: 2, w: 96, h: 96, type: "image" },
      { x: 60, y: 60, w: 38, h: 38, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 96, 96], [60, 60, 38, 38]]),
  },
  {
    id: "creative-nested-frames",
    name: "Nested Frames",
    category: "Creative",
    imageCount: 3,
    previewRects: [
      { x: 2, y: 2, w: 96, h: 96, type: "image" },
      { x: 15, y: 15, w: 70, h: 70, type: "image" },
      { x: 30, y: 30, w: 40, h: 40, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 96, 96], [15, 15, 70, 70], [30, 30, 40, 40]]),
  },
];

// ---------------------------------------------------------------------------
// MULTI templates (6 original + new)
// ---------------------------------------------------------------------------

const MULTI_TEMPLATES: LayoutTemplate[] = [
  {
    id: "multi-2x3",
    name: "2x3 Grid",
    category: "Multi",
    imageCount: 6,
    previewRects: [
      { x: 2, y: 2, w: 47, h: 30, type: "image" },
      { x: 51, y: 2, w: 47, h: 30, type: "image" },
      { x: 2, y: 35, w: 47, h: 30, type: "image" },
      { x: 51, y: 35, w: 47, h: 30, type: "image" },
      { x: 2, y: 68, w: 47, h: 30, type: "image" },
      { x: 51, y: 68, w: 47, h: 30, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [
      [2, 2, 47, 30], [51, 2, 47, 30],
      [2, 35, 47, 30], [51, 35, 47, 30],
      [2, 68, 47, 30], [51, 68, 47, 30],
    ]),
  },
  {
    id: "multi-1large-5small",
    name: "1 Large + 5 Small",
    category: "Multi",
    imageCount: 6,
    previewRects: [
      { x: 2, y: 2, w: 64, h: 64, type: "image" },
      { x: 68, y: 2, w: 30, h: 30, type: "image" },
      { x: 68, y: 34, w: 30, h: 32, type: "image" },
      { x: 2, y: 68, w: 21, h: 30, type: "image" },
      { x: 25, y: 68, w: 21, h: 30, type: "image" },
      { x: 48, y: 68, w: 50, h: 30, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [
      [2, 2, 64, 64], [68, 2, 30, 30], [68, 34, 30, 32],
      [2, 68, 21, 30], [25, 68, 21, 30], [48, 68, 50, 30],
    ]),
  },
  {
    id: "multi-2x4",
    name: "2x4 Grid",
    category: "Multi",
    imageCount: 8,
    previewRects: [
      { x: 2, y: 2, w: 47, h: 23, type: "image" },
      { x: 51, y: 2, w: 47, h: 23, type: "image" },
      { x: 2, y: 27, w: 47, h: 22, type: "image" },
      { x: 51, y: 27, w: 47, h: 22, type: "image" },
      { x: 2, y: 51, w: 47, h: 23, type: "image" },
      { x: 51, y: 51, w: 47, h: 23, type: "image" },
      { x: 2, y: 76, w: 47, h: 22, type: "image" },
      { x: 51, y: 76, w: 47, h: 22, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [
      [2, 2, 47, 23], [51, 2, 47, 23],
      [2, 27, 47, 22], [51, 27, 47, 22],
      [2, 51, 47, 23], [51, 51, 47, 23],
      [2, 76, 47, 22], [51, 76, 47, 22],
    ]),
  },
  {
    id: "multi-3x3",
    name: "3x3 Grid",
    category: "Multi",
    imageCount: 9,
    previewRects: [
      { x: 2, y: 2, w: 31, h: 30, type: "image" },
      { x: 35, y: 2, w: 31, h: 30, type: "image" },
      { x: 67, y: 2, w: 31, h: 30, type: "image" },
      { x: 2, y: 35, w: 31, h: 30, type: "image" },
      { x: 35, y: 35, w: 31, h: 30, type: "image" },
      { x: 67, y: 35, w: 31, h: 30, type: "image" },
      { x: 2, y: 68, w: 31, h: 30, type: "image" },
      { x: 35, y: 68, w: 31, h: 30, type: "image" },
      { x: 67, y: 68, w: 31, h: 30, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [
      [2, 2, 31, 30], [35, 2, 31, 30], [67, 2, 31, 30],
      [2, 35, 31, 30], [35, 35, 31, 30], [67, 35, 31, 30],
      [2, 68, 31, 30], [35, 68, 31, 30], [67, 68, 31, 30],
    ]),
  },
  {
    id: "multi-mosaic-7",
    name: "Mosaic",
    category: "Multi",
    imageCount: 7,
    previewRects: [
      { x: 2, y: 2, w: 55, h: 48, type: "image" },
      { x: 59, y: 2, w: 39, h: 23, type: "image" },
      { x: 59, y: 27, w: 39, h: 23, type: "image" },
      { x: 2, y: 52, w: 31, h: 46, type: "image" },
      { x: 35, y: 52, w: 31, h: 22, type: "image" },
      { x: 68, y: 52, w: 30, h: 46, type: "image" },
      { x: 35, y: 76, w: 31, h: 22, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [
      [2, 2, 55, 48], [59, 2, 39, 23], [59, 27, 39, 23],
      [2, 52, 31, 46], [35, 52, 31, 22], [68, 52, 30, 46],
      [35, 76, 31, 22],
    ]),
  },
  {
    id: "multi-2x5",
    name: "2x5 Grid",
    category: "Multi",
    imageCount: 10,
    previewRects: [
      { x: 2, y: 2, w: 47, h: 18, type: "image" },
      { x: 51, y: 2, w: 47, h: 18, type: "image" },
      { x: 2, y: 22, w: 47, h: 17, type: "image" },
      { x: 51, y: 22, w: 47, h: 17, type: "image" },
      { x: 2, y: 41, w: 47, h: 18, type: "image" },
      { x: 51, y: 41, w: 47, h: 18, type: "image" },
      { x: 2, y: 61, w: 47, h: 18, type: "image" },
      { x: 51, y: 61, w: 47, h: 18, type: "image" },
      { x: 2, y: 81, w: 47, h: 17, type: "image" },
      { x: 51, y: 81, w: 47, h: 17, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [
      [2, 2, 47, 18], [51, 2, 47, 18],
      [2, 22, 47, 17], [51, 22, 47, 17],
      [2, 41, 47, 18], [51, 41, 47, 18],
      [2, 61, 47, 18], [51, 61, 47, 18],
      [2, 81, 47, 17], [51, 81, 47, 17],
    ]),
  },
  // --- New Multi templates ---
  {
    id: "multi-3x2",
    name: "3x2 Grid",
    category: "Multi",
    imageCount: 6,
    previewRects: [
      { x: 2, y: 2, w: 31, h: 47, type: "image" },
      { x: 35, y: 2, w: 31, h: 47, type: "image" },
      { x: 67, y: 2, w: 31, h: 47, type: "image" },
      { x: 2, y: 51, w: 31, h: 47, type: "image" },
      { x: 35, y: 51, w: 31, h: 47, type: "image" },
      { x: 67, y: 51, w: 31, h: 47, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [
      [2, 2, 31, 47], [35, 2, 31, 47], [67, 2, 31, 47],
      [2, 51, 31, 47], [35, 51, 31, 47], [67, 51, 31, 47],
    ]),
  },
  {
    id: "multi-4x2",
    name: "4x2 Grid",
    category: "Multi",
    imageCount: 8,
    previewRects: [
      { x: 2, y: 2, w: 23, h: 47, type: "image" },
      { x: 27, y: 2, w: 23, h: 47, type: "image" },
      { x: 51, y: 2, w: 23, h: 47, type: "image" },
      { x: 76, y: 2, w: 22, h: 47, type: "image" },
      { x: 2, y: 51, w: 23, h: 47, type: "image" },
      { x: 27, y: 51, w: 23, h: 47, type: "image" },
      { x: 51, y: 51, w: 23, h: 47, type: "image" },
      { x: 76, y: 51, w: 22, h: 47, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [
      [2, 2, 23, 47], [27, 2, 23, 47], [51, 2, 23, 47], [76, 2, 22, 47],
      [2, 51, 23, 47], [27, 51, 23, 47], [51, 51, 23, 47], [76, 51, 22, 47],
    ]),
  },
  {
    id: "multi-2x4-wide",
    name: "2 Rows x 4 Cols",
    category: "Multi",
    imageCount: 8,
    previewRects: [
      { x: 2, y: 2, w: 23, h: 47, type: "image" },
      { x: 27, y: 2, w: 23, h: 47, type: "image" },
      { x: 51, y: 2, w: 23, h: 47, type: "image" },
      { x: 76, y: 2, w: 22, h: 47, type: "image" },
      { x: 2, y: 51, w: 23, h: 47, type: "image" },
      { x: 27, y: 51, w: 23, h: 47, type: "image" },
      { x: 51, y: 51, w: 23, h: 47, type: "image" },
      { x: 76, y: 51, w: 22, h: 47, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [
      [2, 2, 23, 47], [27, 2, 23, 47], [51, 2, 23, 47], [76, 2, 22, 47],
      [2, 51, 23, 47], [27, 51, 23, 47], [51, 51, 23, 47], [76, 51, 22, 47],
    ]),
  },
  {
    id: "multi-progressive",
    name: "Progressive Rows",
    category: "Multi",
    imageCount: 6,
    previewRects: [
      { x: 2, y: 2, w: 96, h: 30, type: "image" },
      { x: 2, y: 35, w: 47, h: 30, type: "image" },
      { x: 51, y: 35, w: 47, h: 30, type: "image" },
      { x: 2, y: 68, w: 31, h: 30, type: "image" },
      { x: 35, y: 68, w: 31, h: 30, type: "image" },
      { x: 67, y: 68, w: 31, h: 30, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [
      [2, 2, 96, 30],
      [2, 35, 47, 30], [51, 35, 47, 30],
      [2, 68, 31, 30], [35, 68, 31, 30], [67, 68, 31, 30],
    ]),
  },
];

// ---------------------------------------------------------------------------
// MOSAIC / Brick templates (NEW)
// ---------------------------------------------------------------------------

const MOSAIC_TEMPLATES: LayoutTemplate[] = [
  {
    id: "mosaic-brick-1",
    name: "Brick Pattern 1",
    category: "Mosaic",
    imageCount: 6,
    previewRects: [
      { x: 2, y: 2, w: 47, h: 30, type: "image" },
      { x: 51, y: 2, w: 47, h: 30, type: "image" },
      { x: 2, y: 35, w: 31, h: 30, type: "image" },
      { x: 35, y: 35, w: 31, h: 30, type: "image" },
      { x: 67, y: 35, w: 31, h: 30, type: "image" },
      { x: 15, y: 68, w: 70, h: 30, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [
      [2, 2, 47, 30], [51, 2, 47, 30],
      [2, 35, 31, 30], [35, 35, 31, 30], [67, 35, 31, 30],
      [15, 68, 70, 30],
    ]),
  },
  {
    id: "mosaic-brick-2",
    name: "Brick Pattern 2",
    category: "Mosaic",
    imageCount: 6,
    previewRects: [
      { x: 2, y: 2, w: 31, h: 30, type: "image" },
      { x: 35, y: 2, w: 63, h: 30, type: "image" },
      { x: 2, y: 35, w: 63, h: 30, type: "image" },
      { x: 67, y: 35, w: 31, h: 30, type: "image" },
      { x: 2, y: 68, w: 47, h: 30, type: "image" },
      { x: 51, y: 68, w: 47, h: 30, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [
      [2, 2, 31, 30], [35, 2, 63, 30],
      [2, 35, 63, 30], [67, 35, 31, 30],
      [2, 68, 47, 30], [51, 68, 47, 30],
    ]),
  },
  {
    id: "mosaic-pinterest",
    name: "Pinterest Style",
    category: "Mosaic",
    imageCount: 6,
    previewRects: [
      { x: 2, y: 2, w: 47, h: 40, type: "image" },
      { x: 51, y: 2, w: 47, h: 25, type: "image" },
      { x: 51, y: 29, w: 47, h: 38, type: "image" },
      { x: 2, y: 44, w: 47, h: 25, type: "image" },
      { x: 2, y: 71, w: 47, h: 27, type: "image" },
      { x: 51, y: 69, w: 47, h: 29, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [
      [2, 2, 47, 40], [51, 2, 47, 25],
      [51, 29, 47, 38], [2, 44, 47, 25],
      [2, 71, 47, 27], [51, 69, 47, 29],
    ]),
  },
  {
    id: "mosaic-mixed-sizes",
    name: "Mixed Sizes",
    category: "Mosaic",
    imageCount: 6,
    previewRects: [
      { x: 2, y: 2, w: 55, h: 55, type: "image" },
      { x: 59, y: 2, w: 39, h: 27, type: "image" },
      { x: 59, y: 31, w: 39, h: 26, type: "image" },
      { x: 2, y: 59, w: 31, h: 39, type: "image" },
      { x: 35, y: 59, w: 31, h: 39, type: "image" },
      { x: 68, y: 59, w: 30, h: 39, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [
      [2, 2, 55, 55], [59, 2, 39, 27], [59, 31, 39, 26],
      [2, 59, 31, 39], [35, 59, 31, 39], [68, 59, 30, 39],
    ]),
  },
  {
    id: "mosaic-tetris",
    name: "Tetris Blocks",
    category: "Mosaic",
    imageCount: 7,
    previewRects: [
      { x: 2, y: 2, w: 47, h: 30, type: "image" },
      { x: 51, y: 2, w: 47, h: 47, type: "image" },
      { x: 2, y: 35, w: 25, h: 40, type: "image" },
      { x: 29, y: 35, w: 20, h: 20, type: "image" },
      { x: 29, y: 57, w: 20, h: 18, type: "image" },
      { x: 2, y: 77, w: 47, h: 21, type: "image" },
      { x: 51, y: 51, w: 47, h: 47, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [
      [2, 2, 47, 30], [51, 2, 47, 47],
      [2, 35, 25, 40], [29, 35, 20, 20], [29, 57, 20, 18],
      [2, 77, 47, 21], [51, 51, 47, 47],
    ]),
  },
  {
    id: "mosaic-big-surround",
    name: "Big + Surround",
    category: "Mosaic",
    imageCount: 8,
    previewRects: [
      { x: 20, y: 20, w: 60, h: 60, type: "image" },
      { x: 2, y: 2, w: 30, h: 15, type: "image" },
      { x: 35, y: 2, w: 30, h: 15, type: "image" },
      { x: 68, y: 2, w: 30, h: 15, type: "image" },
      { x: 2, y: 20, w: 15, h: 30, type: "image" },
      { x: 83, y: 20, w: 15, h: 30, type: "image" },
      { x: 2, y: 83, w: 47, h: 15, type: "image" },
      { x: 51, y: 83, w: 47, h: 15, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [
      [20, 20, 60, 60], [2, 2, 30, 15], [35, 2, 30, 15], [68, 2, 30, 15],
      [2, 20, 15, 30], [83, 20, 15, 30], [2, 83, 47, 15], [51, 83, 47, 15],
    ]),
  },
  {
    id: "mosaic-center-strip",
    name: "Center Strip",
    category: "Mosaic",
    imageCount: 5,
    previewRects: [
      { x: 2, y: 2, w: 25, h: 47, type: "image" },
      { x: 29, y: 2, w: 42, h: 96, type: "image" },
      { x: 73, y: 2, w: 25, h: 47, type: "image" },
      { x: 2, y: 51, w: 25, h: 47, type: "image" },
      { x: 73, y: 51, w: 25, h: 47, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [
      [2, 2, 25, 47], [29, 2, 42, 96], [73, 2, 25, 47],
      [2, 51, 25, 47], [73, 51, 25, 47],
    ]),
  },
  {
    id: "mosaic-asymmetric",
    name: "Asymmetric Grid",
    category: "Mosaic",
    imageCount: 6,
    previewRects: [
      { x: 2, y: 2, w: 35, h: 47, type: "image" },
      { x: 39, y: 2, w: 25, h: 47, type: "image" },
      { x: 66, y: 2, w: 32, h: 47, type: "image" },
      { x: 2, y: 51, w: 50, h: 47, type: "image" },
      { x: 54, y: 51, w: 20, h: 47, type: "image" },
      { x: 76, y: 51, w: 22, h: 47, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [
      [2, 2, 35, 47], [39, 2, 25, 47], [66, 2, 32, 47],
      [2, 51, 50, 47], [54, 51, 20, 47], [76, 51, 22, 47],
    ]),
  },
  {
    id: "mosaic-stacked-bars",
    name: "Stacked Bars",
    category: "Mosaic",
    imageCount: 5,
    previewRects: [
      { x: 10, y: 2, w: 80, h: 17, type: "image" },
      { x: 2, y: 22, w: 96, h: 17, type: "image" },
      { x: 15, y: 42, w: 70, h: 17, type: "image" },
      { x: 5, y: 62, w: 90, h: 17, type: "image" },
      { x: 20, y: 81, w: 60, h: 17, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [
      [10, 2, 80, 17], [2, 22, 96, 17], [15, 42, 70, 17],
      [5, 62, 90, 17], [20, 81, 60, 17],
    ]),
  },
  {
    id: "mosaic-windowpane",
    name: "Windowpane",
    category: "Mosaic",
    imageCount: 4,
    previewRects: [
      { x: 5, y: 5, w: 42, h: 42, type: "image" },
      { x: 53, y: 5, w: 42, h: 42, type: "image" },
      { x: 5, y: 53, w: 42, h: 42, type: "image" },
      { x: 53, y: 53, w: 42, h: 42, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [
      [5, 5, 42, 42], [53, 5, 42, 42],
      [5, 53, 42, 42], [53, 53, 42, 42],
    ]),
  },
];

// ---------------------------------------------------------------------------
// DIAGONAL / Creative shapes templates (NEW)
// ---------------------------------------------------------------------------

const DIAGONAL_TEMPLATES: LayoutTemplate[] = [
  {
    id: "diag-split-1",
    name: "Diagonal Split TL-BR",
    category: "Diagonal",
    imageCount: 2,
    previewRects: [
      { x: 2, y: 2, w: 96, h: 47, type: "image" },
      { x: 2, y: 51, w: 96, h: 47, type: "image" },
    ],
    previewLines: [{ x1: 0, y1: 0, x2: 100, y2: 100 }],
    generate: (images) => generateFromSlots(images, [[2, 2, 96, 47], [2, 51, 96, 47]]),
  },
  {
    id: "diag-split-2",
    name: "Diagonal Split TR-BL",
    category: "Diagonal",
    imageCount: 2,
    previewRects: [
      { x: 2, y: 2, w: 96, h: 47, type: "image" },
      { x: 2, y: 51, w: 96, h: 47, type: "image" },
    ],
    previewLines: [{ x1: 100, y1: 0, x2: 0, y2: 100 }],
    generate: (images) => generateFromSlots(images, [[2, 2, 96, 47], [2, 51, 96, 47]]),
  },
  {
    id: "diag-x-cross",
    name: "X-Cross 4 Zones",
    category: "Diagonal",
    imageCount: 4,
    previewRects: [
      { x: 2, y: 2, w: 47, h: 47, type: "image" },
      { x: 51, y: 2, w: 47, h: 47, type: "image" },
      { x: 2, y: 51, w: 47, h: 47, type: "image" },
      { x: 51, y: 51, w: 47, h: 47, type: "image" },
    ],
    previewLines: [
      { x1: 0, y1: 0, x2: 100, y2: 100 },
      { x1: 100, y1: 0, x2: 0, y2: 100 },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 47, 47], [51, 2, 47, 47], [2, 51, 47, 47], [51, 51, 47, 47]]),
  },
  {
    id: "diag-chevron",
    name: "Chevron Split",
    category: "Diagonal",
    imageCount: 2,
    previewRects: [
      { x: 2, y: 2, w: 47, h: 96, type: "image" },
      { x: 51, y: 2, w: 47, h: 96, type: "image" },
    ],
    previewLines: [
      { x1: 50, y1: 0, x2: 30, y2: 50 },
      { x1: 30, y1: 50, x2: 50, y2: 100 },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 47, 96], [51, 2, 47, 96]]),
  },
  {
    id: "diag-arrow",
    name: "Arrow Right",
    category: "Diagonal",
    imageCount: 2,
    previewRects: [
      { x: 2, y: 2, w: 55, h: 96, type: "image" },
      { x: 59, y: 2, w: 39, h: 96, type: "image" },
    ],
    previewLines: [
      { x1: 60, y1: 0, x2: 75, y2: 50 },
      { x1: 75, y1: 50, x2: 60, y2: 100 },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 55, 96], [59, 2, 39, 96]]),
  },
  {
    id: "diag-radial-4",
    name: "Radial 4 Slices",
    category: "Diagonal",
    imageCount: 4,
    previewRects: [
      { x: 2, y: 2, w: 47, h: 47, type: "image" },
      { x: 51, y: 2, w: 47, h: 47, type: "image" },
      { x: 2, y: 51, w: 47, h: 47, type: "image" },
      { x: 51, y: 51, w: 47, h: 47, type: "image" },
    ],
    previewLines: [
      { x1: 50, y1: 0, x2: 50, y2: 100 },
      { x1: 0, y1: 50, x2: 100, y2: 50 },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 47, 47], [51, 2, 47, 47], [2, 51, 47, 47], [51, 51, 47, 47]]),
  },
  {
    id: "diag-frame-inset",
    name: "Frame + Inset",
    category: "Diagonal",
    imageCount: 2,
    previewRects: [
      { x: 2, y: 2, w: 96, h: 96, type: "image" },
      { x: 20, y: 20, w: 60, h: 60, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 96, 96], [20, 20, 60, 60]]),
  },
  {
    id: "diag-tri-split-h",
    name: "Triple Horizontal Split",
    category: "Diagonal",
    imageCount: 3,
    previewRects: [
      { x: 2, y: 2, w: 96, h: 30, type: "image" },
      { x: 2, y: 35, w: 96, h: 30, type: "image" },
      { x: 2, y: 68, w: 96, h: 30, type: "image" },
    ],
    previewLines: [
      { x1: 0, y1: 33, x2: 100, y2: 33 },
      { x1: 0, y1: 66, x2: 100, y2: 66 },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 96, 30], [2, 35, 96, 30], [2, 68, 96, 30]]),
  },
  {
    id: "diag-corner-accent",
    name: "Corner Accent",
    category: "Diagonal",
    imageCount: 3,
    previewRects: [
      { x: 2, y: 2, w: 96, h: 96, type: "image" },
      { x: 2, y: 2, w: 35, h: 35, type: "image" },
      { x: 63, y: 63, w: 35, h: 35, type: "image" },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 96, 96], [2, 2, 35, 35], [63, 63, 35, 35]]),
  },
  {
    id: "diag-tri-vert",
    name: "Triple Vertical Split",
    category: "Diagonal",
    imageCount: 3,
    previewRects: [
      { x: 2, y: 2, w: 30, h: 96, type: "image" },
      { x: 35, y: 2, w: 30, h: 96, type: "image" },
      { x: 68, y: 2, w: 30, h: 96, type: "image" },
    ],
    previewLines: [
      { x1: 33, y1: 0, x2: 33, y2: 100 },
      { x1: 66, y1: 0, x2: 66, y2: 100 },
    ],
    generate: (images) => generateFromSlots(images, [[2, 2, 30, 96], [35, 2, 30, 96], [68, 2, 30, 96]]),
  },
];

// ---------------------------------------------------------------------------
// WITH TEXT templates (5)
// ---------------------------------------------------------------------------

const WITH_TEXT_TEMPLATES: LayoutTemplate[] = [
  {
    id: "text-left-right",
    name: "Image + Text Side",
    category: "With Text",
    imageCount: 1,
    previewRects: [
      { x: 2, y: 5, w: 50, h: 90, type: "image" },
      { x: 55, y: 25, w: 42, h: 50, type: "text" },
    ],
    generate: (images) => {
      const els: ShowcaseElement[] = [];
      const img = getImage(images, 0);
      if (img) els.push(makeImageElement(img.id, img.url, 2, 5, 50, 90, 1));
      els.push(makeTextElement("Your Text Here", 55, 25, 42, 50, 2, 20));
      return els;
    },
  },
  {
    id: "text-top-title-desc",
    name: "Image + Title + Desc",
    category: "With Text",
    imageCount: 1,
    previewRects: [
      { x: 5, y: 2, w: 90, h: 55, type: "image" },
      { x: 10, y: 60, w: 80, h: 10, type: "text" },
      { x: 10, y: 73, w: 80, h: 20, type: "text" },
    ],
    generate: (images) => {
      const els: ShowcaseElement[] = [];
      const img = getImage(images, 0);
      if (img) els.push(makeImageElement(img.id, img.url, 5, 2, 90, 55, 1));
      els.push(makeTextElement("Your Title Here", 10, 60, 80, 10, 2, 32));
      els.push(makeTextElement("Add a description for your build...", 10, 73, 80, 20, 3, 14));
      return els;
    },
  },
  {
    id: "text-fullbleed-overlay",
    name: "Full Bleed + Overlay",
    category: "With Text",
    imageCount: 1,
    previewRects: [
      { x: 0, y: 0, w: 100, h: 100, type: "image" },
      { x: 5, y: 75, w: 90, h: 20, type: "text" },
    ],
    generate: (images) => {
      const els: ShowcaseElement[] = [];
      const img = getImage(images, 0);
      if (img) els.push(makeImageElement(img.id, img.url, 0, 0, 100, 100, 1));
      els.push(makeTextElement("Your Text Overlay", 5, 75, 90, 20, 2, 28));
      return els;
    },
  },
  {
    id: "text-2img-center-title",
    name: "2 Images + Title",
    category: "With Text",
    imageCount: 2,
    previewRects: [
      { x: 2, y: 2, w: 45, h: 96, type: "image" },
      { x: 53, y: 2, w: 45, h: 96, type: "image" },
      { x: 20, y: 40, w: 60, h: 20, type: "text" },
    ],
    generate: (images) => {
      const els: ShowcaseElement[] = [];
      const img0 = getImage(images, 0);
      const img1 = getImage(images, 1);
      if (img0) els.push(makeImageElement(img0.id, img0.url, 2, 2, 45, 96, 1));
      if (img1) els.push(makeImageElement(img1.id, img1.url, 53, 2, 45, 96, 2));
      els.push(makeTextElement("Your Title", 20, 40, 60, 20, 3, 36));
      return els;
    },
  },
  {
    id: "text-magazine-cover",
    name: "Magazine Cover",
    category: "With Text",
    imageCount: 1,
    previewRects: [
      { x: 0, y: 0, w: 100, h: 100, type: "image" },
      { x: 10, y: 10, w: 80, h: 12, type: "text" },
      { x: 10, y: 55, w: 80, h: 18, type: "text" },
      { x: 10, y: 76, w: 80, h: 8, type: "text" },
    ],
    generate: (images) => {
      const els: ShowcaseElement[] = [];
      const img = getImage(images, 0);
      if (img) els.push(makeImageElement(img.id, img.url, 0, 0, 100, 100, 1));
      els.push(makeTextElement("HEADER", 10, 10, 80, 12, 2, 18));
      els.push(makeTextElement("Main Title", 10, 55, 80, 18, 3, 40));
      els.push(makeTextElement("Subtitle goes here", 10, 76, 80, 8, 4, 14));
      return els;
    },
  },
];

// ---------------------------------------------------------------------------
// All templates grouped
// ---------------------------------------------------------------------------

const TEMPLATE_CATEGORIES: Record<string, LayoutTemplate[]> = {
  "Basic": BASIC_TEMPLATES,
  "Magazine": MAGAZINE_TEMPLATES,
  "Creative": CREATIVE_TEMPLATES,
  "Multi": MULTI_TEMPLATES,
  "Mosaic": MOSAIC_TEMPLATES,
  "Diagonal": DIAGONAL_TEMPLATES,
  "With Text": WITH_TEXT_TEMPLATES,
};

/** Flat list of all built-in templates (exported for template-chooser-overlay) */
export const TEMPLATES: LayoutTemplate[] = [
  ...BASIC_TEMPLATES,
  ...MAGAZINE_TEMPLATES,
  ...CREATIVE_TEMPLATES,
  ...MULTI_TEMPLATES,
  ...MOSAIC_TEMPLATES,
  ...DIAGONAL_TEMPLATES,
  ...WITH_TEXT_TEMPLATES,
];

export { CATEGORIES };
export type { LayoutTemplate };

// ---------------------------------------------------------------------------
// Custom template conversion
// ---------------------------------------------------------------------------

interface CustomTemplateAPI {
  id: string;
  name: string;
  category: string;
  imageCount: number;
  slots: { x: number; y: number; w: number; h: number; type: "image" | "text" | "meta" }[];
}

function customToTemplate(t: CustomTemplateAPI): LayoutTemplate {
  return {
    id: t.id,
    name: t.name,
    category: "Custom",
    imageCount: t.imageCount,
    previewRects: t.slots,
    generate: (images) => {
      const els: ShowcaseElement[] = [];
      let z = 1;
      for (const slot of t.slots) {
        if (slot.type === "image") {
          const img = getImage(images, z - 1);
          if (img) els.push(makeImageElement(img.id, img.url, slot.x, slot.y, slot.w, slot.h, z));
        } else if (slot.type === "text") {
          els.push(makeTextElement("Your Text", slot.x, slot.y, slot.w, slot.h, z));
        } else if (slot.type === "meta") {
          els.push(makeMetadataElement(slot.x, slot.y, slot.w, slot.h, z));
        }
        z++;
      }
      return els;
    },
  };
}

// ---------------------------------------------------------------------------
// SVG Preview component
// ---------------------------------------------------------------------------

function TemplatePreview({ template, isSelected }: { template: LayoutTemplate; isSelected: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full aspect-square">
      <rect x={0} y={0} width={100} height={100} fill="#18181b" rx={4} />
      {template.previewRects.map((r, i) => {
        let fillColor: string;
        let strokeColor: string;
        if (r.type === "image") {
          fillColor = isSelected ? "#3b2a0a" : "#3f3f46";
          strokeColor = isSelected ? "#f59e0b" : "#52525b";
        } else if (r.type === "text") {
          fillColor = isSelected ? "#2a2a0e" : "#52525b";
          strokeColor = isSelected ? "#d97706" : "#71717a";
        } else {
          fillColor = isSelected ? "#2a2a1a" : "#71717a";
          strokeColor = isSelected ? "#b45309" : "#a1a1aa";
        }

        // Diamond center gets special rendering
        if (template.id === "creative-diamond" && i === 0) {
          const cx = r.x + r.w / 2;
          const cy = r.y + r.h / 2;
          const hw = r.w / 2;
          const hh = r.h / 2;
          return (
            <polygon
              key={i}
              points={`${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={0.5}
            />
          );
        }

        return (
          <rect
            key={i}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={0.5}
            rx={1.5}
          />
        );
      })}
      {/* Custom preview lines for diagonal templates */}
      {template.previewLines?.map((l, i) => (
        <line
          key={`line-${i}`}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke={isSelected ? "#f59e0b" : "#71717a"}
          strokeWidth={1}
          strokeDasharray="3 2"
        />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Photo count label
// ---------------------------------------------------------------------------

function photoLabel(template: LayoutTemplate): string {
  const textCount = template.previewRects.filter((r) => r.type === "text").length;
  const imgLabel = template.imageCount === 1 ? "1 photo" : `${template.imageCount} photos`;
  if (textCount > 0) {
    return `${imgLabel} + ${textCount === 1 ? "text" : `${textCount} text`}`;
  }
  return imgLabel;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface TemplatePickerPanelProps {
  buildImages: BuildImage[];
  hasElements: boolean;
  onApply: (elements: ShowcaseElement[]) => void;
  onClose: () => void;
}

export function TemplatePickerPanel({ buildImages, hasElements, onApply, onClose }: TemplatePickerPanelProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Basic");
  const [customTemplates, setCustomTemplates] = useState<LayoutTemplate[]>([]);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Fetch custom templates on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchCustom() {
      try {
        const res = await fetch("/api/custom-templates");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const converted = (data.templates ?? []).map(customToTemplate);
        setCustomTemplates(converted);
      } catch {
        // Silently fail — custom templates are optional
      }
    }
    fetchCustom();
    return () => { cancelled = true; };
  }, []);

  const handleSelect = (template: LayoutTemplate) => {
    if (hasElements && confirmId !== template.id) {
      setConfirmId(template.id);
      return;
    }
    const elements = template.generate(buildImages);
    onApply(elements);
    setConfirmId(null);
  };

  const templates = activeCategory === "Custom"
    ? customTemplates
    : (TEMPLATE_CATEGORIES[activeCategory] ?? []);

  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-20 sm:right-4 z-[500] w-full sm:w-80 max-h-[70vh] sm:max-h-[80vh] bg-zinc-900 border-t sm:border border-zinc-700 sm:rounded-xl rounded-t-xl shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 shrink-0">
        <h3 className="text-sm font-semibold text-white">Layout Templates</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Category Tabs */}
      <div
        ref={tabsRef}
        className="flex items-center gap-1 px-3 py-2 overflow-x-auto border-b border-zinc-800 shrink-0 scrollbar-none"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setConfirmId(null);
            }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0",
              activeCategory === cat
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="p-3 overflow-y-auto flex-1">
        <div className="grid grid-cols-3 gap-2">
          {templates.map((template) => {
            const isConfirm = confirmId === template.id;
            const isSelected = isConfirm;
            return (
              <button
                key={template.id}
                onClick={() => handleSelect(template)}
                className={cn(
                  "flex flex-col gap-1.5 p-1.5 rounded-lg border transition-colors text-left",
                  isConfirm
                    ? "border-orange-500/60 bg-orange-500/10"
                    : "border-zinc-700/60 hover:border-orange-500/40 hover:bg-zinc-800/50"
                )}
              >
                <TemplatePreview template={template} isSelected={isSelected} />
                <div className="px-0.5">
                  <span className="text-[10px] font-medium text-white block leading-tight truncate">
                    {template.name}
                  </span>
                  <span className="text-[9px] text-zinc-500 block mt-0.5 leading-tight">
                    {photoLabel(template)}
                  </span>
                  {isConfirm && (
                    <span className="text-[9px] text-orange-400 block mt-0.5 font-medium leading-tight">
                      Tap to replace
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
