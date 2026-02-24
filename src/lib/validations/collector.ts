import { z } from "zod";

export const addKitSchema = z.object({
  kitId: z.string().min(1),
  status: z.enum(["OWNED", "BUILT", "WISHLIST", "BACKLOG"]),
});

export const updateKitSchema = z.object({
  userKitId: z.string().min(1),
  status: z.enum(["OWNED", "BUILT", "WISHLIST", "BACKLOG"]).optional(),
  buildDifficulty: z.number().min(1).max(10).nullable().optional(),
  partQuality: z.number().min(1).max(10).nullable().optional(),
  overallRating: z.number().min(1).max(10).nullable().optional(),
  review: z.string().max(2000).nullable().optional(),
});

export const removeKitSchema = z.object({
  userKitId: z.string().min(1),
});
