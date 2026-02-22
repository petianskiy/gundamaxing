import { z } from "zod";

export const updateSettingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string(),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
