/**
 * Gundam Card Game — template-based zone definitions.
 * Coordinates are normalized 0-1 relative to the CROPPED card image.
 * Based on official card anatomy diagram.
 */

export interface CardZone {
  x: number;
  y: number;
  w: number;
  h: number;
  rotated?: boolean; // if true, crop and rotate 90° CW before OCR
  scale?: number;    // enlarge factor for small text (default 1)
}

export interface CardTemplate {
  type: string;
  zones: Record<string, CardZone>;
}

// ── Shared zones (all card types) ────────────────────────────

const SHARED: Record<string, CardZone> = {
  cardNumber:  { x: 0.52, y: 0.00, w: 0.48, h: 0.06, scale: 3 },
  cardType:    { x: 0.00, y: 0.20, w: 0.06, h: 0.50, rotated: true, scale: 2 },
  level:       { x: 0.02, y: 0.00, w: 0.16, h: 0.08, scale: 2 },
  cost:        { x: 0.02, y: 0.07, w: 0.16, h: 0.10, scale: 2 },
};

// ── UNIT template ────────────────────────────────────────────

export const UNIT_TEMPLATE: CardTemplate = {
  type: "UNIT",
  zones: {
    ...SHARED,
    name:        { x: 0.08, y: 0.46, w: 0.72, h: 0.08, scale: 2 },
    unitId:      { x: 0.08, y: 0.53, w: 0.55, h: 0.04, scale: 2 },
    effect:      { x: 0.08, y: 0.56, w: 0.82, h: 0.16 },
    zone:        { x: 0.06, y: 0.73, w: 0.32, h: 0.05, scale: 2 },
    linkReq:     { x: 0.06, y: 0.77, w: 0.42, h: 0.05, scale: 2 },
    trait:       { x: 0.42, y: 0.73, w: 0.32, h: 0.05, scale: 2 },
    ap:          { x: 0.70, y: 0.73, w: 0.14, h: 0.11, scale: 2 },
    hp:          { x: 0.84, y: 0.73, w: 0.14, h: 0.11, scale: 2 },
  },
};

// ── PILOT template ───────────────────────────────────────────

export const PILOT_TEMPLATE: CardTemplate = {
  type: "PILOT",
  zones: {
    ...SHARED,
    name:        { x: 0.08, y: 0.50, w: 0.58, h: 0.07, scale: 2 },
    traits:      { x: 0.08, y: 0.56, w: 0.58, h: 0.04, scale: 2 },
    effect:      { x: 0.08, y: 0.42, w: 0.82, h: 0.10 },
    apBoost:     { x: 0.70, y: 0.51, w: 0.14, h: 0.07, scale: 2 },
    hpBoost:     { x: 0.84, y: 0.51, w: 0.14, h: 0.07, scale: 2 },
    linkReq:     { x: 0.06, y: 0.77, w: 0.42, h: 0.05, scale: 2 },
  },
};

// ── BASE template ────────────────────────────────────────────

export const BASE_TEMPLATE: CardTemplate = {
  type: "BASE",
  zones: {
    ...SHARED,
    name:        { x: 0.08, y: 0.48, w: 0.72, h: 0.08, scale: 2 },
    effect:      { x: 0.08, y: 0.55, w: 0.82, h: 0.16 },
    zone:        { x: 0.06, y: 0.73, w: 0.32, h: 0.05, scale: 2 },
    trait:       { x: 0.42, y: 0.73, w: 0.32, h: 0.05, scale: 2 },
    ap:          { x: 0.70, y: 0.73, w: 0.14, h: 0.11, scale: 2 },
    hp:          { x: 0.84, y: 0.73, w: 0.14, h: 0.11, scale: 2 },
  },
};

// ── COMMAND template ─────────────────────────────────────────

export const COMMAND_TEMPLATE: CardTemplate = {
  type: "COMMAND",
  zones: {
    ...SHARED,
    name:        { x: 0.08, y: 0.48, w: 0.72, h: 0.08, scale: 2 },
    effect:      { x: 0.08, y: 0.55, w: 0.82, h: 0.20 },
  },
};

// ── Fallback template (unknown type) ─────────────────────────

export const FALLBACK_TEMPLATE: CardTemplate = {
  type: "UNKNOWN",
  zones: {
    ...SHARED,
    name:        { x: 0.08, y: 0.46, w: 0.72, h: 0.10, scale: 2 },
    effect:      { x: 0.08, y: 0.55, w: 0.82, h: 0.18 },
    ap:          { x: 0.70, y: 0.73, w: 0.14, h: 0.11, scale: 2 },
    hp:          { x: 0.84, y: 0.73, w: 0.14, h: 0.11, scale: 2 },
  },
};

// ── Template selection ───────────────────────────────────────

export function getTemplate(cardType: string): CardTemplate {
  switch (cardType.toUpperCase()) {
    case "UNIT": return UNIT_TEMPLATE;
    case "PILOT": return PILOT_TEMPLATE;
    case "BASE": return BASE_TEMPLATE;
    case "COMMAND": return COMMAND_TEMPLATE;
    default: return FALLBACK_TEMPLATE;
  }
}

// ── Ability keyword list ─────────────────────────────────────

export const ABILITY_KEYWORDS = [
  "Burst", "Deploy", "Main", "Action", "Main / Action",
  "When Linked", "When Paired", "During Pair", "When Attacking",
  "Activate - Main", "Activate - Action",
  "Blocker", "First Strike", "High-Maneuver", "Breach",
  "Support", "Repair", "Close Combat",
];

// ── Domain vocabularies ──────────────────────────────────────

export const VALID_CARD_TYPES = ["UNIT", "PILOT", "COMMAND", "BASE", "RESOURCE", "TOKEN"];

export const VALID_RARITIES = ["C", "C+", "R", "R+", "SR", "SR+", "SSR", "LR", "LR+", "LR++", "SP", "PR"];

export const VALID_ZONES = ["Space", "Earth", "Ground", "Moon", "Colony", "Underwater"];

export const KNOWN_PREFIXES = [
  "GD", "ST", "EXB", "EVX", "PR", "SP", "ZZ", "SD", "EB", "BST", "CP", "LM", "T", "R",
];

export const NAME_BLACKLIST = /\b(Burst|Deploy|Main|Action|Blocker|ILLUST|BANDAI|©|JAPAN|MADE|IN|MBS|SUNRISE|SOTSU|TM|CO|LTD|SR|ST)\b/i;
