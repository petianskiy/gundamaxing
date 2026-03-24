/**
 * Zone-based card field extraction from Google Cloud Vision response.
 *
 * Gundam Card Game layout zones (normalized 0-1 on a CROPPED card image):
 *   Top-left (x<0.25, y<0.18): Level + Cost
 *   Top-right (x>0.55, y<0.10): Card ID + rarity
 *   Left strip (x<0.10): Card type vertical text
 *   Title band (x>0.10, 0.62<y<0.78): Card name + unit model
 *   Stat boxes (x>0.70, y>0.88): AP / HP
 *   Bottom bar (y>0.82): traits, faction, environment
 *   Effect zone (x>0.10, 0.50<y<0.70): ability/effect text
 */

import type { VisionWord, VisionResponse } from "./vision-client";

export interface RawCardFields {
  cardId: string | null;
  rarity: string | null;
  name: string | null;
  cardType: string | null;
  level: string | null;
  cost: string | null;
  ap: string | null;
  hp: string | null;
  abilityText: string | null;
  pilot: string | null;
  faction: string | null;
  environment: string | null;
  wordCount: number;
}

interface NW extends VisionWord {
  nx: number;
  ny: number;
}

// Words to filter from card name (copyright/manufacturer noise)
const NOISE_WORDS = new Set([
  "ILLUST", "BANDAI", "JAPAN", "MADE", "IN", "©ST", "©", "ST",
  "SR", "MBS", "SUNRISE", "SOTSU", "TM", "CO", "LTD", "AC",
  "STH", "MSJ", "XXXG", "RX", "GAT", "GNT", "ASW", "DT",
  "05", "06", "01", "02", "03", "04", "07", "08", "09",
]);

function norm(words: VisionWord[], w: number, h: number): NW[] {
  return words.map((word) => ({
    ...word,
    nx: w > 0 ? (word.boundingBox.x + word.boundingBox.width / 2) / w : 0,
    ny: h > 0 ? (word.boundingBox.y + word.boundingBox.height / 2) / h : 0,
  }));
}

function zone(words: NW[], x0: number, y0: number, x1: number, y1: number): NW[] {
  return words.filter((w) => w.nx >= x0 && w.nx <= x1 && w.ny >= y0 && w.ny <= y1);
}

function join(words: NW[]): string {
  return words.sort((a, b) => a.ny - b.ny || a.nx - b.nx).map((w) => w.text).join(" ").trim();
}

function isNoise(word: string): boolean {
  const upper = word.toUpperCase().replace(/[^A-Z]/g, "");
  return NOISE_WORDS.has(upper) || upper.length <= 1 || /^©/.test(word);
}

const CARD_ID_RE = /[A-Z]{1,5}\d{1,3}[-–]\d{2,4}/;
const CARD_TYPES = ["UNIT", "PILOT", "COMMAND", "BASE", "RESOURCE", "TOKEN", "EX BASE"];
const ENV_LABELS = ["Space", "Earth", "Moon", "Colony", "Underwater"];

