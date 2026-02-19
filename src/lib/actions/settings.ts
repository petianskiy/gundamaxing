"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/security/password";
import { builderIdentitySchema, privacySettingsSchema, changePasswordSchema, setInitialPasswordSchema, deleteAccountSchema } from "@/lib/validations/settings";


export async function updateBuilderIdentity(data: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const parsed = builderIdentitySchema.safeParse(data);
    if (!parsed.success) {
      return { error: "Invalid data." };
    }

    const d = parsed.data;

    await db.user.update({
      where: { id: session.user.id },
      data: {
        ...(d.country !== undefined && { country: d.country || null }),
        ...(d.skillLevel !== undefined && { skillLevel: d.skillLevel }),
        ...(d.preferredGrades !== undefined && { preferredGrades: d.preferredGrades }),
        ...(d.favoriteTimelines !== undefined && { favoriteTimelines: d.favoriteTimelines }),
        ...(d.favoriteSeries !== undefined && { favoriteSeries: d.favoriteSeries }),
        ...(d.tools !== undefined && { tools: d.tools }),
        ...(d.techniques !== undefined && { techniques: d.techniques }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("updateBuilderIdentity error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function updatePrivacySettings(data: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const parsed = privacySettingsSchema.safeParse(data);
    if (!parsed.success) {
      return { error: "Invalid data." };
    }

    const d = parsed.data;

    await db.user.update({
      where: { id: session.user.id },
      data: {
        isProfilePrivate: d.isProfilePrivate,
        ...(d.hiddenSections !== undefined && { hiddenSections: d.hiddenSections }),
        ...(d.sectionOrder !== undefined && { sectionOrder: d.sectionOrder }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("updatePrivacySettings error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function changePassword(data: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const parsed = changePasswordSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid data.";
      return { error: firstError };
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return { error: "No password set on this account. You may have signed up via OAuth." };
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return { error: "Current password is incorrect." };
    }

    const newHash = await hashPassword(newPassword);

    await db.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newHash },
    });

    return { success: true };
  } catch (error) {
    console.error("changePassword error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function setInitialPassword(data: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const parsed = setInitialPasswordSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid data.";
      return { error: firstError };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (user?.passwordHash) {
      return { error: "Password already set. Use change password instead." };
    }

    const newHash = await hashPassword(parsed.data.newPassword);

    await db.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newHash },
    });

    return { success: true };
  } catch (error) {
    console.error("setInitialPassword error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function deleteAccount(data: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const parsed = deleteAccountSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid data.";
      return { error: firstError };
    }

    const { password } = parsed.data;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return { error: "Cannot verify identity. Contact support." };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { error: "Incorrect password." };
    }

    // Delete user and all related data (cascade)
    await db.user.delete({ where: { id: session.user.id } });

    return { success: true };
  } catch (error) {
    console.error("deleteAccount error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function unlinkAccount(provider: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    if (!provider || typeof provider !== "string") {
      return { error: "Invalid provider." };
    }

    // Find the linked account for this provider
    const account = await db.account.findFirst({
      where: { userId: session.user.id, provider },
    });

    if (!account) {
      return { error: "This provider is not linked to your account." };
    }

    // Safety: ensure at least one login method remains
    const [otherAccounts, user] = await Promise.all([
      db.account.count({
        where: { userId: session.user.id, provider: { not: provider } },
      }),
      db.user.findUnique({
        where: { id: session.user.id },
        select: { passwordHash: true },
      }),
    ]);

    const hasPassword = !!user?.passwordHash;
    if (otherAccounts === 0 && !hasPassword) {
      return { error: "Cannot unlink — this is your only login method. Set a password first." };
    }

    await db.account.delete({ where: { id: account.id } });

    return { success: true };
  } catch (error) {
    console.error("unlinkAccount error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function deleteBuild(buildId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const build = await db.build.findUnique({
      where: { id: buildId },
      select: { userId: true },
    });

    if (!build) {
      return { error: "Build not found." };
    }

    if (build.userId !== session.user.id) {
      return { error: "You can only delete your own builds." };
    }

    await db.build.delete({ where: { id: buildId } });

    return { success: true };
  } catch (error) {
    console.error("deleteBuild error:", error);
    return { error: "An unexpected error occurred." };
  }
}
