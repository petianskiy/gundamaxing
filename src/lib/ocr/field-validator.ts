/**
 * Domain-specific validation and normalization for Gundam card fields.
 * Fixes OCR mistakes, validates against known vocabularies, scores confidence.
 */

import type { ScanResult, ScanField, GCGCardType } from "@/lib/types";
import type { ParsedCardData } from "./card-parser";
import { CARD_ID_PATTERN } from "@/lib/validations/card-scanner";
import {
  KNOWN_PREFIXES, VALID_CARD_TYPES, VALID_RARITIES,
  VALID_ZONES, NAME_BLACKLIST,
} from "./card-templates";

// ── Card Number (ID) fixer ───────────────────────────────────

const DIGIT_FROM_LETTER: Record<string, string> = {
  O: "0", o: "0", I: "1", l: "1", S: "5", B: "8", D: "0",
};

function fixCardNumber(raw: string | null): ScanField {
  if (!raw) return { value: "", confidence: 0.05 };

  let id = raw.replace(/[–—]/g, "-").replace(/\s+/g, "").toUpperCase();

  // Already valid?
  if (CARD_ID_PATTERN.test(id)) return { value: id, confidence: 0.98 };

  // Try every known prefix, including confused versions
  for (const prefix of KNOWN_PREFIXES) {
    // Generate all possible confused versions of this prefix
    const confusedVersions = generateConfusedPrefixes(prefix);

    for (const confused of confusedVersions) {
      if (id.startsWith(confused)) {
        // Replace the confused prefix with the correct one
        const rest = id.slice(confused.length);
        // Fix any remaining letters in the digit portion
        const fixedRest = rest.split("").map((c) => {
          if (c === "-") return c;
          if (/[A-Za-z]/.test(c)) return DIGIT_FROM_LETTER[c.toUpperCase()] ?? c;
          return c;
        }).join("");

        const candidate = prefix + fixedRest;
        if (CARD_ID_PATTERN.test(candidate)) {
          return { value: candidate, confidence: 0.93 };
        }
      }
    }
  }

  // Fallback: try to split into prefix letters + digits
  const match = id.match(/^([A-Z0-9]{1,5})(\d{1,3})-?(\d{2,4})$/);
  if (match) {
    let [, pre, mid, suf] = match;
    // Fix any digits that should be letters in the prefix
    pre = pre.replace(/0/g, "O").replace(/1/g, "I");
    // Fix any letters that should be digits in the number parts
    mid = mid.replace(/[A-Za-z]/g, (c) => DIGIT_FROM_LETTER[c.toUpperCase()] ?? c);
    suf = suf.replace(/[A-Za-z]/g, (c) => DIGIT_FROM_LETTER[c.toUpperCase()] ?? c);
    const candidate = `${pre}${mid}-${suf}`;
    if (CARD_ID_PATTERN.test(candidate)) return { value: candidate, confidence: 0.7 };
  }

  return { value: id, confidence: 0.3 };
}

function generateConfusedPrefixes(prefix: string): string[] {
  const results = new Set<string>();
  results.add(prefix);

  // For each character in the prefix, try common OCR confusions
  const confusions: Record<string, string[]> = {
    D: ["0", "O", "D"],
    O: ["0", "O"],
    I: ["1", "I", "l"],
    S: ["5", "S"],
    B: ["8", "B"],
    G: ["6", "G"],
    Z: ["2", "Z"],
    E: ["E", "3"],
  };

  // Generate permutations (only for first 3 chars to keep it manageable)
  function permute(chars: string[], pos: number, current: string) {
    if (pos >= chars.length) { results.add(current); return; }
    const c = chars[pos].toUpperCase();
    const alts = confusions[c] ?? [c];
    for (const alt of alts) {
      permute(chars, pos + 1, current + alt);
    }
  }

  permute(prefix.split(""), 0, "");
  return Array.from(results);
}

// ── Name validator ───────────────────────────────────────────

