"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hangarSettingsSchema } from "@/lib/validations/hangar";

export async function updateHangarSettings(data: {
  hangarTheme?: string;
  hangarLayout?: string;
  manifesto?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

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

    await db.user.update({
      where: { id: userId },
      data: updates,
    });

    return { success: true };
  } catch (error) {
    console.error("updateHangarSettings error:", error);
    return { error: "An unexpected error occurred." };
  }
}
