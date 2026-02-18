import { z } from "zod";

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
  fontSize: z.enum(["sm", "base", "lg", "xl", "2xl", "3xl"]),
  fontWeight: z.enum(["normal", "medium", "semibold", "bold"]),
  fontFamily: z.enum(["geist", "orbitron", "rajdhani", "exo2", "shareTechMono", "audiowide", "chakraPetch"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6,8}$/),
  textAlign: z.enum(["left", "center", "right"]),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6,8}$/).nullable(),
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

const showcaseElement = z.discriminatedUnion("type", [
  showcaseImageElement,
  showcaseTextElement,
  showcaseMetadataElement,
]);

export const showcaseLayoutSchema = z.object({
  version: z.literal(1),
  canvas: z.object({
    backgroundImageUrl: z.string().nullable(),
    backgroundColor: z.string().regex(/^#[0-9a-fA-F]{3,8}$/).nullable(),
    backgroundOpacity: z.number().min(0).max(1),
    backgroundBlur: z.number().min(0).max(20),
  }),
  elements: z.array(showcaseElement).max(50),
});
