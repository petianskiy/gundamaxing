/**
 * Post-processing: clean OCR output, validate fields, compute confidence.
 */

import type { ScanResult, GCGCardType, ScanField } from "@/lib/types";
import type { RawCardFields } from "./card-parser";
import { CARD_ID_PATTERN } from "@/lib/validations/card-scanner";

// ── Character disambiguation for card IDs ──

/**
 * Gundam Card ID format: 2-5 LETTERS + 2-3 DIGITS + hyphen + 2-4 DIGITS
 * Examples: GD02-062, ST09-001, EXB-001, GD03-021
 *
 * Common OCR confusions:
 *   In the LETTER portion: 0→O, 1→I
 *   In the DIGIT portion: O→0, I→1, l→1, S→5, B→8, D→0
 *   Between D and 0: In the prefix letters, always use D; in digit positions, always use 0
 */
const DIGIT_FROM_LETTER: Record<string, string> = { O: "0", o: "0", I: "1", l: "1", S: "5", B: "8", D: "0" };
const LETTER_FROM_DIGIT: Record<string, string> = { "0": "D", "1": "I", "5": "S", "8": "B" };

// Known Gundam set prefixes — helps resolve ambiguity
const KNOWN_PREFIXES = ["GD", "ST", "EXB", "EVX", "T", "R", "SP", "PR", "ZZ"];

function fixCardId(raw: string): { value: string; confidence: number } {
  let id = raw.replace("–", "-").replace("—", "-").replace(/\s+/g, "").trim().toUpperCase();

  // Already valid?
  if (CARD_ID_PATTERN.test(id)) return { value: id, confidence: 0.98 };

  const parts = id.split("-");
  if (parts.length === 2) {
    let prefix = parts[0];
    let suffix = parts[1];

    // Determine where letters end and digits begin in prefix
    // Known prefixes: GD, ST, EXB, etc. — always 1-3 letters then 2-3 digits
    let letterPart = "";
    let digitPart = "";

    // Try matching against known prefixes first
    const knownMatch = KNOWN_PREFIXES.find((p) => {
      const remaining = prefix.slice(p.length);
      return prefix.startsWith(p) ||
        // Fuzzy: check if prefix starts with a confused version
        prefix.replace(/0/g, "O").replace(/1/g, "I").startsWith(p);
    });

    if (knownMatch) {
      letterPart = knownMatch;
      const rest = prefix.slice(knownMatch.length) || prefix.slice(letterPart.length);
      digitPart = rest.split("").map((c) => /[A-Za-z]/.test(c) ? (DIGIT_FROM_LETTER[c] ?? c) : c).join("");
    } else {
      // Split at first digit-like character
      for (let i = 0; i < prefix.length; i++) {
        const c = prefix[i];
        if (/\d/.test(c) || (i >= 2 && "OISB".includes(c))) {
          letterPart = prefix.slice(0, i);
          digitPart = prefix.slice(i);
          break;
        }
      }
      if (!letterPart) { letterPart = prefix.slice(0, 2); digitPart = prefix.slice(2); }

      // Fix letters: any digit in letter portion → letter
      letterPart = letterPart.split("").map((c) => /\d/.test(c) ? (LETTER_FROM_DIGIT[c] ?? c) : c).join("");
      // Fix digits: any letter in digit portion → digit (D→0, O→0, etc.)
      digitPart = digitPart.split("").map((c) => /[A-Za-z]/.test(c) ? (DIGIT_FROM_LETTER[c] ?? c) : c).join("");
    }

    prefix = letterPart + digitPart;

    // Suffix is always digits
    suffix = suffix.split("").map((c) => /[A-Za-z]/.test(c) ? (DIGIT_FROM_LETTER[c] ?? c) : c).join("");

    id = `${prefix}-${suffix}`;
  }

  if (CARD_ID_PATTERN.test(id)) return { value: id, confidence: 0.92 };
  return { value: id, confidence: 0.4 };
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
