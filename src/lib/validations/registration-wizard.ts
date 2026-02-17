import { z } from "zod";
import { socialLinksSchema } from "./profile";

/**
 * Step A: Account credentials
 */
export const stepASchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

/**
 * Step B: Builder identity
 */
export const stepBSchema = z.object({
  handle: z
    .string()
    .min(3, "Handle must be at least 3 characters")
    .max(20, "Handle must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Handle can only contain letters, numbers, and underscores"
    ),
  country: z
    .string()
    .optional(),
  skillLevel: z
    .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
    .optional(),
  preferredGrades: z
    .array(z.string())
    .optional(),
  favoriteTimelines: z
    .array(z.string())
    .optional(),
});

/**
 * Step C: Workshop setup
 */
export const stepCSchema = z.object({
  tools: z
    .array(z.string())
    .optional(),
  techniques: z
    .array(z.string())
    .optional(),
});

/**
 * Step D: Profile personalization
 */
export const stepDSchema = z.object({
  bio: z
    .string()
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

export type StepAInput = z.infer<typeof stepASchema>;
export type StepBInput = z.infer<typeof stepBSchema>;
export type StepCInput = z.infer<typeof stepCSchema>;
export type StepDInput = z.infer<typeof stepDSchema>;
