import { z } from "zod";

export const builderIdentitySchema = z.object({
  country: z.string().max(100).optional(),
  skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).optional().nullable(),
  preferredGrades: z.array(z.string()).optional(),
  favoriteTimelines: z.array(z.string()).optional(),
  favoriteSeries: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  techniques: z.array(z.string()).optional(),
});

export const privacySettingsSchema = z.object({
  isProfilePrivate: z.boolean(),
  hiddenSections: z.array(z.string()).optional(),
  sectionOrder: z.array(z.string()).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const setInitialPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
  confirmation: z.literal("DELETE", { message: 'Type "DELETE" to confirm' }),
});

export const changeUsernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(24, "Username must be at most 24 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Only letters, numbers, hyphens, and underscores allowed"
    )
    .transform((v) => v.toLowerCase()),
});

export type BuilderIdentityInput = z.infer<typeof builderIdentitySchema>;
export type PrivacySettingsInput = z.infer<typeof privacySettingsSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type SetInitialPasswordInput = z.infer<typeof setInitialPasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
export type ChangeUsernameInput = z.infer<typeof changeUsernameSchema>;
