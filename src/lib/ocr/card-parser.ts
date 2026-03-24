/**
 * Template-based zone extraction for Gundam Card Game cards.
 * Uses card templates to read specific regions via targeted OCR calls.
 */

import type { Canvas } from "canvas";
import type { VisionResponse, VisionWord } from "./vision-client";
import { detectText } from "./vision-client";
import {
  getTemplate, ABILITY_KEYWORDS, NAME_BLACKLIST,
  type CardTemplate, type CardZone,
} from "./card-templates";
import { cropZone, cropAndRotate90, enhanceContrast, canvasToBase64 } from "./image-preprocessor";

// ── Result type ──────────────────────────────────────────────

export interface ParsedCardData {
  cardNumber: string | null;
  rarity: string | null;
  cardType: string | null;
  level: number | null;
  cost: number | null;
  name: string | null;
  unitId: string | null;
  effect: {
    keywords: string[];
    fullText: string | null;
  };
  zone: string | null;      // environments like "Space, Earth"
  trait: string | null;      // faction/trait
  linkReq: string | null;    // link requirement
  pilot: string | null;
  ap: number | null;
  hp: number | null;
  // Per-field source for debugging
  _debug?: Record<string, string>;
}

// ── Helpers ──────────────────────────────────────────────────

function extractDigits(text: string): number | null {
  const match = text.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function cleanText(text: string): string {
  return text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
}

function filterNoise(text: string): string {
  return text.split(/\s+/)
    .filter((w) => !NAME_BLACKLIST.test(w) && w.length > 1)
    .join(" ")
    .trim();
}

function extractKeywords(text: string): string[] {
  const found: string[] = [];
  for (const kw of ABILITY_KEYWORDS) {
    if (text.includes(kw)) found.push(kw);
  }
  return found;
}

// ── Zone OCR: crop a zone, send to Vision API, return text ──

async function ocrZone(
  cardCanvas: Canvas,
  zone: CardZone,
  imgW: number,
  imgH: number,
  enhance = false,
): Promise<string> {
  let cropped: Canvas;

  if (zone.rotated) {
    cropped = cropAndRotate90(cardCanvas, zone, imgW, imgH);
  } else {
    cropped = cropZone(cardCanvas, zone, imgW, imgH);
  }

  if (enhance) {
    cropped = enhanceContrast(cropped);
  }

  const b64 = canvasToBase64(cropped);
  try {
    const result = await detectText(b64);
    return cleanText(result.fullText);
  } catch {
    return "";
  }
}

// ── Detect card type from left vertical strip ────────────────

async function detectCardType(
  cardCanvas: Canvas,
  imgW: number,
  imgH: number,
  fullText: string,
): Promise<string> {
  // First try: OCR the left vertical strip (rotated text)
  const typeText = await ocrZone(
    cardCanvas,
    { x: 0.00, y: 0.20, w: 0.06, h: 0.50, rotated: true, scale: 2 },
    imgW,
    imgH,
    true,
  );

  const upper = typeText.toUpperCase();
  if (upper.includes("UNIT") && upper.includes("TOKEN")) return "TOKEN";
  if (upper.includes("EX BASE")) return "TOKEN";
  if (upper.includes("UNIT")) return "UNIT";
  if (upper.includes("PILOT")) return "PILOT";
  if (upper.includes("COMMAND")) return "COMMAND";
  if (upper.includes("BASE")) return "BASE";
  if (upper.includes("RESOURCE")) return "RESOURCE";

  // Fallback: check the full text for type keywords
  const fullUpper = fullText.toUpperCase();
  if (fullUpper.includes("UNIT")) return "UNIT";
  if (fullUpper.includes("PILOT")) return "PILOT";
  if (fullUpper.includes("COMMAND")) return "COMMAND";
  if (fullUpper.includes("BASE")) return "BASE";
  if (fullUpper.includes("RESOURCE")) return "RESOURCE";

  return "UNKNOWN";
}

// ── Main parse function: multi-pass template extraction ──────

export async function parseCard(
  cardCanvas: Canvas,
  imgW: number,
  imgH: number,
  coarseVision: VisionResponse,
): Promise<ParsedCardData> {
  const debug: Record<string, string> = {};

  // ── Pass 1: Detect card type ──
  const cardType = await detectCardType(cardCanvas, imgW, imgH, coarseVision.fullText);
  debug.cardType = `detected: ${cardType}`;

  // ── Select template ──
  const template = getTemplate(cardType);

  // ── Pass 2: Per-zone OCR ──

  // Card number (high priority — separate enhanced OCR call)
  const cardNumberRaw = await ocrZone(cardCanvas, template.zones.cardNumber, imgW, imgH, true);
  debug.cardNumber = cardNumberRaw;

  // Level + Cost from top-left
  const levelRaw = await ocrZone(cardCanvas, template.zones.level, imgW, imgH, true);
  const costRaw = await ocrZone(cardCanvas, template.zones.cost, imgW, imgH, true);
  debug.level = levelRaw;
  debug.cost = costRaw;

  // Name
  const nameZone = template.zones.name;
  const nameRaw = nameZone ? await ocrZone(cardCanvas, nameZone, imgW, imgH) : "";
  debug.name = nameRaw;

  // Effect / ability text
  const effectZone = template.zones.effect;
  const effectRaw = effectZone ? await ocrZone(cardCanvas, effectZone, imgW, imgH) : "";
  debug.effect = effectRaw;

  // AP / HP (if template has them)
  let apRaw = "";
  let hpRaw = "";
  if (template.zones.ap) {
    apRaw = await ocrZone(cardCanvas, template.zones.ap, imgW, imgH, true);
    debug.ap = apRaw;
  }
  if (template.zones.hp) {
    hpRaw = await ocrZone(cardCanvas, template.zones.hp, imgW, imgH, true);
    debug.hp = hpRaw;
  }

  // Zone (environments)
  const zoneZone = template.zones.zone;
  const zoneRaw = zoneZone ? await ocrZone(cardCanvas, zoneZone, imgW, imgH, true) : "";
  debug.zone = zoneRaw;

  // Trait
  const traitZone = template.zones.trait;
  const traitRaw = traitZone ? await ocrZone(cardCanvas, traitZone, imgW, imgH, true) : "";
  debug.trait = traitRaw;

  // Link requirement
  const linkZone = template.zones.linkReq;
  const linkRaw = linkZone ? await ocrZone(cardCanvas, linkZone, imgW, imgH) : "";
  debug.linkReq = linkRaw;

  // Unit ID (below name, model number)
  const unitIdZone = template.zones.unitId;
  const unitIdRaw = unitIdZone ? await ocrZone(cardCanvas, unitIdZone, imgW, imgH) : "";
  debug.unitId = unitIdRaw;

  // ── Pass 3: Extract structured values ──

  // Card number: extract pattern XX00-000
  const cardNumMatch = cardNumberRaw.match(/[A-Z0-9]{1,5}\d{1,3}[-–]\d{2,4}/);
  const cardNumber = cardNumMatch ? cardNumMatch[0].replace("–", "-") : null;

  // Rarity: look in the card number zone text
  const rarityMatch = cardNumberRaw.match(/\b(LR\+{0,2}|SR\+?|SSR|R\+?|C\+?|SP|PR)\b/i);
  const rarity = rarityMatch ? rarityMatch[1].toUpperCase() : null;

  // Level + Cost
  const level = extractDigits(levelRaw);
  const costText = costRaw.toUpperCase().replace("COST", "").trim();
  const cost = extractDigits(costText) ?? extractDigits(costRaw);

  // Name: filter noise
  const name = filterNoise(nameRaw) || null;

  // Unit ID
  const unitIdMatch = unitIdRaw.match(/[A-Z]{2,5}-\d{2,4}[A-Z]?/i);
  const unitId = unitIdMatch ? unitIdMatch[0] : null;

  // Effect: extract keywords + clean text
  const keywords = extractKeywords(effectRaw);
  const effectText = effectRaw || null;

  // AP / HP: single digit extraction
  const ap = extractDigits(apRaw);
  const hp = extractDigits(hpRaw);

  // Zone / environments
  const zone = zoneRaw ? cleanText(zoneRaw) : null;

  // Trait
  const trait = traitRaw ? cleanText(traitRaw) : null;

  // Link requirement
  const linkReq = linkRaw ? cleanText(linkRaw) : null;

  // Pilot: check link requirement for pilot names in brackets
  let pilot: string | null = null;
  const pilotMatch = (linkRaw || coarseVision.fullText).match(/\[([^\]]+)\]/);
  if (pilotMatch) pilot = pilotMatch[1];

  return {
    cardNumber,
    rarity,
    cardType: cardType !== "UNKNOWN" ? cardType : null,
    level,
    cost,
    name,
    unitId,
    effect: {
      keywords,
      fullText: effectText,
    },
    zone,
    trait,
    linkReq,
    pilot,
    ap,
    hp,
    _debug: debug,
  };
}
