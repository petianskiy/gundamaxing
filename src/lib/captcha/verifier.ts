"use server";

import { createHash } from "crypto";
import { db } from "@/lib/db";

function hashAnswer(answer: string): string {
  return createHash("sha256").update(answer).digest("hex");
}

export interface VerifyCaptchaResult {
  valid: boolean;
  reason?: string;
}

/**
 * Verify a CAPTCHA response.
 *
 * Looks up the challenge by ID, checks expiration and usage status,
 * hashes the selected answer and compares to the stored hash,
 * and marks the challenge as used on success.
 */
export async function verifyCaptcha(
  challengeId: string,
  selectedId: string
): Promise<VerifyCaptchaResult> {
  if (!challengeId || !selectedId) {
    return { valid: false, reason: "Missing challenge ID or answer" };
  }

  const challenge = await db.captchaChallenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge) {
    return { valid: false, reason: "Challenge not found" };
  }

  if (challenge.usedAt) {
    return { valid: false, reason: "Challenge already used" };
  }

  if (new Date() > challenge.expiresAt) {
    return { valid: false, reason: "Challenge expired" };
  }

  const submittedHash = hashAnswer(selectedId);
  const isCorrect = submittedHash === challenge.answerHash;

  // Mark as used regardless of correctness to prevent brute-force
  await db.captchaChallenge.update({
    where: { id: challengeId },
    data: { usedAt: new Date() },
  });

  if (!isCorrect) {
    return { valid: false, reason: "Incorrect answer" };
  }

  return { valid: true };
}
