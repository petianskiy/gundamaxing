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

const CATEGORIES = ["Basic", "Magazine", "Creative", "Multi", "With Text", "Custom"] as const;

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
];

// ---------------------------------------------------------------------------
// CREATIVE templates (6)
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
      // Center diamond (rendered as rotated image)
      const img0 = getImage(images, 0);
      if (img0) {
        const el = makeImageElement(img0.id, img0.url, 22, 22, 56, 56, 1);
        el.rotation = 45;
        els.push(el);
      }
      // Corners
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
];

// ---------------------------------------------------------------------------
// MULTI templates (6)
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
  "With Text": WITH_TEXT_TEMPLATES,
};

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
