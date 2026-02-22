import { cache } from "react";
import { db } from "@/lib/db";

export const getAllSettings = cache(async () => {
  const settings = await db.systemSetting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  return map;
});

export const getSetting = cache(async (key: string) => {
  return db.systemSetting.findUnique({ where: { key } });
});

export async function getSettingValue(
  key: string,
  defaultValue?: string
): Promise<string | undefined> {
  const setting = await db.systemSetting.findUnique({
    where: { key },
    select: { value: true },
  });
  return setting?.value ?? defaultValue;
}
