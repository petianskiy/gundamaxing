import { z } from "zod";

export const hangarSettingsSchema = z.object({
  hangarTheme: z.enum(["CLEAN_LAB", "CYBER_BAY", "DESERT_BATTLEFIELD", "NEON_TOKYO"]).optional(),
  hangarLayout: z.enum(["GALLERY", "DOME_GALLERY", "STORY"]).optional(),
  manifesto: z.string().max(500).optional().or(z.literal("")),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color").optional(),
  domeSettings: z.object({
    selectedBuildIds: z.array(z.string()).max(30).optional(),
    autoSpin: z.boolean().optional(),
    spinSpeed: z.number().min(0).max(5).optional(),
    sphereSize: z.enum(["small", "medium", "large"]).optional(),
    glowColor: z.string().optional(),
    showStars: z.boolean().optional(),
    sphereTitle: z.string().max(40).optional(),
  }).optional(),
  pinnedBuildIds: z.array(z.string()).max(6).optional(),
  featuredBuildId: z.string().optional().nullable(),
});

export const createEraSchema = z.object({
  name: z.string().min(1, "Era name is required").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  coverImage: z.string().url().optional().or(z.literal("")),
});

export const updateEraSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().or(z.literal("")),
  coverImage: z.string().url().optional().or(z.literal("")),
});

export const reactionSchema = z.object({
  buildId: z.string().min(1),
  type: z.enum(["RESPECT", "TECHNIQUE", "CREATIVITY"]),
});
