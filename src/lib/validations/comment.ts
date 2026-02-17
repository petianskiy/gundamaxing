import { z } from "zod";

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(5000, "Comment must be at most 5000 characters"),
  buildId: z
    .string()
    .optional(),
  threadId: z
    .string()
    .optional(),
  parentId: z
    .string()
    .optional(),
});

export type CommentInput = z.infer<typeof commentSchema>;