export function parseCardFields(vision: VisionResponse, imgWidth: number, imgHeight: number): RawCardFields {
  const words = norm(vision.words, imgWidth, imgHeight);
  const fullText = vision.fullText;

  // ── Card ID (top-right area) ──
  let cardId: string | null = null;
  const topRight = zone(words, 0.45, 0, 1, 0.12);
  for (const w of topRight) {
    const m = w.text.match(CARD_ID_RE);
    if (m) { cardId = m[0].replace("–", "-"); break; }
  }
  if (!cardId) {
    // Broader search in top 20%
    const topAll = zone(words, 0.3, 0, 1, 0.20);
    for (const w of topAll) {
      const m = w.text.match(CARD_ID_RE);
      if (m) { cardId = m[0].replace("–", "-"); break; }
    }
  }
  if (!cardId) {
    const m = fullText.match(CARD_ID_RE);
    if (m) cardId = m[0].replace("–", "-");
  }

  // ── Rarity (near card ID) ──
  let rarity: string | null = null;
  const rarityRe = /\b(LR\+{0,2}|SR|SSR|R\+?|C\+?|SP)\b/i;
  for (const w of topRight) {
    const m = w.text.match(rarityRe);
    if (m) { rarity = m[1].toUpperCase(); break; }
  }
  // Also check the small badge area
  if (!rarity) {
    const m = fullText.match(rarityRe);
    if (m) rarity = m[1].toUpperCase();
  }

  // ── Card Type (left strip or anywhere) ──
  let cardType: string | null = null;
  const leftStrip = zone(words, 0, 0, 0.12, 1);
  const leftText = join(leftStrip).toUpperCase();
  for (const t of CARD_TYPES) {
    if (leftText.includes(t)) { cardType = t; break; }
  }
  if (!cardType) {
    const upperFull = fullText.toUpperCase();
    for (const t of CARD_TYPES) {
      if (upperFull.includes(t)) { cardType = t; break; }
    }
  }

  // ── Level + Cost (top-left) ──
  let level: string | null = null;
  let cost: string | null = null;
  const topLeft = zone(words, 0, 0, 0.30, 0.22);
  const topLeftText = join(topLeft);
  const lvMatch = topLeftText.match(/(?:Lv\.?\s*)?(\d{1,2})/i);
  if (lvMatch) level = lvMatch[1];
  const costMatch = topLeftText.match(/(?:COST|cost)\s*(\d{1,2})/i);
  if (costMatch) cost = costMatch[1];
  if (!cost && level) {
    const nums = topLeftText.match(/\d+/g);
    if (nums && nums.length >= 2) { level = nums[0]; cost = nums[1]; }
  }

  // ── Name (title band: the large card name text) ──
  // Strategy: find the largest/most prominent text in the center-lower area
  // Card names are typically in y=0.58-0.75, large font, not copyright noise
  const nameZone = zone(words, 0.08, 0.55, 0.82, 0.78)
    .filter((w) => !isNoise(w.text) && w.text.length > 1)
    // Sort by font size (approximate: taller bounding boxes = larger text)
    .sort((a, b) => b.boundingBox.height - a.boundingBox.height);
  // Take only the top large words (likely the card name), filter out model numbers
  const nameWords = nameZone
    .filter((w) => !/^[A-Z]{2,4}-?\d{2}/.test(w.text)) // filter model IDs like STH-05
    .slice(0, 5); // card names are rarely more than 5 words
  let name = join(nameWords) || null;
  if (!name || name.length < 3) {
    // Broader fallback
    const broader = zone(words, 0.05, 0.50, 0.90, 0.82)
      .filter((w) => !isNoise(w.text) && w.text.length > 2 && !/^[A-Z]{2,4}-?\d{2}/.test(w.text))
      .sort((a, b) => b.boundingBox.height - a.boundingBox.height)
      .slice(0, 5);
    name = join(broader) || null;
  }

  // ── AP / HP (bottom-right stat boxes — two separate single digits typically) ──
  let ap: string | null = null;
  let hp: string | null = null;
  const statWords = zone(words, 0.55, 0.84, 1, 1)
    .filter((w) => /^\d{1,2}$/.test(w.text))
    .sort((a, b) => a.nx - b.nx);
  if (statWords.length >= 2) {
    ap = statWords[statWords.length - 2].text; // second to last
    hp = statWords[statWords.length - 1].text; // last
  } else if (statWords.length === 1) {
    // Single number — might be "34" which is actually AP=3 HP=4
    const val = statWords[0].text;
    if (val.length === 2) {
      ap = val[0];
      hp = val[1];
    } else {
      ap = val;
    }
  }
  // Fallback: search full text for the pattern at the end (common: "3 4" or "6 5")
  if (!ap) {
    const bottomAll = join(zone(words, 0.40, 0.82, 1, 1));
    // Look for two separate digits near the end
    const twoDigits = bottomAll.match(/(\d)\s+(\d)\s*$/);
    if (twoDigits) { ap = twoDigits[1]; hp = twoDigits[2]; }
    else {
      // Look for a 2-digit number that's actually AP+HP concatenated
      const concat = bottomAll.match(/(\d)(\d)\s*$/);
      if (concat) { ap = concat[1]; hp = concat[2]; }
    }
  }

  // ── Ability text (effect zone, center-lower) ──
  const effectWords = zone(words, 0.10, 0.45, 0.92, 0.65)
    .filter((w) => !isNoise(w.text));
  const abilityText = join(effectWords) || null;

  // ── Pilot (in parentheses in bottom area) ──
  let pilot: string | null = null;
  const bottomText = join(zone(words, 0, 0.82, 0.70, 1));
  const pilotMatch = bottomText.match(/\(([^)]+)\)/);
  if (pilotMatch && !ENV_LABELS.includes(pilotMatch[1])) pilot = pilotMatch[1];

  // ── Faction ──
  let faction: string | null = null;
  const factionRe = /\(([^)]*(?:Team|Bloc|Force|Corps|Federation|Zeon|AEUG|Titans|Teiwaz|Celestial)[^)]*)\)/i;
  const factionMatch = fullText.match(factionRe);
  if (factionMatch) faction = factionMatch[1];

  // ── Environment ──
  let environment: string | null = null;
  const foundEnvs = ENV_LABELS.filter((e) => fullText.includes(e));
  if (foundEnvs.length > 0) environment = foundEnvs.join(", ");

  return {
    cardId, rarity, name, cardType, level, cost, ap, hp,
    abilityText, pilot, faction, environment,
    wordCount: words.length,
  };
}
