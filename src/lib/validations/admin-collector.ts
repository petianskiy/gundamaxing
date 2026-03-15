import { z } from "zod";

export const createKitSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  seriesName: z.string().min(1, "Series name is required").max(200),
  grade: z.string().min(1, "Grade is required"),
  scale: z.string().optional().nullable(),
  releaseYear: z.number().int().min(1979).max(2030).optional().nullable(),
  manufacturer: z.string().default("Bandai"),
  imageUrl: z.string().url().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  modelNumber: z.string().max(50).optional().nullable(),
  japaneseTitle: z.string().max(200).optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  imageFocalX: z.number().min(0).max(1).default(0.5),
  imageFocalY: z.number().min(0).max(1).default(0.5),
  timeline: z.string().optional().nullable(),
  brand: z.string().default("Bandai"),
  category: z.enum(["BANDAI", "THIRD_PARTY"]).default("BANDAI"),
  isActive: z.boolean().default(true),
  seriesId: z.string().optional().nullable(),
});

export const updateKitSchema = createKitSchema.partial().extend({
  id: z.string().min(1),
});

export const createSeriesSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  japaneseTitle: z.string().max(200).optional().nullable(),
  timeline: z.string().optional().nullable(),
  yearStart: z.number().int().optional().nullable(),
  yearEnd: z.number().int().optional().nullable(),
  abbreviation: z.string().max(20).optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const updateSeriesSchema = createSeriesSchema.partial().extend({
  id: z.string().min(1),
});

export const updateSuggestionSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  adminNotes: z.string().max(1000).optional().nullable(),
});
