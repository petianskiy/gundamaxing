"use server";

import { createHash } from "crypto";
import { db } from "@/lib/db";
import { generateSilhouetteChallenge } from "./svg-templates/silhouette-match";
import { generateArmorAlignmentChallenge } from "./svg-templates/armor-alignment";
import { generateLoadoutMatchChallenge } from "./svg-templates/loadout-match";

type CaptchaType = "SILHOUETTE_MATCH" | "ARMOR_ALIGNMENT" | "LOADOUT_MATCH" | "GUNDAM_IDENTIFY" | "TEXT_LOGIC";

// ---- Gundam emoji identification ----

interface GundamEmoji {
  id: string;
  name: string;
  image: string; // path relative to /captcha/
}

const GUNDAM_EMOJIS: GundamEmoji[] = [
  { id: "sazabi", name: "Sazabi", image: "/captcha/sazabi.webp" },
  { id: "purple-gundam", name: "Gundam Mk-II", image: "/captcha/purple-gundam.webp" },
  { id: "gundam", name: "RX-78-2 Gundam", image: "/captcha/gundam.webp" },
];

// Wrong answer names (decoys) — real MS names that aren't in our emoji set
const DECOY_NAMES = [
  "Zaku II",
  "Wing Zero",
  "Barbatos",
  "Exia",
  "Freedom",
  "Strike",
  "Epyon",
  "Tallgeese",
  "Sinanju",
  "Unicorn",
  "Nu Gundam",
  "Destiny",
  "Astray Red Frame",
  "Gouf Custom",
  "Kampfer",
  "Gelgoog",
  "Dom",
  "Qubeley",
  "The O",
  "Hyaku Shiki",
];

function generateGundamIdentifyChallenge(): {
  correctId: string;
  imageUrl: string;
  promptLabel: string;
  options: { id: string; label: string }[];
} {
  // Pick a random Gundam emoji as the target
  const target = GUNDAM_EMOJIS[Math.floor(Math.random() * GUNDAM_EMOJIS.length)];

  // Build wrong options from decoy names
  const wrongNames = [...DECOY_NAMES]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  // Build options: 1 correct + 3 wrong, shuffled
  const options = [
    { id: target.id, label: target.name },
    ...wrongNames.map((name, i) => ({ id: `wrong-${i}`, label: name })),
  ].sort(() => Math.random() - 0.5);

  return {
    correctId: target.id,
    imageUrl: target.image,
    promptLabel: "IDENTIFY THIS MOBILE SUIT",
    options,
  };
}

// ---- Text logic puzzles ----

interface TextLogicPuzzle {
  question: string;
  answer: string;
}

function generateTextLogicPuzzle(): TextLogicPuzzle {
  const puzzles: (() => TextLogicPuzzle)[] = [
    () => {
      const count = 2 + Math.floor(Math.random() * 5); // 2-6
      return {
        question: `A Mobile Suit has 2 arms. How many arms do ${count} Mobile Suits have?`,
        answer: String(count * 2),
      };
    },
    () => {
      const count = 2 + Math.floor(Math.random() * 4); // 2-5
      return {
        question: `A squadron has ${count} units. If 1 unit is destroyed, how many remain?`,
        answer: String(count - 1),
      };
    },
    () => {
      const a = 2 + Math.floor(Math.random() * 6); // 2-7
      const b = 2 + Math.floor(Math.random() * 6); // 2-7
      return {
        question: `A hangar has ${a} mechs. ${b} more arrive. How many mechs total?`,
        answer: String(a + b),
      };
    },
    () => {
      const legs = 2;
      const count = 3 + Math.floor(Math.random() * 5); // 3-7
      return {
        question: `Each mech has ${legs} legs. How many legs on ${count} mechs?`,
        answer: String(legs * count),
      };
    },
    () => {
      const total = 6 + Math.floor(Math.random() * 6); // 6-11
      const launched = 1 + Math.floor(Math.random() * (total - 2)); // 1 to total-2
      return {
        question: `A carrier has ${total} units. ${launched} launch for combat. How many are still docked?`,
        answer: String(total - launched),
      };
    },
    () => {
      const perSquad = 3 + Math.floor(Math.random() * 3); // 3-5
      const squads = 2 + Math.floor(Math.random() * 3); // 2-4
      return {
        question: `There are ${squads} squads with ${perSquad} mechs each. How many mechs in total?`,
        answer: String(perSquad * squads),
      };
    },
  ];

  const selected = puzzles[Math.floor(Math.random() * puzzles.length)];
  return selected();
}

