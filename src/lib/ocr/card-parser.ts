/**
 * Zone-based card field extraction.
 * Uses bounding-box positions from Vision API to assign text to known card zones.
 *
 * Gundam Card Game layout zones (normalized 0-1):
 *   Top-right (x>0.55, y<0.12): Card ID + rarity
 *   Top-left (x<0.3, y<0.2): Level + Cost
 *   Left strip (x<0.08): Card type (vertical text)
 *   Center (0.08<x<0.92, 0.55<y<0.85): Ability text
 *   Bottom (y>0.8): Name, pilot, faction, traits
 *   Bottom corners (y>0.85): AP / HP stat boxes
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

interface NormalizedWord extends VisionWord {
  nx: number; // normalized x center (0-1)
  ny: number; // normalized y center (0-1)
}

function normalizeWords(words: VisionWord[], imgW: number, imgH: number): NormalizedWord[] {
  return words.map((w) => ({
    ...w,
    nx: imgW > 0 ? (w.boundingBox.x + w.boundingBox.width / 2) / imgW : 0,
    ny: imgH > 0 ? (w.boundingBox.y + w.boundingBox.height / 2) / imgH : 0,
  }));
}

function wordsInZone(words: NormalizedWord[], x0: number, y0: number, x1: number, y1: number): NormalizedWord[] {
  return words.filter((w) => w.nx >= x0 && w.nx <= x1 && w.ny >= y0 && w.ny <= y1);
}

function joinWords(words: NormalizedWord[]): string {
  return words
    .sort((a, b) => a.ny - b.ny || a.nx - b.nx)
    .map((w) => w.text)
    .join(" ")
    .trim();
}

// Known card types
const CARD_TYPES = ["UNIT", "PILOT", "COMMAND", "BASE", "RESOURCE", "TOKEN", "EX BASE"];

// Card ID patterns
const CARD_ID_RE = /[A-Z]{1,5}\d{1,3}[-–]\d{2,4}/;

export function parseCardFields(vision: VisionResponse, imgWidth: number, imgHeight: number): RawCardFields {
  const words = normalizeWords(vision.words, imgWidth, imgHeight);
  const fullText = vision.fullText;

  // ── Card ID (top-right zone) ──
  const topRightWords = wordsInZone(words, 0.45, 0, 1, 0.15);
  let cardId: string | null = null;
  for (const w of topRightWords) {
    const match = w.text.match(CARD_ID_RE);
    if (match) { cardId = match[0].replace("–", "-"); break; }
  }
  // Fallback: search full text
  if (!cardId) {
    const fullMatch = fullText.match(CARD_ID_RE);
    if (fullMatch) cardId = fullMatch[0].replace("–", "-");
  }

  // ── Rarity (near card ID, top-right) ──
  const rarityWords = wordsInZone(words, 0.7, 0, 1, 0.12);
  let rarity: string | null = null;
  const rarityPatterns = /\b(LR\+{0,2}|SR|SSR|R\+?|C\+?|SP)\b/i;
  for (const w of rarityWords) {
    const m = w.text.match(rarityPatterns);
    if (m) { rarity = m[1].toUpperCase(); break; }
  }

  // ── Card type (left strip or full text) ──
  let cardType: string | null = null;
  const typeWords = wordsInZone(words, 0, 0, 0.15, 1);
  const allTypeText = joinWords(typeWords).toUpperCase() + " " + fullText.toUpperCase();
  for (const t of CARD_TYPES) {
    if (allTypeText.includes(t)) { cardType = t; break; }
  }

  // ── Level / Cost (top-left zone) ──
  const topLeftWords = wordsInZone(words, 0, 0, 0.35, 0.25);
  let level: string | null = null;
  let cost: string | null = null;
  const topLeftText = joinWords(topLeftWords);
  const lvMatch = topLeftText.match(/(?:Lv\.?\s*)?(\d{1,2})/i);
  if (lvMatch) level = lvMatch[1];
  const costMatch = topLeftText.match(/(?:COST|Cost)\s*(\d{1,2})/i);
  if (costMatch) cost = costMatch[1];
  // If we have two separate numbers in top-left, first is level, second is cost
  if (!cost && level) {
    const nums = topLeftText.match(/\d+/g);
    if (nums && nums.length >= 2) { level = nums[0]; cost = nums[1]; }
  }

  // ── Name (title band: x>0.1, 0.6<y<0.82) ──
  const nameWords = wordsInZone(words, 0.1, 0.55, 0.85, 0.82);
  const name = joinWords(nameWords) || null;

  // ── AP / HP (bottom-right corners, y>0.85) ──
  const statWords = wordsInZone(words, 0.55, 0.85, 1, 1);
  let ap: string | null = null;
  let hp: string | null = null;
  const statNums = statWords.filter((w) => /^\d+$/.test(w.text)).sort((a, b) => a.nx - b.nx);
  if (statNums.length >= 2) {
    ap = statNums[0].text;
    hp = statNums[1].text;
  } else if (statNums.length === 1) {
    ap = statNums[0].text;
  }

  // ── Ability text (center zone) ──
  const abilityWords = wordsInZone(words, 0.08, 0.6, 0.92, 0.88);
  // Filter out name words to avoid duplication
  const abilityOnly = abilityWords.filter((w) => !nameWords.includes(w));
  const abilityText = joinWords(abilityOnly) || null;

  // ── Pilot (look for known patterns in bottom zones) ──
  let pilot: string | null = null;
  const bottomWords = wordsInZone(words, 0.05, 0.85, 0.65, 1);
  const bottomText = joinWords(bottomWords);
  // Pilot names often appear in parentheses or as standalone text
  const pilotMatch = bottomText.match(/\(([^)]+)\)/);
  if (pilotMatch) pilot = pilotMatch[1];

  // ── Faction ──
  let faction: string | null = null;
  const factionMatch = fullText.match(/\(([^)]*(?:Team|Bloc|Force|Corps|Federation|Zeon|AEUG|Titans)[^)]*)\)/i);
  if (factionMatch) faction = factionMatch[1];

  // ── Environment (Space, Earth, etc.) ──
  let environment: string | null = null;
  const envLabels = ["Space", "Earth", "Moon", "Colony", "Underwater"];
  const foundEnvs = envLabels.filter((e) => fullText.includes(e));
  if (foundEnvs.length > 0) environment = foundEnvs.join(", ");

  return {
    cardId,
    rarity,
    name,
    cardType,
    level,
    cost,
    ap,
    hp,
    abilityText,
    pilot,
    faction,
    environment,
    wordCount: words.length,
  };
}
