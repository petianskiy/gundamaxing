import { z } from "zod";

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(30, "Name must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Name can only contain letters, numbers, hyphens, and underscores"
    ),
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be at most 50 characters"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex code (e.g. #ff0000)"),
  icon: z.string().optional(),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional(),
  permissions: z.array(z.string()),
  priority: z
    .number()
    .int("Priority must be a whole number")
    .min(0, "Priority must be at least 0")
    .max(999, "Priority must be at most 999")
    .optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = createRoleSchema.partial();

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const assignRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  customRoleId: z.string().min(1, "Role ID is required"),
});

export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
