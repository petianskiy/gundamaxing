"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hangarSettingsSchema } from "@/lib/validations/hangar";
import { checkBanned } from "@/lib/security/ban-check";

export async function updateHangarSettings(data: {
  hangarTheme?: string;
  hangarLayout?: string;
  manifesto?: string;
  accentColor?: string;
  domeSettings?: { density?: string; autoSpin?: boolean; spinSpeed?: number; grayscale?: boolean };
  pinnedBuildIds?: string[];
  featuredBuildId?: string | null;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const banError = await checkBanned(session.user.id);
    if (banError) return { error: banError };

    const parsed = hangarSettingsSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const userId = session.user.id;
    const updates: Record<string, unknown> = {};

    if (parsed.data.hangarTheme !== undefined) {
      updates.hangarTheme = parsed.data.hangarTheme;
    }
    if (parsed.data.hangarLayout !== undefined) {
      updates.hangarLayout = parsed.data.hangarLayout;
    }
    if (parsed.data.manifesto !== undefined) {
      updates.manifesto = parsed.data.manifesto || null;
    }
    if (parsed.data.accentColor !== undefined) {
      updates.accentColor = parsed.data.accentColor;
    }
    if (parsed.data.domeSettings !== undefined) {
      updates.domeSettings = parsed.data.domeSettings;
    }
    if (parsed.data.pinnedBuildIds !== undefined) {
      // Verify all build IDs belong to this user
      const validBuilds = await db.build.findMany({
        where: { id: { in: parsed.data.pinnedBuildIds }, userId },
        select: { id: true },
      });
      const validIds = new Set(validBuilds.map((b) => b.id));
      updates.pinnedBuildIds = parsed.data.pinnedBuildIds.filter((id) => validIds.has(id));
    }

    // Handle featured build in a transaction
    if (parsed.data.featuredBuildId !== undefined) {
      await db.$transaction(async (tx) => {
        // Unfeature all current builds
        await tx.build.updateMany({
          where: { userId, isFeaturedBuild: true },
          data: { isFeaturedBuild: false },
        });
        // Feature the selected build (if one was chosen)
        if (parsed.data.featuredBuildId) {
          await tx.build.updateMany({
            where: { id: parsed.data.featuredBuildId, userId },
            data: { isFeaturedBuild: true },
          });
        }
        // Update user settings
        await tx.user.update({
          where: { id: userId },
          data: updates,
        });
      });
    } else {
      await db.user.update({
        where: { id: userId },
        data: updates,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("updateHangarSettings error:", error);
    return { error: "An unexpected error occurred." };
  }
}
