import { z } from "zod";

export const hangarSettingsSchema = z.object({
  hangarTheme: z.enum(["CLEAN_LAB", "CYBER_BAY", "DESERT_BATTLEFIELD", "NEON_TOKYO"]).optional(),
  hangarLayout: z.enum(["GALLERY", "BLUEPRINT", "STORY"]).optional(),
  manifesto: z.string().max(500).optional().or(z.literal("")),
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
