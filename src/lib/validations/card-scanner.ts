import { z } from "zod";

export const CARD_ID_PATTERN = /^[A-Z]{1,5}\d{1,3}-\d{2,4}$/;

export const saveCardSchema = z.object({
  cardId: z.string().min(1, "Card ID is required").regex(CARD_ID_PATTERN, "Invalid card ID format (e.g. GD03-021)"),
  name: z.string().min(1, "Card name is required").max(200),
  cardType: z.enum(["UNIT", "PILOT", "COMMAND", "BASE", "RESOURCE", "TOKEN"]).nullable().optional(),
  rarity: z.string().max(20).nullable().optional(),
  level: z.number().int().min(0).max(99).nullable().optional(),
  cost: z.number().int().min(0).max(99).nullable().optional(),
  ap: z.number().int().min(0).max(99999).nullable().optional(),
  hp: z.number().int().min(0).max(99999).nullable().optional(),
  abilityText: z.string().max(2000).nullable().optional(),
  pilot: z.string().max(200).nullable().optional(),
  faction: z.string().max(200).nullable().optional(),
  environment: z.string().max(200).nullable().optional(),
  imageUrl: z.string().url("Invalid image URL"),
  imageKey: z.string().min(1, "Image key is required"),
  confidence: z.number().min(0).max(1),
  rawOcrData: z.any().optional(),
});

export type SaveCardInput = z.infer<typeof saveCardSchema>;
