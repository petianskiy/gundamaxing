import { z } from "zod";

export const kitSuggestionSchema = z.object({
  kitName: z.string().min(1, "Kit name is required").max(200),
  seriesName: z.string().min(1, "Series is required").max(200),
  grade: z.string().min(1, "Grade is required"),
  scale: z.string().optional().nullable(),
  manufacturer: z.string().max(100).default("Bandai"),
  notes: z.string().max(500).optional().nullable(),
});
