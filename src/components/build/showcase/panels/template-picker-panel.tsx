"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BuildImage, ShowcaseElement, ShowcaseImageElement, ShowcaseTextElement, ShowcaseMetadataElement } from "@/lib/types";

interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  generate: (buildImages: BuildImage[]) => ShowcaseElement[];
  // SVG preview layout rects for visual preview
  previewRects: { x: number; y: number; w: number; h: number; type: "image" | "text" | "meta" }[];
}

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

function getImage(images: BuildImage[], index: number): { id: string; url: string } {
  if (images.length === 0) return { id: "placeholder", url: "" };
  const img = images[index % images.length];
  return { id: img.id || img.url, url: img.url };
}

const TEMPLATES: LayoutTemplate[] = [
  {
    id: "centered-hero",
    name: "Centered Hero",
    description: "One large image centered on the canvas",
    previewRects: [
      { x: 15, y: 10, w: 70, h: 80, type: "image" },
    ],
    generate: (images) => {
      const img = getImage(images, 0);
      return [
        makeImageElement(img.id, img.url, 15, 10, 70, 80, 1),
      ];
    },
  },
  {
    id: "side-by-side",
    name: "Side by Side",
    description: "Two images placed side by side",
    previewRects: [
      { x: 1, y: 10, w: 48, h: 80, type: "image" },
      { x: 51, y: 10, w: 48, h: 80, type: "image" },
    ],
    generate: (images) => {
      const img1 = getImage(images, 0);
      const img2 = getImage(images, 1);
      return [
        makeImageElement(img1.id, img1.url, 1, 10, 48, 80, 1),
        makeImageElement(img2.id, img2.url, 51, 10, 48, 80, 2),
      ];
    },
  },
  {
    id: "magazine",
    name: "Magazine",
    description: "Large left image with two stacked right images",
    previewRects: [
      { x: 1, y: 5, w: 58, h: 90, type: "image" },
      { x: 61, y: 5, w: 38, h: 44, type: "image" },
      { x: 61, y: 51, w: 38, h: 44, type: "image" },
    ],
    generate: (images) => {
      const img1 = getImage(images, 0);
      const img2 = getImage(images, 1);
      const img3 = getImage(images, 2);
      return [
        makeImageElement(img1.id, img1.url, 1, 5, 58, 90, 1),
        makeImageElement(img2.id, img2.url, 61, 5, 38, 44, 2),
        makeImageElement(img3.id, img3.url, 61, 51, 38, 44, 3),
      ];
    },
  },
  {
    id: "grid-2x2",
    name: "Grid 2x2",
    description: "Four equal images in a 2x2 grid",
    previewRects: [
      { x: 1, y: 1, w: 48, h: 48, type: "image" },
      { x: 51, y: 1, w: 48, h: 48, type: "image" },
      { x: 1, y: 51, w: 48, h: 48, type: "image" },
      { x: 51, y: 51, w: 48, h: 48, type: "image" },
    ],
    generate: (images) => {
      return [
        makeImageElement(getImage(images, 0).id, getImage(images, 0).url, 1, 1, 48, 48, 1),
        makeImageElement(getImage(images, 1).id, getImage(images, 1).url, 51, 1, 48, 48, 2),
        makeImageElement(getImage(images, 2).id, getImage(images, 2).url, 1, 51, 48, 48, 3),
        makeImageElement(getImage(images, 3).id, getImage(images, 3).url, 51, 51, 48, 48, 4),
      ];
    },
  },
  {
    id: "cinematic",
    name: "Cinematic",
    description: "Full-width hero image with title text below",
    previewRects: [
      { x: 0, y: 0, w: 100, h: 60, type: "image" },
      { x: 10, y: 65, w: 80, h: 10, type: "text" },
    ],
    generate: (images) => {
      const img = getImage(images, 0);
      return [
        makeImageElement(img.id, img.url, 0, 0, 100, 60, 1),
        makeTextElement("Your Title Here", 10, 65, 80, 10, 2, 32),
      ];
    },
  },
  {
    id: "build-story",
    name: "Build Story",
    description: "Image, title, description, and build info card",
    previewRects: [
      { x: 2, y: 5, w: 55, h: 70, type: "image" },
      { x: 60, y: 5, w: 38, h: 8, type: "text" },
      { x: 60, y: 16, w: 38, h: 15, type: "text" },
      { x: 60, y: 55, w: 38, h: 20, type: "meta" },
    ],
    generate: (images) => {
      const img = getImage(images, 0);
      return [
        makeImageElement(img.id, img.url, 2, 5, 55, 70, 1),
        makeTextElement("Your Title Here", 60, 5, 38, 8, 2, 28),
        makeTextElement("Describe your build process, techniques, and inspiration here...", 60, 16, 38, 15, 3, 14),
        makeMetadataElement(60, 55, 38, 20, 4, "compact"),
      ];
    },
  },
  {
    id: "newspaper",
    name: "Newspaper",
    description: "Header text with a 3-column image grid below",
    previewRects: [
      { x: 5, y: 2, w: 90, h: 10, type: "text" },
      { x: 1, y: 16, w: 32, h: 78, type: "image" },
      { x: 34, y: 16, w: 32, h: 78, type: "image" },
      { x: 67, y: 16, w: 32, h: 78, type: "image" },
    ],
    generate: (images) => {
      return [
        makeTextElement("Your Title Here", 5, 2, 90, 10, 4, 36),
        makeImageElement(getImage(images, 0).id, getImage(images, 0).url, 1, 16, 32, 78, 1),
        makeImageElement(getImage(images, 1).id, getImage(images, 1).url, 34, 16, 32, 78, 2),
        makeImageElement(getImage(images, 2).id, getImage(images, 2).url, 67, 16, 32, 78, 3),
      ];
    },
  },
  {
    id: "triptych",
    name: "Triptych",
    description: "Three equal images in a row with small gaps",
    previewRects: [
      { x: 1, y: 15, w: 31, h: 70, type: "image" },
      { x: 34, y: 15, w: 31, h: 70, type: "image" },
      { x: 67, y: 15, w: 31, h: 70, type: "image" },
    ],
    generate: (images) => {
      return [
        makeImageElement(getImage(images, 0).id, getImage(images, 0).url, 1, 15, 31, 70, 1),
        makeImageElement(getImage(images, 1).id, getImage(images, 1).url, 34, 15, 31, 70, 2),
        makeImageElement(getImage(images, 2).id, getImage(images, 2).url, 67, 15, 31, 70, 3),
      ];
    },
  },
];