function validateName(raw: string | null): ScanField {
  if (!raw || raw.trim().length < 2) return { value: "", confidence: 0.05 };

  // Remove any blacklisted words that leaked in
  let cleaned = raw.split(/\s+/).filter((w) => !NAME_BLACKLIST.test(w) && w.length > 1).join(" ").trim();

  // Remove model number patterns (STH-05, MSJ-06, etc.)
  cleaned = cleaned.replace(/\b[A-Z]{2,5}-\d{2,4}[A-Z]?\b/g, "").trim();

  // Remove stray punctuation
  cleaned = cleaned.replace(/^[^\w']+|[^\w']+$/g, "").trim();

  if (cleaned.length < 2) return { value: raw.trim(), confidence: 0.3 };
  return { value: cleaned, confidence: cleaned.length > 3 ? 0.92 : 0.6 };
}

// ── Card type validator ──────────────────────────────────────

function validateCardType(raw: string | null): ScanField<GCGCardType | null> {
  if (!raw) return { value: null, confidence: 0.1 };
  const upper = raw.toUpperCase().trim();
  const match = VALID_CARD_TYPES.find((t) => upper.includes(t));
  if (match) return { value: match as GCGCardType, confidence: 0.95 };
  return { value: null, confidence: 0.2 };
}

// ── Rarity validator ─────────────────────────────────────────

function validateRarity(raw: string | null): ScanField<string | null> {
  if (!raw) return { value: null, confidence: 0.1 };
  const upper = raw.toUpperCase().replace(/\s/g, "");
  const match = VALID_RARITIES.find((r) => upper.includes(r));
  if (match) return { value: match, confidence: 0.9 };
  return { value: null, confidence: 0.2 };
}

// ── Numeric field validator ──────────────────────────────────

function validateNumeric(raw: number | null, min = 0, max = 20): ScanField<number | null> {
  if (raw === null) return { value: null, confidence: 0.1 };
  if (raw < min || raw > max) return { value: null, confidence: 0.2 };
  return { value: raw, confidence: 0.95 };
}

// ── Zone (environment) validator ─────────────────────────────

function validateZone(raw: string | null): ScanField<string | null> {
  if (!raw) return { value: null, confidence: 0.1 };
  const found = VALID_ZONES.filter((z) => raw.toLowerCase().includes(z.toLowerCase()));
  if (found.length > 0) return { value: found.join(", "), confidence: 0.9 };
  return { value: raw.trim(), confidence: 0.4 };
}

// ── Text field (effect, trait, etc.) ─────────────────────────

function validateText(raw: string | null): ScanField<string | null> {
  if (!raw || raw.trim().length < 2) return { value: null, confidence: 0.1 };
  return { value: raw.trim(), confidence: 0.8 };
}

// ── Main validation function ─────────────────────────────────

export function validateAndClean(parsed: ParsedCardData): ScanResult {
  const cardId = fixCardNumber(parsed.cardNumber);
  const name = validateName(parsed.name);
  const cardType = validateCardType(parsed.cardType);
  const rarity = validateRarity(parsed.rarity);
  const level = validateNumeric(parsed.level, 0, 12);
  const cost = validateNumeric(parsed.cost, 0, 12);
  const ap = validateNumeric(parsed.ap, 0, 99);
  const hp = validateNumeric(parsed.hp, 0, 99);
  const abilityText = validateText(parsed.effect.fullText);
  const pilot = validateText(parsed.pilot);
  const faction = validateText(parsed.trait);
  const environment = validateZone(parsed.zone);

  // Weighted confidence
  const weights = [
    { conf: cardId.confidence, weight: 3 },
    { conf: name.confidence, weight: 2.5 },
    { conf: cardType.confidence, weight: 1.5 },
    { conf: level.confidence, weight: 0.5 },
    { conf: cost.confidence, weight: 0.5 },
    { conf: ap.confidence, weight: 0.5 },
    { conf: hp.confidence, weight: 0.5 },
  ];
  const totalWeight = weights.reduce((s, w) => s + w.weight, 0);
  const overallConfidence = Math.round(
    (weights.reduce((s, w) => s + w.conf * w.weight, 0) / totalWeight) * 100
  ) / 100;

  const needsReview = overallConfidence < 0.75 || cardId.confidence < 0.7 || name.confidence < 0.5;

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
    overallConfidence,
    needsReview,
  };
}
