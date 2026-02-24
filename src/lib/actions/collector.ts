"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { addKitSchema, updateKitSchema, removeKitSchema } from "@/lib/validations/collector";
import { checkAndAwardAchievements } from "@/lib/achievements";

export async function addToCollection(data: { kitId: string; status: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const parsed = addKitSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const rateLimitResult = await checkRateLimit(`collector:add:${session.user.id}`, 30, 60_000);
    if (!rateLimitResult.success) {
      return { error: "Too many requests. Please try again later." };
    }

    const { kitId, status } = parsed.data;
    const userId = session.user.id;

    // Verify the kit exists
    const kit = await db.gunplaKit.findUnique({ where: { id: kitId } });
    if (!kit) {
      return { error: "Kit not found." };
    }

    // Check if user already has this kit
    const existing = await db.userKit.findUnique({
      where: { userId_kitId: { userId, kitId } },
    });

    if (existing) {
      return { error: "Kit is already in your collection." };
    }

    const userKit = await db.userKit.create({
      data: { userId, kitId, status },
    });

    // Fire-and-forget achievement check
    checkAndAwardAchievements(userId, "COLLECTOR").catch(() => {});

    return { success: true, userKitId: userKit.id };
  } catch (error) {
    console.error("addToCollection error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function updateCollectionEntry(data: {
  userKitId: string;
  status?: string;
  buildDifficulty?: number | null;
  partQuality?: number | null;
  overallRating?: number | null;
  review?: string | null;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const parsed = updateKitSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const rateLimitResult = await checkRateLimit(`collector:update:${session.user.id}`, 30, 60_000);
    if (!rateLimitResult.success) {
      return { error: "Too many requests. Please try again later." };
    }

    const { userKitId, ...updates } = parsed.data;

    // Verify ownership
    const userKit = await db.userKit.findUnique({ where: { id: userKitId } });
    if (!userKit) {
      return { error: "Collection entry not found." };
    }
    if (userKit.userId !== session.user.id) {
      return { error: "You can only update your own collection entries." };
    }

    const updateData: Record<string, unknown> = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.buildDifficulty !== undefined) updateData.buildDifficulty = updates.buildDifficulty;
    if (updates.partQuality !== undefined) updateData.partQuality = updates.partQuality;
    if (updates.overallRating !== undefined) updateData.overallRating = updates.overallRating;
    if (updates.review !== undefined) updateData.review = updates.review;

    await db.userKit.update({
      where: { id: userKitId },
      data: updateData,
    });

    return { success: true };
  } catch (error) {
    console.error("updateCollectionEntry error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function removeFromCollection(data: { userKitId: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const parsed = removeKitSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const rateLimitResult = await checkRateLimit(`collector:remove:${session.user.id}`, 30, 60_000);
    if (!rateLimitResult.success) {
      return { error: "Too many requests. Please try again later." };
    }

    const { userKitId } = parsed.data;

    // Verify ownership
    const userKit = await db.userKit.findUnique({ where: { id: userKitId } });
    if (!userKit) {
      return { error: "Collection entry not found." };
    }
    if (userKit.userId !== session.user.id) {
      return { error: "You can only remove your own collection entries." };
    }

    await db.userKit.delete({ where: { id: userKitId } });

    return { success: true };
  } catch (error) {
    console.error("removeFromCollection error:", error);
    return { error: "An unexpected error occurred." };
  }
}
