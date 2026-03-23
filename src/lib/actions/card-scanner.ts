"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { checkBanned } from "@/lib/security/ban-check";
import { saveCardSchema } from "@/lib/validations/card-scanner";
import { Prisma } from "@prisma/client";

export async function saveScannedCard(data: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const banError = await checkBanned(session.user.id);
    if (banError) return { error: banError };

    const parsed = saveCardSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const rateLimitResult = await checkRateLimit(`card:save:${session.user.id}`, 30, 60_000);
    if (!rateLimitResult.success) {
      return { error: "Too many requests. Please try again later." };
    }

    const {
      cardId, name, cardType, rarity, level, cost, ap, hp,
      abilityText, pilot, faction, environment,
      imageUrl, imageKey, confidence, rawOcrData,
    } = parsed.data;

    const userId = session.user.id;

    // Check for duplicate — increment quantity if exists
    const existing = await db.userCard.findUnique({
      where: { userId_cardId: { userId, cardId } },
    });

    if (existing) {
      await db.userCard.update({
        where: { id: existing.id },
        data: { quantity: { increment: 1 } },
      });
      return { success: true, userCardId: existing.id, duplicate: true, newQuantity: existing.quantity + 1 };
    }

    const userCard = await db.userCard.create({
      data: {
        userId,
        cardId,
        name,
        cardType: cardType ?? undefined,
        rarity: rarity ?? undefined,
        level: level ?? undefined,
        cost: cost ?? undefined,
        ap: ap ?? undefined,
        hp: hp ?? undefined,
        abilityText: abilityText ?? undefined,
        pilot: pilot ?? undefined,
        faction: faction ?? undefined,
        environment: environment ?? undefined,
        confidence,
        rawOcrData: rawOcrData ? (rawOcrData as Prisma.InputJsonValue) : undefined,
        isVerified: confidence >= 0.85,
        imageUrl,
        imageKey,
      },
    });

    return { success: true, userCardId: userCard.id, duplicate: false };
  } catch (error) {
    console.error("saveScannedCard error:", error);
    return { error: "An unexpected error occurred." };
  }
}