function TemplatePreview({ template }: { template: LayoutTemplate }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full aspect-square">
      <rect x={0} y={0} width={100} height={100} fill="#18181b" rx={4} />
      {template.previewRects.map((r, i) => {
        const fillColor = r.type === "image" ? "#3f3f46" : r.type === "text" ? "#52525b" : "#71717a";
        const strokeColor = r.type === "image" ? "#52525b" : r.type === "text" ? "#71717a" : "#a1a1aa";
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
            rx={2}
          />
        );
      })}
    </svg>
  );
}

interface TemplatePickerPanelProps {
  buildImages: BuildImage[];
  hasElements: boolean;
  onApply: (elements: ShowcaseElement[]) => void;
  onClose: () => void;
}

export function TemplatePickerPanel({ buildImages, hasElements, onApply, onClose }: TemplatePickerPanelProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleSelect = (template: LayoutTemplate) => {
    if (hasElements && confirmId !== template.id) {
      setConfirmId(template.id);
      return;
    }
    const elements = template.generate(buildImages);
    onApply(elements);
    setConfirmId(null);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-20 sm:right-4 z-[500] w-full sm:w-80 max-h-[60vh] sm:max-h-[80vh] bg-zinc-900 border-t sm:border border-zinc-700 sm:rounded-xl rounded-t-xl shadow-2xl flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 shrink-0">
        <h3 className="text-sm font-semibold text-white">Layout Templates</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3 overflow-y-auto flex-1">
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelect(template)}
              className={cn(
                "flex flex-col gap-2 p-2 rounded-lg border transition-colors text-left",
                confirmId === template.id
                  ? "border-amber-500/50 bg-amber-500/5"
                  : "border-zinc-700 hover:border-blue-500/50 hover:bg-zinc-800/50"
              )}
            >
              <TemplatePreview template={template} />
              <div>
                <span className="text-xs font-medium text-white block">{template.name}</span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">{template.description}</span>
                {confirmId === template.id && (
                  <span className="text-[10px] text-amber-400 block mt-1 font-medium">
                    Click again to replace current elements
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
