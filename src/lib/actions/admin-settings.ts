"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/data/events";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const missionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  rules: z.string().max(10000).optional(),
  prizes: z.string().max(5000).optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  isActive: z.boolean(),
});

export async function createOrUpdateMission(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const admin = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return { error: "Insufficient permissions." };
    }

    const raw = {
      title: formData.get("missionTitle") as string,
      description: formData.get("missionDescription") as string,
      rules: (formData.get("missionRules") as string) || undefined,
      prizes: (formData.get("missionPrizes") as string) || undefined,
      startDate: formData.get("missionStartDate") as string,
      endDate: formData.get("missionEndDate") as string,
      isActive: formData.get("missionActive") === "true",
    };

    const parsed = missionSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: "Invalid mission data." };
    }

    const missionId = (formData.get("missionId") as string) || undefined;

    const data = {
      title: parsed.data.title,
      description: parsed.data.description,
      rules: parsed.data.rules ?? null,
      prizes: parsed.data.prizes ?? null,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      isActive: parsed.data.isActive,
    };

    if (missionId) {
      await db.monthlyMission.update({ where: { id: missionId }, data });
    } else {
      // Deactivate any existing active missions
      if (data.isActive) {
        await db.monthlyMission.updateMany({ where: { isActive: true }, data: { isActive: false } });
      }
      await db.monthlyMission.create({ data });
    }

    await logEvent("SETTING_CHANGED", {
      userId: session.user.id,
      metadata: { key: "monthly_mission", action: missionId ? "update" : "create" },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/forum");
    revalidatePath("/mission");
    return { success: true };
  } catch (error) {
    console.error("[createOrUpdateMission]", error);
    return { error: "Failed to save mission." };
  }
}

export async function updateSetting(key: string, value: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const admin = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return { error: "Insufficient permissions." };
    }

    await db.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value, updatedBy: session.user.id },
    });

    await logEvent("SETTING_CHANGED", {
      userId: session.user.id,
      metadata: { key, value },
    });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("[updateSetting]", error);
    return { error: "Failed to update setting." };
  }
}

export async function addProfanityWord(word: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const admin = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return { error: "Insufficient permissions." };
    }

    const setting = await db.systemSetting.findUnique({
      where: { key: "profanity_custom_words" },
    });

    let words: string[] = [];
    try {
      words = setting?.value ? JSON.parse(setting.value) : [];
    } catch {
      words = [];
    }

    const trimmed = word.trim().toLowerCase();
    if (!trimmed) {
      return { error: "Word cannot be empty." };
    }

    if (words.includes(trimmed)) {
      return { error: "Word already exists." };
    }

    words.push(trimmed);
    const newValue = JSON.stringify(words);

    await db.systemSetting.upsert({
      where: { key: "profanity_custom_words" },
      create: {
        key: "profanity_custom_words",
        value: newValue,
        type: "json",
        label: "Custom Profanity Words",
        group: "moderation",
      },
      update: { value: newValue, updatedBy: session.user.id },
    });

    await logEvent("SETTING_CHANGED", {
      userId: session.user.id,
      metadata: { key: "profanity_custom_words", action: "add", word: trimmed },
    });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("[addProfanityWord]", error);
    return { error: "Failed to add word." };
  }
}

export async function removeProfanityWord(word: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const admin = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return { error: "Insufficient permissions." };
    }

    const setting = await db.systemSetting.findUnique({
      where: { key: "profanity_custom_words" },
    });

    let words: string[] = [];
    try {
      words = setting?.value ? JSON.parse(setting.value) : [];
    } catch {
      words = [];
    }

    const trimmed = word.trim().toLowerCase();
    words = words.filter((w) => w !== trimmed);
    const newValue = JSON.stringify(words);

    await db.systemSetting.upsert({
      where: { key: "profanity_custom_words" },
      create: {
        key: "profanity_custom_words",
        value: newValue,
        type: "json",
        label: "Custom Profanity Words",
        group: "moderation",
      },
      update: { value: newValue, updatedBy: session.user.id },
    });

    await logEvent("SETTING_CHANGED", {
      userId: session.user.id,
      metadata: { key: "profanity_custom_words", action: "remove", word: trimmed },
    });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("[removeProfanityWord]", error);
    return { error: "Failed to remove word." };
  }
}
