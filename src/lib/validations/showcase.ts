import { z } from "zod";
import type { ShowcaseLayout } from "@/lib/types";

// Relaxed position/size bounds — elements can be dragged partially off-canvas
const posX = z.number().min(-100).max(200);
const posY = z.number().min(-100).max(200);
const dimW = z.number().min(0.5).max(200);
const dimH = z.number().min(0.5).max(200);
const rot = z.number().min(-360).max(360);
const colorHex = z.string();

const showcaseImageElement = z.object({
  type: z.literal("image"),
  id: z.string().min(1),
  x: posX, y: posY, width: dimW, height: dimH,
  zIndex: z.number().int(),
  rotation: rot,
  imageId: z.string().min(1),
  imageUrl: z.string(),
  objectFit: z.enum(["cover", "contain"]),
  borderRadius: z.number().min(0).max(100),
  shadow: z.boolean(),
  caption: z.string().max(500).nullable(),
  flipH: z.boolean().optional(),
  flipV: z.boolean().optional(),
});

const showcaseTextElement = z.object({
  type: z.literal("text"),
  id: z.string().min(1),
  x: posX, y: posY, width: dimW, height: dimH,
  zIndex: z.number().int(),
  rotation: rot,
  content: z.string().max(5000),
  fontSize: z.number().min(1).max(500),
  fontFamily: z.string(),
  color: colorHex,
  textAlign: z.enum(["left", "center", "right"]),
  backgroundColor: colorHex.nullable(),
  bold: z.boolean(),
  italic: z.boolean(),
  underline: z.boolean(),
  strikethrough: z.boolean(),
  gradient: z.boolean(),
  gradientColors: z.array(colorHex).max(10),
  gradientSpeed: z.number().min(0).max(100),
  fuzzy: z.boolean(),
  fuzzyIntensity: z.number(),
  fuzzyHoverIntensity: z.number().default(0.5),
  fuzzyFuzzRange: z.number().default(0.08),
  fuzzyDirection: z.enum(["horizontal", "vertical", "both"]).default("horizontal"),
  fuzzyTransitionDuration: z.number().default(0.15),
  fuzzyLetterSpacing: z.number().default(0),
  fuzzyEnableHover: z.boolean().default(true),
  fuzzyClickEffect: z.boolean().default(false),
  fuzzyGlitchMode: z.boolean().default(false),
  fuzzyGlitchInterval: z.number().default(5),
  fuzzyGlitchDuration: z.number().default(0.3),
});

const showcaseMetadataElement = z.object({
  type: z.literal("metadata"),
  id: z.string().min(1),
  x: posX, y: posY, width: dimW, height: dimH,
  zIndex: z.number().int(),
  rotation: rot,
  variant: z.enum(["compact", "full"]),
});

const showcaseEffectElement = z.object({
  type: z.literal("effect"),
  id: z.string().min(1),
  x: posX, y: posY, width: dimW, height: dimH,
  zIndex: z.number().int(),
  rotation: rot,
  effectType: z.enum(["electric"]),
  color: colorHex,
  speed: z.number().min(0).max(100),
  chaos: z.number().min(0).max(1),
  borderRadius: z.number().min(0).max(100),
});

const showcaseVideoElement = z.object({
  type: z.literal("video"),
  id: z.string().min(1),
  x: posX, y: posY, width: dimW, height: dimH,
  zIndex: z.number().int(),
  rotation: rot,
  url: z.string(),
  objectFit: z.enum(["cover", "contain"]),
  muted: z.boolean(),
  loop: z.boolean(),
  borderRadius: z.number().min(0).max(100),
});

const shapeFillSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("solid"), color: colorHex }),
  z.object({ type: z.literal("gradient"), colors: z.array(colorHex).min(2).max(10), angle: z.number().min(0).max(360) }),
  z.object({ type: z.literal("image"), imageUrl: z.string(), objectFit: z.enum(["cover", "contain"]) }),
  z.object({ type: z.literal("none") }),
]);

const showcaseShapeElement = z.object({
  type: z.literal("shape"),
  id: z.string().min(1),
  x: posX, y: posY, width: dimW, height: dimH,
  zIndex: z.number().int(),
  rotation: rot,
  shapeType: z.enum(["rectangle", "circle", "triangle", "star", "hexagon", "arrow", "diamond", "pentagon"]),
  fill: shapeFillSchema,
  stroke: colorHex.nullable(),
  strokeWidth: z.number().min(0).max(10),
  opacity: z.number().min(0).max(1),
  cornerRadius: z.number().min(0).max(100),
  shadow: z.boolean(),
});

