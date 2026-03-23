/**
 * Post-processing: clean OCR output, validate fields, compute confidence.
 */

import type { ScanResult, GCGCardType, ScanField } from "@/lib/types";
import type { RawCardFields } from "./card-parser";
import { CARD_ID_PATTERN } from "@/lib/validations/card-scanner";

// ── Character disambiguation for card IDs ──

const DIGIT_FIXES: Record<string, string> = { O: "0", o: "0", I: "1", l: "1", S: "5", B: "8" };
const LETTER_FIXES: Record<string, string> = { "0": "O", "1": "I", "5": "S", "8": "B" };

function fixCardId(raw: string): { value: string; confidence: number } {
  let id = raw.replace("–", "-").replace("—", "-").trim();

  // Already valid?
  if (CARD_ID_PATTERN.test(id)) return { value: id, confidence: 0.98 };

  // Try fixing characters in the digit portion
  const parts = id.split("-");
  if (parts.length === 2) {
    // Fix: prefix should be letters+digits, suffix should be digits
    let prefix = parts[0];
    let suffix = parts[1];

    // Letters portion (before first digit in prefix)
    const letterEnd = prefix.search(/\d/);
    if (letterEnd > 0) {
      const letters = prefix.slice(0, letterEnd).split("").map((c) =>
        /\d/.test(c) ? (LETTER_FIXES[c] ?? c) : c.toUpperCase()
      ).join("");
      const digits = prefix.slice(letterEnd).split("").map((c) =>
        /[A-Za-z]/.test(c) ? (DIGIT_FIXES[c] ?? c) : c
      ).join("");
      prefix = letters + digits;
    }

    suffix = suffix.split("").map((c) =>
      /[A-Za-z]/.test(c) ? (DIGIT_FIXES[c] ?? c) : c
    ).join("");

    id = `${prefix}-${suffix}`;
  }

  if (CARD_ID_PATTERN.test(id)) return { value: id, confidence: 0.85 };

  // Couldn't fix — return as-is with low confidence
  return { value: id.toUpperCase(), confidence: 0.4 };
}

// ── Validate card type ──

const VALID_TYPES: GCGCardType[] = ["UNIT", "PILOT", "COMMAND", "BASE", "RESOURCE", "TOKEN"];

function normalizeCardType(raw: string | null): ScanField<GCGCardType | null> {
  if (!raw) return { value: null, confidence: 0.1 };
  const upper = raw.toUpperCase().replace(/\s+/g, " ").trim();
  // Handle "EX BASE · TOKEN"
  if (upper.includes("TOKEN") || upper.includes("EX BASE")) return { value: "TOKEN", confidence: 0.9 };
  const match = VALID_TYPES.find((t) => upper.includes(t));
  if (match) return { value: match, confidence: 0.95 };
  return { value: null, confidence: 0.2 };
}

// ── Parse int safely ──

function parseIntField(raw: string | null, min = 0, max = 99999): ScanField<number | null> {
  if (!raw) return { value: null, confidence: 0.1 };
  const n = parseInt(raw, 10);
  if (isNaN(n)) return { value: null, confidence: 0.2 };
  if (n < min || n > max) return { value: null, confidence: 0.3 };
  return { value: n, confidence: 0.95 };
}

// ── String field ──

function stringField(raw: string | null, expectedMinLen = 1): ScanField<string | null> {
  if (!raw || raw.trim().length < expectedMinLen) return { value: null, confidence: 0.1 };
  return { value: raw.trim(), confidence: 0.8 };
}

// ── Main validation ──

export function validateAndClean(raw: RawCardFields): ScanResult {
  const cardId = raw.cardId ? fixCardId(raw.cardId) : { value: "", confidence: 0.05 };
  const name: ScanField = raw.name
    ? { value: raw.name, confidence: raw.name.length > 2 ? 0.9 : 0.5 }
    : { value: "", confidence: 0.05 };

  const cardType = normalizeCardType(raw.cardType);
  const rarity = stringField(raw.rarity);
  const level = parseIntField(raw.level, 0, 20);
  const cost = parseIntField(raw.cost, 0, 20);
  const ap = parseIntField(raw.ap);
  const hp = parseIntField(raw.hp);
  const abilityText = stringField(raw.abilityText, 5);
  const pilot = stringField(raw.pilot);
  const faction = stringField(raw.faction);
  const environment = stringField(raw.environment);

  // Weighted overall confidence (cardId and name are most important)
  const weights = [
    { conf: cardId.confidence, weight: 3 },
    { conf: name.confidence, weight: 2 },
    { conf: cardType.confidence, weight: 1 },
    { conf: ap.confidence, weight: 0.5 },
    { conf: hp.confidence, weight: 0.5 },
  ];
  const totalWeight = weights.reduce((s, w) => s + w.weight, 0);
  const overallConfidence = weights.reduce((s, w) => s + w.conf * w.weight, 0) / totalWeight;
  const needsReview = overallConfidence < 0.75 || cardId.confidence < 0.7;

  return {
    fields: {
      cardId,
      name,
      cardType,
      rarity,
      level,
      cost,
      ap,
      hp,
      abilityText,
      pilot,
      faction,
      environment,
    },
    overallConfidence: Math.round(overallConfidence * 100) / 100,
    needsReview,
  };
}
