import { z } from "zod";

export const createLineageSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be under 100 characters"),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
});

export const updateLineageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean(),
});

export const saveNodesSchema = z.object({
  lineageId: z.string().min(1),
  nodes: z.array(z.object({
    buildId: z.string().min(1),
    parentId: z.string().nullable(),
    annotation: z.string().max(500).nullable(),
    order: z.number().int().min(0),
  })).max(50),
});
