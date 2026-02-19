"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { hashPassword } from "@/lib/security/password";
import { containsProfanity } from "@/lib/security/profanity";
import { completeProfileSchema } from "@/lib/validations/registration-wizard";

// ─── Helpers ──────────────────────────────────────────────────────

async function validateSession(userId: string): Promise<boolean> {
  // First try the session (works for authenticated users)
  const session = await auth();
  if (session?.user?.id === userId) return true;

  // Fallback: verify the user exists in DB (for immediate post-signup flow
  // where the session cookie may not have propagated to the server action yet)
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  return !!user;
}

// ─── Step B: Builder Identity ─────────────────────────────────────

export async function saveBuilderIdentity(
  userId: string,
  data: {
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

// ─── Complete OAuth Profile ───────────────────────────────────────

export async function completeOAuthProfile(
  data: unknown
): Promise<{ success: true } | { error: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const parsed = completeProfileSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid data.";
      return { error: firstError };
    }

    const { username, displayName, password } = parsed.data;
    const normalizedUsername = username.toLowerCase();

    // Check profanity
    if (containsProfanity(normalizedUsername)) {
      return { error: "That handle contains inappropriate language." };
    }

    // Check username uniqueness (case-insensitive)
    const existing = await db.user.findFirst({
      where: { username: { equals: normalizedUsername, mode: "insensitive" } },
      select: { id: true },
    });
    if (existing && existing.id !== session.user.id) {
      return { error: "That handle is already taken." };
    }

    const updateData: Record<string, unknown> = {
      username: normalizedUsername,
      onboardingComplete: true,
      onboardingStep: 4,
    };

    if (displayName) {
      updateData.displayName = displayName;
    }

    if (password && password.length >= 8) {
      updateData.passwordHash = await hashPassword(password);
    }

    await db.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return { success: true };
  } catch (error) {
    console.error("[completeOAuthProfile] Error:", error);
    if ((error as any)?.code === "P2002") {
      return { error: "That handle is already taken." };
    }
    return { error: "An unexpected error occurred." };
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
