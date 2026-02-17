"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const profileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  banner: z.string().url().optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  socialLinks: z
    .array(
      z.object({
        platform: z.string(),
        url: z.string().url(),
      })
    )
    .optional(),
});

export async function updateProfile(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const socialLinksRaw = formData.get("socialLinks") as string | null;

    const raw = {
      displayName: (formData.get("displayName") as string) || undefined,
      bio: (formData.get("bio") as string) || undefined,
      avatar: (formData.get("avatar") as string) || undefined,
      banner: (formData.get("banner") as string) || undefined,
      accentColor: (formData.get("accentColor") as string) || undefined,
      socialLinks: socialLinksRaw ? JSON.parse(socialLinksRaw) : undefined,
    };

    const parsed = profileSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: "Invalid profile data." };
    }

    const data = parsed.data;

    await db.user.update({
      where: { id: session.user.id },
      data: {
        ...(data.displayName !== undefined && {
          displayName: data.displayName,
        }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        ...(data.banner !== undefined && { banner: data.banner }),
        ...(data.accentColor !== undefined && {
          accentColor: data.accentColor,
        }),
        ...(data.socialLinks !== undefined && {
          socialLinks: data.socialLinks,
        }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("updateProfile error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function pinBuild(buildId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    // Verify the build belongs to the user
    const build = await db.build.findUnique({
      where: { id: buildId },
      select: { userId: true },
    });

    if (!build) {
      return { error: "Build not found." };
    }

    if (build.userId !== session.user.id) {
      return { error: "You can only pin your own builds." };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { pinnedBuildIds: true },
    });

    if (!user) {
      return { error: "User not found." };
    }

    const pinnedIds: string[] = (user.pinnedBuildIds as string[]) ?? [];

    if (pinnedIds.includes(buildId)) {
      return { error: "Build is already pinned." };
    }

    if (pinnedIds.length >= 3) {
      return { error: "You can pin a maximum of 3 builds." };
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        pinnedBuildIds: [...pinnedIds, buildId],
      },
    });

    return { success: true };
  } catch (error) {
    console.error("pinBuild error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function unpinBuild(buildId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { pinnedBuildIds: true },
    });

    if (!user) {
      return { error: "User not found." };
    }

    const pinnedIds: string[] = (user.pinnedBuildIds as string[]) ?? [];

    if (!pinnedIds.includes(buildId)) {
      return { error: "Build is not pinned." };
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        pinnedBuildIds: pinnedIds.filter((id) => id !== buildId),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("unpinBuild error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function updateSectionOrder(sectionOrder: string[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        sectionOrder,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("updateSectionOrder error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function toggleSectionVisibility(section: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { hiddenSections: true },
    });

    if (!user) {
      return { error: "User not found." };
    }

    const hiddenSections: string[] =
      (user.hiddenSections as string[]) ?? [];

    let updatedSections: string[];
    if (hiddenSections.includes(section)) {
      updatedSections = hiddenSections.filter((s) => s !== section);
    } else {
      updatedSections = [...hiddenSections, section];
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        hiddenSections: updatedSections,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("toggleSectionVisibility error:", error);
    return { error: "An unexpected error occurred." };
  }
}