const showcaseElement = z.discriminatedUnion("type", [
  showcaseImageElement,
  showcaseTextElement,
  showcaseMetadataElement,
  showcaseEffectElement,
  showcaseVideoElement,
  showcaseShapeElement,
]);

const showcasePageBackgroundSchema = z.object({
  imageUrl: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  opacity: z.number().min(0).max(1).optional(),
  blur: z.number().min(0).max(100).optional(),
  overlayOpacity: z.number().min(0).max(1).optional(),
  config: z.record(z.string(), z.unknown()).nullable().optional(),
}).optional();

const showcasePageSchema = z.object({
  id: z.string().min(1),
  elements: z.array(showcaseElement).max(100),
  background: showcasePageBackgroundSchema,
});

export const showcaseLayoutSchema = z.object({
  version: z.literal(1),
  canvas: z.object({
    backgroundImageUrl: z.string().nullable(),
    backgroundColor: z.string().nullable(),
    backgroundOpacity: z.number().min(0).max(1),
    backgroundBlur: z.number().min(0).max(100),
    aspectRatio: z.string().optional().default("4 / 5"),
    backgroundConfig: z.record(z.string(), z.unknown()).nullable().optional(),
    overlayOpacity: z.number().min(0).max(1).optional().default(0.2),
  }),
  elements: z.array(showcaseElement).max(100),
  pages: z.array(showcasePageSchema).max(20).optional(),
});

// ─── Migration for backward compatibility ──────────────────────

const FONT_SIZE_MIGRATION: Record<string, number> = {
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
};

function migrateElements(elements: ShowcaseLayout["elements"]): ShowcaseLayout["elements"] {
  return elements.map((el) => {
    if (el.type === "text") {
      const textEl = el as unknown as Record<string, unknown>;
      const fontSize = typeof textEl.fontSize === "string"
        ? (FONT_SIZE_MIGRATION[textEl.fontSize] ?? 16)
        : (textEl.fontSize as number) ?? 16;
      const fontWeight = textEl.fontWeight as string | undefined;
      const bold = textEl.bold ?? (fontWeight === "bold" || fontWeight === "semibold") ?? false;
      return {
        ...el,
        fontSize,
        bold: bold as boolean,
        italic: (textEl.italic as boolean) ?? false,
        underline: (textEl.underline as boolean) ?? false,
        strikethrough: (textEl.strikethrough as boolean) ?? false,
        gradient: (textEl.gradient as boolean) ?? false,
        gradientColors: (textEl.gradientColors as string[]) ?? ["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"],
        gradientSpeed: (textEl.gradientSpeed as number) ?? 2,
        fuzzy: (textEl.fuzzy as boolean) ?? false,
        fuzzyIntensity: (textEl.fuzzyIntensity as number) ?? 0.18,
        fuzzyHoverIntensity: (textEl.fuzzyHoverIntensity as number) ?? 0.5,
        fuzzyFuzzRange: (textEl.fuzzyFuzzRange as number) ?? 0.08,
        fuzzyDirection: (textEl.fuzzyDirection as string) ?? "horizontal",
        fuzzyTransitionDuration: (textEl.fuzzyTransitionDuration as number) ?? 0.15,
        fuzzyLetterSpacing: (textEl.fuzzyLetterSpacing as number) ?? 0,
        fuzzyEnableHover: (textEl.fuzzyEnableHover as boolean) ?? true,
        fuzzyClickEffect: (textEl.fuzzyClickEffect as boolean) ?? false,
        fuzzyGlitchMode: (textEl.fuzzyGlitchMode as boolean) ?? false,
        fuzzyGlitchInterval: (textEl.fuzzyGlitchInterval as number) ?? 5,
        fuzzyGlitchDuration: (textEl.fuzzyGlitchDuration as number) ?? 0.3,
      };
    }
    return el;
  }) as ShowcaseLayout["elements"];
}

export function migrateShowcaseLayout(layout: unknown): ShowcaseLayout {
  const data = layout as ShowcaseLayout;
  const migratedElements = migrateElements(data.elements);
  const migratedPages = data.pages?.map((page) => ({
    ...page,
    elements: migrateElements(page.elements),
  }));
  return {
    ...data,
    canvas: {
      ...data.canvas,
      aspectRatio: data.canvas.aspectRatio || "4 / 5",
      overlayOpacity: data.canvas.overlayOpacity ?? 0.2,
    },
    elements: migratedElements,
    pages: migratedPages,
  } as ShowcaseLayout;
}
