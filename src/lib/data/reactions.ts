import { cache } from "react";
import { db } from "@/lib/db";

export const getUserReactionsForBuild = cache(
  async (userId: string, buildId: string): Promise<string[]> => {
    const reactions = await db.reaction.findMany({
      where: { userId, buildId },
      select: { type: true },
    });
    return reactions.map((r) => r.type);
  }
);
