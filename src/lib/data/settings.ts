import { cache } from "react";
import { db } from "@/lib/db";

export const getAllSettings = cache(async () => {
  try {
    const settings = await db.systemSetting.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    return map;
  } catch {
    return {};
  }
});

export const getSetting = cache(async (key: string) => {
  try {
    return await db.systemSetting.findUnique({ where: { key } });
  } catch {
    return null;
  }
});

export async function getSettingValue(
  key: string,
  defaultValue?: string
): Promise<string | undefined> {
  try {
    const setting = await db.systemSetting.findUnique({
      where: { key },
      select: { value: true },
    });
    return setting?.value ?? defaultValue;
  } catch {
    return defaultValue;
  }
}
