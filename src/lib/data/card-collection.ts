import { cache } from "react";
import { db } from "@/lib/db";
import { toCdnUrl } from "@/lib/upload/cdn";
import type { UserCardUI, CardCollectionStats } from "@/lib/types";

export const getUserCards = cache(async (userId: string): Promise<UserCardUI[]> => {
  const cards = await db.userCard.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return cards.map((c) => ({
    id: c.id,
    cardId: c.cardId,
    name: c.name,
    cardType: c.cardType as UserCardUI["cardType"],
    rarity: c.rarity,
    level: c.level,
    cost: c.cost,
    ap: c.ap,
    hp: c.hp,
    abilityText: c.abilityText,
    pilot: c.pilot,
    faction: c.faction,
    environment: c.environment,
    confidence: c.confidence,
    isVerified: c.isVerified,
    imageUrl: c.imageUrl.startsWith("http") ? c.imageUrl : toCdnUrl(c.imageUrl),
    quantity: c.quantity,
    createdAt: c.createdAt.toISOString(),
  }));
});

export const getUserCardStats = cache(async (userId: string): Promise<CardCollectionStats> => {
  const cards = await db.userCard.findMany({
    where: { userId },
    select: { cardType: true, confidence: true, quantity: true },
  });

  const byType: Record<string, number> = {};
  let totalCards = 0;
  let totalConfidence = 0;

  for (const c of cards) {
    const key = c.cardType ?? "UNKNOWN";
    byType[key] = (byType[key] || 0) + c.quantity;
    totalCards += c.quantity;
    totalConfidence += c.confidence;
  }

  return {
    totalCards,
    uniqueCards: cards.length,
    byType,
    avgConfidence: cards.length > 0 ? totalConfidence / cards.length : 0,
  };
});
