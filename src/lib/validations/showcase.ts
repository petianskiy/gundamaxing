import { z } from "zod";
import type { ShowcaseLayout } from "@/lib/types";

const showcaseImageElement = z.object({
  type: z.literal("image"),
  id: z.string().min(1),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(1).max(100),
  height: z.number().min(1).max(100),
  zIndex: z.number().int(),
  rotation: z.number().min(-360).max(360),
  imageId: z.string().min(1),
  imageUrl: z.string().url(),
  objectFit: z.enum(["cover", "contain"]),
  borderRadius: z.number().min(0).max(50),
  shadow: z.boolean(),
  caption: z.string().max(200).nullable(),
});

const showcaseTextElement = z.object({
  type: z.literal("text"),
  id: z.string().min(1),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(1).max(100),
  height: z.number().min(1).max(100),
  zIndex: z.number().int(),
  rotation: z.number().min(-360).max(360),
  content: z.string().min(1).max(2000),
  fontSize: z.number().min(8).max(120),
  fontFamily: z.enum(["geist", "orbitron", "rajdhani", "exo2", "shareTechMono", "audiowide", "chakraPetch"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6,8}$/),
  textAlign: z.enum(["left", "center", "right"]),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6,8}$/).nullable(),
  bold: z.boolean(),
  italic: z.boolean(),
  underline: z.boolean(),
  strikethrough: z.boolean(),
  gradient: z.boolean(),
  gradientColors: z.array(z.string().regex(/^#[0-9a-fA-F]{6,8}$/)).min(2).max(6),
  gradientSpeed: z.number().min(0.5).max(10),
  fuzzy: z.boolean(),
  fuzzyIntensity: z.number().min(0.05).max(1),
  fuzzyHoverIntensity: z.number().min(0).max(2).default(0.5),
  fuzzyFuzzRange: z.number().min(0.01).max(0.5).default(0.08),
  fuzzyDirection: z.enum(["horizontal", "vertical", "both"]).default("horizontal"),
  fuzzyTransitionDuration: z.number().min(0.01).max(2).default(0.15),
  fuzzyLetterSpacing: z.number().min(-5).max(20).default(0),
  fuzzyEnableHover: z.boolean().default(true),
  fuzzyClickEffect: z.boolean().default(false),
  fuzzyGlitchMode: z.boolean().default(false),
  fuzzyGlitchInterval: z.number().min(0.5).max(30).default(5),
  fuzzyGlitchDuration: z.number().min(0.1).max(5).default(0.3),
});

const showcaseMetadataElement = z.object({
  type: z.literal("metadata"),
  id: z.string().min(1),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(1).max(100),
  height: z.number().min(1).max(100),
  zIndex: z.number().int(),
  rotation: z.number().min(-360).max(360),
  variant: z.enum(["compact", "full"]),
});

const showcaseEffectElement = z.object({
  type: z.literal("effect"),
  id: z.string().min(1),
  x: z.number().min(-50).max(150),
  y: z.number().min(-50).max(150),
  width: z.number().min(1).max(100),
  height: z.number().min(1).max(100),
  zIndex: z.number().int(),
  rotation: z.number().min(-360).max(360),
  effectType: z.enum(["electric"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6,8}$/),
  speed: z.number().min(0.1).max(5),
  chaos: z.number().min(0).max(1),
  borderRadius: z.number().min(0).max(50),
});

const showcaseVideoElement = z.object({
  type: z.literal("video"),
  id: z.string().min(1),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(1).max(100),
  height: z.number().min(1).max(100),
  zIndex: z.number().int(),
  rotation: z.number().min(-360).max(360),
  url: z.string().url(),
  objectFit: z.enum(["cover", "contain"]),
  muted: z.boolean(),
  loop: z.boolean(),
  borderRadius: z.number().min(0).max(50),
});

const showcaseElement = z.discriminatedUnion("type", [
  showcaseImageElement,
  showcaseTextElement,
  showcaseMetadataElement,
  showcaseEffectElement,
  showcaseVideoElement,
]);

export const showcaseLayoutSchema = z.object({
  version: z.literal(1),
  canvas: z.object({
    backgroundImageUrl: z.string().nullable(),
    backgroundColor: z.string().regex(/^#[0-9a-fA-F]{3,8}$/).nullable(),
    backgroundOpacity: z.number().min(0).max(1),
    backgroundBlur: z.number().min(0).max(20),
    aspectRatio: z.string().regex(/^\d+\s*\/\s*\d+$/).optional().default("4 / 5"),
  }),
  elements: z.array(showcaseElement).max(50),
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

export function migrateShowcaseLayout(layout: unknown): ShowcaseLayout {
  const data = layout as ShowcaseLayout;
  return {
    ...data,
    canvas: {
      ...data.canvas,
      aspectRatio: data.canvas.aspectRatio || "4 / 5",
    },
    elements: data.elements.map((el) => {
      if (el.type === "text") {
        const textEl = el as unknown as Record<string, unknown>;
        // Migrate fontSize from string enum to number
        const fontSize = typeof textEl.fontSize === "string"
          ? (FONT_SIZE_MIGRATION[textEl.fontSize] ?? 16)
          : (textEl.fontSize as number) ?? 16;
        // Migrate fontWeight to bold
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
    }),
  } as ShowcaseLayout;
}