// ---- Hashing ----

function hashAnswer(answer: string): string {
  return createHash("sha256").update(answer).digest("hex");
}

// ---- Visual challenge types (pick random) ----

const visualChallengeTypes: CaptchaType[] = [
  "GUNDAM_IDENTIFY",
  "GUNDAM_IDENTIFY",
  "GUNDAM_IDENTIFY",
  "SILHOUETTE_MATCH",
  "ARMOR_ALIGNMENT",
  "LOADOUT_MATCH",
];

// ---- Public API ----

export interface GenerateChallengeResult {
  challengeId: string;
  type: CaptchaType;
  promptSvg?: string;
  promptImage?: string;
  promptLabel: string;
  options: { id: string; svg?: string; label?: string }[];
}

export interface GenerateTextChallengeResult {
  challengeId: string;
  type: "TEXT_LOGIC";
  question: string;
}

/**
 * Generate a visual CAPTCHA challenge.
 * Picks a random visual challenge type, creates SVG content,
 * hashes the correct answer, stores in DB with 5-minute expiry.
 */
export async function generateChallenge(): Promise<GenerateChallengeResult> {
  const type = visualChallengeTypes[
    Math.floor(Math.random() * visualChallengeTypes.length)
  ];

  let promptSvg: string | undefined;
  let promptImage: string | undefined;
  let promptLabel: string;
  let options: { id: string; svg?: string; label?: string }[];
  let correctId: string;

  switch (type) {
    case "GUNDAM_IDENTIFY": {
      const result = generateGundamIdentifyChallenge();
      promptImage = result.imageUrl;
      promptLabel = result.promptLabel;
      options = result.options;
      correctId = result.correctId;
      break;
    }
    case "SILHOUETTE_MATCH": {
      const result = generateSilhouetteChallenge();
      promptSvg = result.promptSvg;
      promptLabel = "SELECT THE MATCHING UNIT";
      options = result.options;
      correctId = result.correctId;
      break;
    }
    case "ARMOR_ALIGNMENT": {
      const result = generateArmorAlignmentChallenge();
      promptSvg = result.promptSvg;
      promptLabel = "SELECT THE CORRECT ALIGNMENT";
      options = result.options;
      correctId = result.correctId;
      break;
    }
    case "LOADOUT_MATCH": {
      const result = generateLoadoutMatchChallenge();
      promptSvg = result.promptSvg;
      promptLabel = "SELECT THE MATCHING LOADOUT";
      options = result.options;
      correctId = result.correctId;
      break;
    }
    default: {
      // Fallback to silhouette
      const result = generateSilhouetteChallenge();
      promptSvg = result.promptSvg;
      promptLabel = "SELECT THE MATCHING UNIT";
      options = result.options;
      correctId = result.correctId;
      break;
    }
  }

  const answerHash = hashAnswer(correctId);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  const challenge = await db.captchaChallenge.create({
    data: {
      type,
      challengeData: {
        promptLabel,
        optionIds: options.map((o) => o.id),
      },
      answerHash,
      expiresAt,
    },
  });

  return {
    challengeId: challenge.id,
    type,
    promptSvg,
    promptImage,
    promptLabel,
    options,
  };
}

/**
 * Generate a text-based CAPTCHA challenge (accessible fallback).
 */
export async function generateTextChallenge(): Promise<GenerateTextChallengeResult> {
  const puzzle = generateTextLogicPuzzle();
  const answerHash = hashAnswer(puzzle.answer);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const challenge = await db.captchaChallenge.create({
    data: {
      type: "TEXT_LOGIC",
      challengeData: {
        question: puzzle.question,
      },
      answerHash,
      expiresAt,
    },
  });

  return {
    challengeId: challenge.id,
    type: "TEXT_LOGIC",
    question: puzzle.question,
  };
}
