import { z } from "zod";

export const socialLinksSchema = z.object({
  twitter: z.string().url("Invalid URL").optional().or(z.literal("")),
  instagram: z.string().url("Invalid URL").optional().or(z.literal("")),
  youtube: z.string().url("Invalid URL").optional().or(z.literal("")),
  github: z.string().url("Invalid URL").optional().or(z.literal("")),
  discord: z.string().optional().or(z.literal("")),
  tiktok: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export const profileSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name must be at most 50 characters")
    .optional(),
  bio: z
    .string()
    .min(0)
    .max(500, "Bio must be at most 500 characters")
    .optional(),
  avatar: z
    .string()
    .url("Invalid avatar URL")
    .optional()
    .or(z.literal("")),
  banner: z
    .string()
    .url("Invalid banner URL")
    .optional()
    .or(z.literal("")),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color (e.g. #ff0000)")
    .optional(),
  socialLinks: socialLinksSchema.optional(),
});

export type SocialLinksInput = z.infer<typeof socialLinksSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
