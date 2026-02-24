import { z } from "zod";

/** Only allow http:// and https:// URLs (or empty strings). Rejects javascript:, data:, vbscript:, file:, etc. */
export function isSafeUrl(url: string): boolean {
  if (!url || url.trim() === "") return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const safeUrl = (field: string) =>
  z
    .string()
    .url("Invalid URL")
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || isSafeUrl(val), {
      message: `${field} must use http:// or https://`,
    });

export const socialLinksSchema = z.object({
  twitter: safeUrl("Twitter"),
  instagram: safeUrl("Instagram"),
  youtube: safeUrl("YouTube"),
  github: safeUrl("GitHub"),
  discord: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || isSafeUrl(val), {
      message: "Discord must use http:// or https://",
    }),
  tiktok: safeUrl("TikTok"),
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
