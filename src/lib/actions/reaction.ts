"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reactionSchema } from "@/lib/validations/hangar";

const reactionCounterField: Record<string, string> = {
  RESPECT: "respectCount",
  TECHNIQUE: "techniqueCount",
  CREATIVITY: "creativityCount",
};

export async function toggleReaction(data: { buildId: string; type: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const parsed = reactionSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const { buildId, type } = parsed.data;
    const userId = session.user.id;
    const counterField = reactionCounterField[type];

    // Check if the reaction already exists
    const existingReaction = await db.reaction.findUnique({
      where: {
        userId_buildId_type: { userId, buildId, type },
      },
    });

    if (existingReaction) {
      // Remove reaction and decrement counter atomically
      await db.$transaction(async (tx) => {
        await tx.reaction.delete({
          where: { id: existingReaction.id },
        });

        await tx.build.update({
          where: { id: buildId },
          data: { [counterField]: { decrement: 1 } },
        });
      });

      return { reacted: false, type };
    } else {
      // Create reaction and increment counter atomically
      await db.$transaction(async (tx) => {
        await tx.reaction.create({
          data: {
            userId,
            buildId,
            type,
          },
        });

        await tx.build.update({
          where: { id: buildId },
          data: { [counterField]: { increment: 1 } },
        });
      });

      return { reacted: true, type };
    }
  } catch (error) {
    console.error("toggleReaction error:", error);
    return { error: "An unexpected error occurred." };
  }
}
