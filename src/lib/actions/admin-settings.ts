"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/data/events";
import { revalidatePath } from "next/cache";

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
