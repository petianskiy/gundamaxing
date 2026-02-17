"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { containsProfanity } from "@/lib/security/profanity";

// ─── Helpers ──────────────────────────────────────────────────────

async function validateSession(userId: string): Promise<boolean> {
  const session = await auth();
  return session?.user?.id === userId;
}

// ─── Step B: Builder Identity ─────────────────────────────────────

export async function saveBuilderIdentity(
  userId: string,
  data: {
    handle?: string;
    country?: string;
    skillLevel?: string;
    preferredGrades?: string[];
    favoriteTimelines?: string[];
    favoriteSeries?: string[];
  }
): Promise<{ success: true } | { error: string }> {
  try {
    if (!(await validateSession(userId))) {
      return { error: "Unauthorized" };
    }

    const updateData: Record<string, unknown> = {
      onboardingStep: 2,
    };

    if (data.handle !== undefined) {
      // Check profanity
      if (containsProfanity(data.handle)) {
        return { error: "This handle contains inappropriate language and is not allowed." };
      }
      // Check handle uniqueness
      const existing = await db.user.findUnique({
        where: { handle: data.handle.toLowerCase() },
      });
      if (existing && existing.id !== userId) {
        return { error: "This handle is already taken" };
      }
      updateData.handle = data.handle.toLowerCase();
    }

    if (data.country !== undefined) updateData.country = data.country;
    if (data.skillLevel !== undefined) updateData.skillLevel = data.skillLevel;
    if (data.preferredGrades !== undefined) updateData.preferredGrades = data.preferredGrades;
    if (data.favoriteTimelines !== undefined) updateData.favoriteTimelines = data.favoriteTimelines;
    if (data.favoriteSeries !== undefined) updateData.favoriteSeries = data.favoriteSeries;

    await db.user.update({
      where: { id: userId },
      data: updateData,
    });

    return { success: true };
  } catch (error) {
    console.error("[saveBuilderIdentity] Error:", error);
    return { error: "Failed to save builder identity" };
  }
}

// ─── Step C: Workshop Setup ───────────────────────────────────────

export async function saveWorkshopSetup(
  userId: string,
  data: {
    tools?: string[];
    techniques?: string[];
  }
): Promise<{ success: true } | { error: string }> {
  try {
    if (!(await validateSession(userId))) {
      return { error: "Unauthorized" };
    }

    const updateData: Record<string, unknown> = {
      onboardingStep: 3,
    };

    if (data.tools !== undefined) updateData.tools = data.tools;
    if (data.techniques !== undefined) updateData.techniques = data.techniques;

    await db.user.update({
      where: { id: userId },
      data: updateData,
    });

    return { success: true };
  } catch (error) {
    console.error("[saveWorkshopSetup] Error:", error);
    return { error: "Failed to save workshop setup" };
  }
}

// ─── Step D: Profile Personalization ──────────────────────────────

export async function saveProfilePersonalization(
  userId: string,
  data: {
    bio?: string;
    avatar?: string;
    banner?: string;
    accentColor?: string;
    socialLinks?: Record<string, string>;
  }
): Promise<{ success: true } | { error: string }> {
  try {
    if (!(await validateSession(userId))) {
      return { error: "Unauthorized" };
    }

    const updateData: Record<string, unknown> = {
      onboardingStep: 4,
      onboardingComplete: true,
    };

    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.banner !== undefined) updateData.banner = data.banner;
    if (data.accentColor !== undefined) updateData.accentColor = data.accentColor;
    if (data.socialLinks !== undefined) updateData.socialLinks = data.socialLinks;

    await db.user.update({
      where: { id: userId },
      data: updateData,
    });

    return { success: true };
  } catch (error) {
    console.error("[saveProfilePersonalization] Error:", error);
    return { error: "Failed to save profile personalization" };
  }
}

// ─── Complete Onboarding ──────────────────────────────────────────

export async function completeOnboarding(
  userId: string
): Promise<{ success: true } | { error: string }> {
  try {
    if (!(await validateSession(userId))) {
      return { error: "Unauthorized" };
    }

    await db.user.update({
      where: { id: userId },
      data: { onboardingComplete: true },
    });

    return { success: true };
  } catch (error) {
    console.error("[completeOnboarding] Error:", error);
    return { error: "Failed to complete onboarding" };
  }
}
